import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting: child_id -> { count, resetTime }
const rateLimits = new Map();
const RATE_LIMIT = 1; // 1 request per minute
const WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(childId) {
  const now = Date.now();
  const record = rateLimits.get(childId);

  if (!record || now > record.resetTime) {
    rateLimits.set(childId, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (record.count >= RATE_LIMIT) {
    const waitMs = record.resetTime - now;
    return { allowed: false, remaining: 0, waitMs };
  }

  record.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

/**
 * POST /api/ai/chat
 * Body: { childId, topic, messages, instructions?, systemPrompt? }
 * Response: { success: true, content: string, tokens: {...} }
 */
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { childId, messages, systemPrompt } = req.body;

    if (!childId) {
      return res.status(400).json({ error: 'childId required' });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // Check rate limit
    const rateCheck = checkRateLimit(childId);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        waitMs: rateCheck.waitMs,
        message: `Please wait ${Math.ceil(rateCheck.waitMs / 1000)} seconds before next request`,
      });
    }

    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';

    return res.json({
      success: true,
      content,
      tokens: {
        prompt: response.usage?.prompt_tokens,
        completion: response.usage?.completion_tokens,
        total: response.usage?.total_tokens,
      },
      rateLimit: {
        remaining: rateCheck.remaining,
        resetIn: WINDOW_MS,
      },
    });
  } catch (error) {
    console.error('API Error:', error);

    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid OpenAI API key' });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'OpenAI rate limit hit. Please try again later.',
      });
    }

    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    model: 'gpt-4o-mini',
    rateLimit: `${RATE_LIMIT} request per ${WINDOW_MS / 1000} seconds`,
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ParentApp2 AI Server running on http://localhost:${PORT}`);
  console.log(`📡 OpenAI Model: gpt-4o-mini`);
  console.log(`⏱️  Rate Limit: ${RATE_LIMIT} request/min per child`);
  console.log(`🔑 API Key: ${process.env.OPENAI_API_KEY ? '✓ configured' : '✗ NOT configured'}`);
});
