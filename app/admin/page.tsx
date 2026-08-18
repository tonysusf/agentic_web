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

export default function AdminPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  async function loadSessions() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin");
      const data = (await response.json()) as { sessions?: AdminSession[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Could not load sessions.");
      }

      setSessions(data.sessions || []);
      setSelectedSessionId("");
      setMessages([]);
      return true;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not load sessions.");
      setIsLoggedIn(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSessions()
        .then((isAuthenticated) => setIsLoggedIn(isAuthenticated))
        .finally(() => setIsCheckingSession(false));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Could not sign in.");
      }

      setPassword("");
      setIsLoggedIn(await loadSessions());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not sign in.");
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    setIsLoading(true);

    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      setUsername("");
      setPassword("");
      setSessions([]);
      setMessages([]);
      setSelectedSessionId("");
      setError("");
      setIsLoggedIn(false);
      setIsLoading(false);
    }
  }

  async function selectSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin?sessionId=${encodeURIComponent(sessionId)}`);
      const data = (await response.json()) as { messages?: AdminMessage[]; error?: string };

      if (!response.ok) {
        if (response.status === 401) {
          setIsLoggedIn(false);
        }

        throw new Error(data.error || "Could not load messages.");
      }

      setMessages(data.messages || []);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not load messages.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isCheckingSession) {
    return (
      <main className="admin-login-shell">
        <p className="admin-muted">Checking admin session…</p>
      </main>
    );
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
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
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
        <div className="admin-header-actions">
          <button type="button" onClick={() => loadSessions()} disabled={isLoading}>
            Refresh
          </button>
          <button type="button" onClick={() => void handleLogout()} disabled={isLoading}>
            Sign out
          </button>
        </div>
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
              <div className="admin-message-meta">
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
