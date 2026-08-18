import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { getSql } from "./database";

export const ADMIN_SESSION_COOKIE = "agentic-admin-session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

type AdminUserRow = {
  id: number;
  password_hash: string;
};

let adminSchemaPromise: Promise<void> | null = null;

function derivePasswordKey(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await derivePasswordKey(password, salt);
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, encodedHash: string) {
  const [algorithm, salt, storedKeyHex] = encodedHash.split("$");

  if (algorithm !== "scrypt" || !salt || !storedKeyHex) {
    return false;
  }

  const storedKey = Buffer.from(storedKeyHex, "hex");

  if (storedKey.length !== 64) {
    return false;
  }

  const suppliedKey = await derivePasswordKey(password, salt);
  return timingSafeEqual(storedKey, suppliedKey);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getBootstrapCredentials() {
  if (process.env.NODE_ENV !== "production") {
    return {
      username: process.env.ADMIN_INITIAL_USERNAME?.trim() || "admin",
      password: process.env.ADMIN_INITIAL_PASSWORD || "su"
    };
  }

  const username = process.env.ADMIN_INITIAL_USERNAME?.trim();
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  if (!username || !password) {
    throw new Error("Missing initial admin credentials.");
  }

  if (password.length < 12) {
    throw new Error("ADMIN_INITIAL_PASSWORD must contain at least 12 characters.");
  }

  return { username, password };
}

async function initializeAdminSchema() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash TEXT PRIMARY KEY,
      admin_user_id SMALLINT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS admin_sessions_expires_idx
    ON admin_sessions (expires_at)
  `;

  const existingUsers = (await sql`
    SELECT id
    FROM admin_users
    LIMIT 1
  `) as Array<{ id: number }>;

  if (existingUsers.length === 0) {
    const { username, password } = getBootstrapCredentials();
    const passwordHash = await hashPassword(password);

    await sql`
      INSERT INTO admin_users (id, username, password_hash)
      VALUES (1, ${username}, ${passwordHash})
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

export async function ensureAdminSchema() {
  if (!adminSchemaPromise) {
    adminSchemaPromise = initializeAdminSchema().catch((error) => {
      adminSchemaPromise = null;
      throw error;
    });
  }

  await adminSchemaPromise;
}

async function deleteExpiredAdminSessions() {
  const sql = getSql();
  await sql`DELETE FROM admin_sessions WHERE expires_at <= NOW()`;
}

export async function createAdminSession(username: string, password: string) {
  await ensureAdminSchema();
  await deleteExpiredAdminSessions();

  const sql = getSql();
  const rows = (await sql`
    SELECT id, password_hash
    FROM admin_users
    WHERE username = ${username}
    LIMIT 1
  `) as AdminUserRow[];
  const admin = rows[0];

  if (!admin || !(await verifyPassword(password, admin.password_hash))) {
    return null;
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);

  await sql`
    INSERT INTO admin_sessions (token_hash, admin_user_id, expires_at)
    VALUES (
      ${tokenHash},
      ${admin.id},
      NOW() + (${ADMIN_SESSION_MAX_AGE_SECONDS}::int * INTERVAL '1 second')
    )
  `;

  return token;
}

export async function isAdminSessionValid(token: string) {
  if (!token) {
    return false;
  }

  await ensureAdminSchema();
  await deleteExpiredAdminSessions();

  const sql = getSql();
  const rows = (await sql`
    SELECT token_hash
    FROM admin_sessions
    WHERE token_hash = ${hashSessionToken(token)}
      AND expires_at > NOW()
    LIMIT 1
  `) as Array<{ token_hash: string }>;

  return rows.length === 1;
}

export async function revokeAdminSession(token: string) {
  if (!token) {
    return;
  }

  await ensureAdminSchema();
  const sql = getSql();
  await sql`DELETE FROM admin_sessions WHERE token_hash = ${hashSessionToken(token)}`;
}
