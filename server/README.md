# ParentApp2 AI Server Setup

OpenAI integration for ParentApp2 Quiz Wizard with rate limiting.

## Quick Start

### 1. Get OpenAI API Key
- Go to https://platform.openai.com/account/api-keys
- Create a new API key
- Copy it

### 2. Configure .env file
Edit `.env` in project root:
```
OPENAI_API_KEY=sk-your-key-here
```

### 3. Install Server Dependencies
```bash
npm --prefix server install
```

### 4. Start the Server
```bash
npm --prefix server run dev
```

Expected output:
```
🚀 ParentApp2 AI Server running on http://localhost:3001
📡 OpenAI Model: gpt-4o-mini
⏱️  Rate Limit: 1 request/min per child
🔑 API Key: ✓ configured
```

### 5. Keep Both Running
- Server: `npm --prefix server run dev` (Terminal 1)
- App: `npm run serve` or same dev server (Terminal 2)

## How It Works

### Endpoints
- **POST /api/ai/chat** - Send message to AI
  - Body: `{ childId, messages, systemPrompt }`
  - Returns: `{ success, content, tokens, rateLimit }`

- **GET /api/health** - Server status check

### Rate Limiting
- **1 request per minute per student** (per childId)
- Prevents cost overruns and API abuse
- Returns 429 status when exceeded

### Model
- **gpt-4o-mini**: Fast, cheap, suitable for quiz generation
- Temperature: 0.7 (balanced creativity)
- Max tokens: 2000 per response

## Usage in App

Click "Send to AI" button in Quiz Wizard Step 3:
- Validates topics, questions, settings
- Sends prompt with system instruction
- Shows AI-generated feedback
- Displays token usage and rate limit status

### Error Handling
- Rate limited: "⏱️ 1 request per minute per student"
- No config: "🔌 Start server: npm --prefix server run dev"
- API error: Shows error message from OpenAI

## Deployment Notes

### Local Testing
- Server runs on `http://localhost:3001`
- Client on `http://127.0.0.1:5500` (or similar)
- CORS enabled for local dev

### Production
- Deploy server separately (e.g., Vercel, Railway, Heroku)
- Update `API_BASE` in `src/usecases/aiService.js` to production URL
- Environment variables managed by hosting provider
- Increase rate limits as needed: Edit `RATE_LIMIT` in `server/index.js`

## Troubleshooting

### "AI service not available"
- Server not running. Start with: `npm --prefix server run dev`
- Check server is listening on port 3001

### "API key not configured"
- .env file missing or empty
- Server not restarted after .env changes

### "Rate limit exceeded"
- Wait 1 minute before next request
- Rate limit is per-student, resets every minute

### "OpenAI rate limit hit"
- Your OpenAI account hit API limits
- Check https://platform.openai.com/account/usage
- Upgrade account or wait for reset
