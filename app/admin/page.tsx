"use client";

import { useEffect, useState } from "react";
import { MarkdownText } from "../components/markdown-text";

type AdminSession = {
  sessionId: string;
  messageCount: number;
  firstMessageAt: string;
  lastMessageAt: string;
  preview: string;
};

type AdminMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "admin";
const ADMIN_SESSION_KEY = "agentic-lite-admin-session";

function getAdminHeaders(username: string, password: string) {
  return {
    "x-admin-user": username,
    "x-admin-password": password
  };
}

export default function AdminPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function loadSessions(credentials = { username, password }) {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin", {
        headers: getAdminHeaders(credentials.username, credentials.password)
      });
      const data = (await response.json()) as { sessions?: AdminSession[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Could not load sessions.");
      }

      setSessions(data.sessions || []);
      setSelectedSessionId("");
      setMessages([]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not load sessions.");
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    window.setTimeout(() => {
      const savedSession = window.localStorage.getItem(ADMIN_SESSION_KEY);

      if (!savedSession) {
        return;
      }

      try {
        const credentials = JSON.parse(savedSession) as { username?: string; password?: string };

        if (credentials.username === ADMIN_USER && credentials.password === ADMIN_PASSWORD) {
          setUsername(credentials.username);
          setPassword(credentials.password);
          setIsLoggedIn(true);
          void loadSessions({ username: credentials.username, password: credentials.password });
        }
      } catch {
        window.localStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (username !== ADMIN_USER || password !== ADMIN_PASSWORD) {
      setError("Invalid admin credentials.");
      return;
    }

    setIsLoggedIn(true);
    window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ username, password }));
    await loadSessions();
  }

  async function selectSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin?sessionId=${encodeURIComponent(sessionId)}`, {
        headers: getAdminHeaders(username, password)
      });
      const data = (await response.json()) as { messages?: AdminMessage[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Could not load messages.");
      }

      setMessages(data.messages || []);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not load messages.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <main className="admin-login-shell">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <h1>Agentic Lite Admin</h1>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error ? <p className="admin-error">{error}</p> : null}
          <button type="submit">Sign in</button>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <h1>Chat History</h1>
          <p>Viewing saved chat messages by browser session.</p>
        </div>
        <button type="button" onClick={() => loadSessions()} disabled={isLoading}>
          Refresh
        </button>
      </header>

      {error ? <p className="admin-error">{error}</p> : null}

      <section className="admin-grid">
        <aside className="admin-session-list">
          <h2>Sessions</h2>
          {sessions.length === 0 ? <p className="admin-muted">No sessions yet.</p> : null}
          {sessions.map((session) => (
            <button
              className={session.sessionId === selectedSessionId ? "admin-session active" : "admin-session"}
              key={session.sessionId}
              onClick={() => selectSession(session.sessionId)}
              type="button"
            >
              <strong>{session.preview || "Untitled session"}</strong>
              <span>{session.messageCount} messages</span>
              <small>{new Date(session.lastMessageAt).toLocaleString()}</small>
            </button>
          ))}
        </aside>

        <section className="admin-messages">
          <h2>{selectedSessionId ? "Messages" : "Select a session"}</h2>
          {messages.map((message) => (
            <article className={`admin-message ${message.role}`} key={message.id}>
              <div>
                <strong>{message.role}</strong>
                <time>{new Date(message.createdAt).toLocaleString()}</time>
              </div>
              <div className="message-markdown">
                <MarkdownText text={message.content} />
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
