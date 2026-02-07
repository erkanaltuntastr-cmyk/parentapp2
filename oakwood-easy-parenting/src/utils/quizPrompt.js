import { getDetailedAge } from './date.js';

export function createPrompt(payload){
  const child = payload.child || {};
  const subject = payload.subject || 'General';
  const topics = Array.isArray(payload.topics) ? payload.topics : [];
  const difficulty = payload.difficulty || 'Mixed';
  const instructions = payload.instructions || '';
  const includeHints = Boolean(payload.includeHints);
  const includeExplanations = Boolean(payload.includeExplanations);
  const questionPlan = payload.questionPlan || {};

  const age = getDetailedAge(child.dob);
  const year = child.year ? `Year ${child.year}` : 'Unknown Year';
  const topicLine = topics.length ? topics.join(', ') : 'General coverage';

  return [
    'Oakwood Quiz Request',
    `Learner: ${child.name || 'Pupil'} (${year})`,
    `Age: ${age || 'Unknown'}`,
    `Subject: ${subject}`,
    `Topics: ${topicLine}`,
    `Difficulty: ${difficulty}`,
    `Hints Enabled: ${includeHints ? 'Yes' : 'No'}`,
    `Explain After Answer: ${includeExplanations ? 'Yes' : 'No'}`,
    `Question Plan: ${JSON.stringify(questionPlan)}`,
    instructions ? `Special Instructions: ${instructions}` : ''
  ].filter(Boolean).join('\n');
}
