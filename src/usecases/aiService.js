/**
 * AI Service - Client-side wrapper for OpenAI proxy
 * Communicates with server/index.js on port 3001
 */

const API_BASE = 'http://localhost:3001';

export async function callAI({
  childId,
  messages = [],
  systemPrompt = '',
  onProgress = null,
}) {
  /**
   * Call the AI proxy
   * @param {string} childId - Active child's unique ID (for rate limiting)
   * @param {Array} messages - Conversation history [ { role, content } ]
   * @param {string} systemPrompt - System instruction (e.g., "You are a helpful teacher")
   * @param {Function} onProgress - Optional callback for streaming (future)
   * @returns {Promise} { success, content, tokens, rateLimit }
   */

  if (!childId) {
    throw new Error('childId required for AI service');
  }

  if (!messages.length) {
    throw new Error('messages array required');
  }

  try {
    const response = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        childId,
        messages,
        systemPrompt,
      }),
    });

    if (!response.ok) {
      const error = await response.json();

      if (response.status === 429) {
        throw new Error(
          `Rate limited: ${error.message || 'Please wait before sending another request'}`
        );
      }

      if (response.status === 401) {
        throw new Error('AI service not configured (invalid API key)');
      }

      throw new Error(error.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
}

/**
 * Create a system prompt for quiz feedback
 */
export function createQuizFeedbackPrompt(topic, difficulty, studentLevel) {
  return `You are an expert educational tutor for UK National Curriculum (${topic}, difficulty: ${difficulty}).
The student is at level "${studentLevel}".
Provide constructive, encouraging feedback on their quiz performance.
Focus on:
1. What they did well
2. Key concepts to review
3. One specific tip for improvement
Keep responses concise and age-appropriate.`;
}

/**
 * Create a system prompt for homework assistance
 */
export function createHomeworkPrompt(subject, topic, yearGroup) {
  return `You are a patient tutor helping a Year ${yearGroup} student with ${subject} homework (topic: ${topic}).
Provide step-by-step guidance without giving direct answers.
Encourage the student to think critically.
Use examples that relate to their age level.`;
}

/**
 * Helper: Convert quiz response to chat message
 */
export function formatQuizMessage(quiz) {
  return {
    role: 'user',
    content: `Quiz Topic: ${quiz.topic}
Difficulty: ${quiz.difficulty}
Score: ${quiz.correctCount}/${quiz.totalCount}
Questions Attempted: ${quiz.totalCount}

Please provide feedback on this performance.`,
  };
}

/**
 * Health check - ping the server
 */
export async function healthCheck() {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return null;
  }
}
