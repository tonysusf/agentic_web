import { neon } from "@neondatabase/serverless";

export type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type ChatMessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

let didEnsureSchema = false;

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  return neon(databaseUrl);
}

export async function ensureChatSchema() {
  if (didEnsureSchema) {
    return;
  }

  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS chat_messages_session_created_idx
    ON chat_messages (session_id, created_at)
  `;

  didEnsureSchema = true;
}

export async function getMessages(sessionId: string): Promise<StoredMessage[]> {
  await ensureChatSchema();

  const sql = getSql();
  const rows = (await sql`
    SELECT id, role, content, created_at
    FROM chat_messages
    WHERE session_id = ${sessionId}
    ORDER BY created_at ASC
  `) as ChatMessageRow[];

  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at
  }));
}

export async function saveMessage({
  id,
  sessionId,
  role,
  content
}: {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
}) {
  await ensureChatSchema();

  const sql = getSql();

  await sql`
    INSERT INTO chat_messages (id, session_id, role, content)
    VALUES (${id}, ${sessionId}, ${role}, ${content})
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function countUserMessagesToday(sessionId: string) {
  await ensureChatSchema();

  const sql = getSql();
  const rows = (await sql`
    SELECT COUNT(*)::int AS count
    FROM chat_messages
    WHERE session_id = ${sessionId}
      AND role = 'user'
      AND created_at >= date_trunc('day', NOW())
  `) as Array<{ count: number }>;

  return rows[0]?.count || 0;
}
