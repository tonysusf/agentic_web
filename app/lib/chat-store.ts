import { neon } from "@neondatabase/serverless";

export type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type StoredSession = {
  sessionId: string;
  messageCount: number;
  firstMessageAt: string;
  lastMessageAt: string;
  preview: string;
};

type ChatMessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type ChatSessionRow = {
  session_id: string;
  message_count: number;
  first_message_at: string;
  last_message_at: string;
  preview: string;
};

const CHAT_HISTORY_RETENTION_DAYS = 1;

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

  await sql`
    CREATE INDEX IF NOT EXISTS chat_messages_created_idx
    ON chat_messages (created_at)
  `;

  didEnsureSchema = true;
}

async function deleteExpiredChatMessages() {
  await ensureChatSchema();

  const sql = getSql();

  await sql`
    DELETE FROM chat_messages
    WHERE created_at < NOW() - (${CHAT_HISTORY_RETENTION_DAYS}::int * INTERVAL '1 day')
  `;
}

export async function getMessages(sessionId: string): Promise<StoredMessage[]> {
  await ensureChatSchema();
  await deleteExpiredChatMessages();

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

export async function deleteMessages(sessionId: string) {
  await ensureChatSchema();

  const sql = getSql();
  const rows = (await sql`
    DELETE FROM chat_messages
    WHERE session_id = ${sessionId}
    RETURNING id
  `) as Array<{ id: string }>;

  return rows.length;
}

export async function getRecentMessages(sessionId: string, limit: number): Promise<StoredMessage[]> {
  if (limit <= 0) {
    return [];
  }

  await ensureChatSchema();
  await deleteExpiredChatMessages();

  const sql = getSql();
  const rows = (await sql`
    SELECT id, role, content, created_at
    FROM (
      SELECT id, role, content, created_at
      FROM chat_messages
      WHERE session_id = ${sessionId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    ) AS recent_messages
    ORDER BY created_at ASC
  `) as ChatMessageRow[];

  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at
  }));
}

export async function listSessions(): Promise<StoredSession[]> {
  await ensureChatSchema();
  await deleteExpiredChatMessages();

  const sql = getSql();
  const rows = (await sql`
    SELECT DISTINCT ON (session_id)
      session_id,
      COUNT(*) OVER (PARTITION BY session_id)::int AS message_count,
      MIN(created_at) OVER (PARTITION BY session_id) AS first_message_at,
      MAX(created_at) OVER (PARTITION BY session_id) AS last_message_at,
      content AS preview
    FROM chat_messages
    ORDER BY session_id, created_at ASC
  `) as ChatSessionRow[];

  return rows
    .map((row) => ({
      sessionId: row.session_id,
      messageCount: row.message_count,
      firstMessageAt: row.first_message_at,
      lastMessageAt: row.last_message_at,
      preview: row.preview
    }))
    .sort((left, right) => Date.parse(right.lastMessageAt) - Date.parse(left.lastMessageAt));
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
  await deleteExpiredChatMessages();

  const sql = getSql();

  await sql`
    INSERT INTO chat_messages (id, session_id, role, content)
    VALUES (${id}, ${sessionId}, ${role}, ${content})
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function countUserMessagesToday(sessionId: string) {
  await ensureChatSchema();
  await deleteExpiredChatMessages();

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
