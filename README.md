# Agentic Web

Agentic Web is a Next.js AI demo project for exploring agentic AI concepts and modern LLM application patterns. It demonstrates selectable chat and embedding models through OpenRouter, database-backed conversation history, configurable context windows, usage limits, and a lightweight interface for inspecting model responses.

The project is intended as a practical learning and portfolio demo rather than a production-ready AI agent. It provides a foundation for experimenting with tool use, embedding generation, semantic search, and vector or embedding database integrations.

Live demo: `https://agentic.im996.com/`.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Vercel

Deploy the repository as a Next.js project, then add `agentic.im996.com` in Vercel project domains and point DNS to Vercel as instructed.

Required environment variables:

```bash
DATABASE_URL=...
CHAT_DAILY_QUESTION_LIMIT=10
CHAT_CONTEXT_WINDOW_LENGTH=4
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
OPENROUTER_SITE_URL=https://agentic.im996.com
ADMIN_INITIAL_USERNAME=admin
ADMIN_INITIAL_PASSWORD=...
```

The initial admin credentials are used only when the `admin_users` table is empty. Production requires a password of at least 12 characters. After the first administrator is created, authentication uses the salted password hash stored in the database. Local development falls back to `admin` / `su` when the two admin variables are omitted.
