"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Library,
  PanelRight,
  Plus,
  Search,
  Sparkles,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { MarkdownText } from "./components/markdown-text";

type ApiResponse = {
  result: string;
  openRouterResponse: unknown;
};

type ApiErrorResponse = {
  error?: string;
  openRouterResponse?: unknown;
};

type ConsoleEntry = {
  id: string;
  callNumber: number;
  prompt: string;
  status: "success" | "error";
  timestamp: string;
  payload: unknown;
};

class PromptApiError extends Error {
  payload: unknown;

  constructor(message: string, payload: unknown) {
    super(message);
    this.name = "PromptApiError";
    this.payload = payload;
  }
}

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
};

type HistoryResponse = {
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
  }>;
};

const SESSION_STORAGE_KEY = "agentic-lite-session-id";
const CONSOLE_STORAGE_KEY = "agentic-lite-llm-logs";
const CONSOLE_LOG_RETENTION_MS = 24 * 60 * 60 * 1000;

function isConsoleEntry(value: unknown): value is ConsoleEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<ConsoleEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.callNumber === "number" &&
    typeof entry.prompt === "string" &&
    (entry.status === "success" || entry.status === "error") &&
    typeof entry.timestamp === "string"
  );
}

function removeExpiredConsoleEntries(entries: ConsoleEntry[]) {
  const oldestAllowedTimestamp = Date.now() - CONSOLE_LOG_RETENTION_MS;

  return entries.filter((entry) => Date.parse(entry.timestamp) > oldestAllowedTimestamp);
}

function loadConsoleEntries() {
  try {
    const storedValue = window.localStorage.getItem(CONSOLE_STORAGE_KEY);
    const parsedValue = storedValue ? (JSON.parse(storedValue) as unknown) : [];
    const entries = Array.isArray(parsedValue) ? parsedValue.filter(isConsoleEntry) : [];
    return removeExpiredConsoleEntries(entries);
  } catch {
    return [];
  }
}

function saveConsoleEntries(entries: ConsoleEntry[]) {
  try {
    if (entries.length === 0) {
      window.localStorage.removeItem(CONSOLE_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(CONSOLE_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Keep the in-memory console working if browser storage is unavailable or full.
  }
}

function getExistingSessionId() {
  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

function getOrCreateSessionId() {
  const existingSessionId = getExistingSessionId();

  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId = crypto.randomUUID();
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

async function submitPrompt(prompt: string, sessionId: string, model: string) {
  const response = await fetch("/api/prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, prompt, sessionId })
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new PromptApiError(
      data?.error || "Agentic Lite could not process that prompt.",
      data?.openRouterResponse ?? data
    );
  }

  return (await response.json()) as ApiResponse;
}

async function loadHistory(sessionId: string) {
  const response = await fetch(`/api/history?sessionId=${encodeURIComponent(sessionId)}`);

  if (!response.ok) {
    throw new Error("Could not load chat history.");
  }

  return (await response.json()) as HistoryResponse;
}

async function deleteHistory(sessionId: string) {
  const response = await fetch(`/api/history?sessionId=${encodeURIComponent(sessionId)}`, {
    method: "DELETE"
  });
  const data = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(data?.error || "Could not delete chat history.");
  }
}

function AgenticMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <Sparkles size={18} strokeWidth={2.4} />
    </span>
  );
}

function AssistantLogo() {
  return (
    <div className="assistant-logo" aria-label="Agentic Lite">
      <AgenticMark />
      <span>agentic</span>
      <em>Lite</em>
    </div>
  );
}

function ModelSelector({
  disabled,
  models,
  onChange,
  value
}: {
  disabled: boolean;
  models: Array<{ id: string; label: string }>;
  onChange: (model: string) => void;
  value: string;
}) {
  return (
    <label className="model-selector">
      <span>Model</span>
      <select
        aria-label="LLM model"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function OpenRouterConsole({ entries }: { entries: ConsoleEntry[] }) {
  const latestEntryId = entries[0]?.id;
  const [entryVisibilityOverrides, setEntryVisibilityOverrides] = useState<Map<string, boolean>>(
    new Map()
  );

  function toggleEntry(entryId: string, isExpanded: boolean) {
    setEntryVisibilityOverrides((currentOverrides) => {
      const nextOverrides = new Map(currentOverrides);
      nextOverrides.set(entryId, !isExpanded);
      return nextOverrides;
    });
  }

  return (
    <aside
      className="openrouter-console"
      id="llm-log-console"
      aria-label="OpenRouter response console"
    >
      <header className="console-header">
        <h2>LLM log console</h2>
        <span>{entries.length} calls</span>
      </header>

      <div className="console-output" aria-live="polite">
        {entries.length === 0 ? (
          <div className="console-empty">
            <span aria-hidden="true">{`{ }`}</span>
            <p>Responses will appear here after you send a prompt.</p>
          </div>
        ) : (
          entries.map((entry) => {
            const isExpanded =
              entryVisibilityOverrides.get(entry.id) ?? entry.id === latestEntryId;
            const contentId = `console-entry-${entry.id}`;

            return (
              <article className="console-entry" key={entry.id}>
                <button
                  type="button"
                  className="console-entry-toggle"
                  aria-controls={contentId}
                  aria-expanded={isExpanded}
                  onClick={() => toggleEntry(entry.id, isExpanded)}
                >
                  <span className="console-entry-meta">
                    <strong>Call {entry.callNumber}</strong>
                    <span className={`console-status console-status-${entry.status}`}>
                      {entry.status}
                    </span>
                    <time dateTime={entry.timestamp}>
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </time>
                    <ChevronDown className="console-entry-chevron" size={15} />
                  </span>
                  <span className="console-prompt" title={entry.prompt}>
                    {entry.prompt}
                  </span>
                </button>
                {isExpanded ? (
                  <pre id={contentId}>
                    <code>{JSON.stringify(entry.payload, null, 2)}</code>
                  </pre>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </aside>
  );
}

function TypingMessage({
  text,
  onComplete
}: {
  text: string;
  onComplete: () => void;
}) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    let currentIndex = 0;
    const intervalId = window.setInterval(() => {
      currentIndex += 1;
      setVisibleText(text.slice(0, currentIndex));

      if (currentIndex >= text.length) {
        window.clearInterval(intervalId);
        onComplete();
      }
    }, 18);

    return () => window.clearInterval(intervalId);
  }, [onComplete, text]);

  return (
    <div className="message-markdown">
      <MarkdownText text={visibleText} />
      <span className="typing-caret" aria-hidden="true" />
    </div>
  );
}

type AgenticClientProps = {
  initialChatOpen?: boolean;
  contextWindowLength: number;
  freeModels: Array<{ id: string; label: string }>;
  llmModel: string;
};

export default function AgenticClient({
  contextWindowLength,
  freeModels,
  initialChatOpen = false,
  llmModel
}: AgenticClientProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState(llmModel);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(initialChatOpen);
  const [isConsoleVisible, setIsConsoleVisible] = useState(true);
  const [sessionId, setSessionId] = useState("");
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [consoleStorageReady, setConsoleStorageReady] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const conversationRef = useRef(0);
  const canSubmit = prompt.trim().length > 0 && !isSubmitting;

  useEffect(() => {
    window.setTimeout(() => {
      const existingSessionId = getExistingSessionId();

      if (!initialChatOpen) {
        if (existingSessionId) {
          window.location.replace("/chat");
        }
        return;
      }

      const currentSessionId = existingSessionId || getOrCreateSessionId();
      setSessionId(currentSessionId);

      loadHistory(currentSessionId)
        .then((data) => {
          setMessages(data.messages);
        })
        .catch((caughtError) => {
          setError(caughtError instanceof Error ? caughtError.message : "Could not load chat history.");
        });
    }, 0);
  }, [initialChatOpen]);

  useEffect(() => {
    const loadTimeout = window.setTimeout(() => {
      setConsoleEntries(loadConsoleEntries());
      setConsoleStorageReady(true);
    }, 0);

    const cleanupInterval = window.setInterval(() => {
      setConsoleEntries((currentEntries) => removeExpiredConsoleEntries(currentEntries));
    }, 60_000);

    return () => {
      window.clearTimeout(loadTimeout);
      window.clearInterval(cleanupInterval);
    };
  }, []);

  useEffect(() => {
    if (consoleStorageReady) {
      saveConsoleEntries(consoleEntries);
    }
  }, [consoleEntries, consoleStorageReady]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setError("Type a prompt first.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setIsChatOpen(true);
    if (!isChatOpen) {
      window.history.pushState(null, "", "/chat");
    }
    setPrompt("");
    const conversationId = conversationRef.current;
    const currentSessionId = sessionId || getOrCreateSessionId();
    setSessionId(currentSessionId);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedPrompt
    };

    const messagesWithUser = [...messages, userMessage];
    setMessages(messagesWithUser);

    try {
      const data = await submitPrompt(trimmedPrompt, currentSessionId, selectedModel);
      if (conversationRef.current !== conversationId) {
        return;
      }
      setConsoleEntries((currentEntries) => [
        {
          id: crypto.randomUUID(),
          callNumber: currentEntries.length + 1,
          prompt: trimmedPrompt,
          status: "success",
          timestamp: new Date().toISOString(),
          payload: data.openRouterResponse
        },
        ...currentEntries
      ]);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.result,
        isTyping: true
      };
      setMessages((currentMessages) => {
        return [...currentMessages, assistantMessage];
      });
    } catch (caughtError) {
      if (conversationRef.current === conversationId) {
        if (caughtError instanceof PromptApiError) {
          setConsoleEntries((currentEntries) => [
            {
              id: crypto.randomUUID(),
              callNumber: currentEntries.length + 1,
              prompt: trimmedPrompt,
              status: "error",
              timestamp: new Date().toISOString(),
              payload: caughtError.payload
            },
            ...currentEntries
          ]);
        }
        setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
      }
    } finally {
      if (conversationRef.current === conversationId) {
        setIsSubmitting(false);
      }
    }
  }

  function handleTextareaKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  function handleNewTask() {
    conversationRef.current += 1;
    setMessages([]);
    setPrompt("");
    setError("");
    setIsSubmitting(false);
    setIsChatOpen(true);
    window.history.pushState(null, "", "/chat");
    const currentSessionId = sessionId || getOrCreateSessionId();
    setSessionId(currentSessionId);
  }

  async function handleDeleteChat() {
    if (messages.length === 0 || isSubmitting || isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this chat permanently? This removes its messages from Agentic Lite."
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const currentSessionId = sessionId || getOrCreateSessionId();
      await deleteHistory(currentSessionId);
      conversationRef.current += 1;
      setMessages([]);
      setConsoleEntries([]);
      setPrompt("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not delete chat history.");
    } finally {
      setIsDeleting(false);
    }
  }

  const composer = (
    <form className="composer" aria-label="Task prompt" onSubmit={handleSubmit} ref={formRef}>
      <label className="sr-only" htmlFor="task">
        Assign a task or ask anything
      </label>
      <textarea
        id="task"
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={handleTextareaKeyDown}
        placeholder={isChatOpen ? "Message Agentic" : "Assign a task or ask anything"}
        rows={isChatOpen ? 1 : 4}
        value={prompt}
      />
      <div className="composer-actions">
        <button
          type="submit"
          className={`round-control submit-control${canSubmit ? " submit-control-active" : ""}`}
          aria-label="Submit task"
          disabled={!canSubmit}
        >
          <ArrowUp size={22} strokeWidth={2.4} />
        </button>
      </div>
    </form>
  );

  if (isChatOpen) {
    return (
      <main className={`chat-shell${isConsoleVisible ? "" : " console-hidden"}`}>
        <aside className="chat-sidebar" aria-label="Workspace navigation">
          <SidebarContent
            currentTask={messages[0]?.content || "Current task"}
            deleteDisabled={messages.length === 0 || isSubmitting || isDeleting}
            isDeleting={isDeleting}
            onDeleteChat={handleDeleteChat}
            onNewTask={handleNewTask}
          />
        </aside>

        <section className="chat-main" aria-label="Chat">
          <header className="chat-header">
            <h1>Agentic Lite</h1>
            <div className="chat-header-meta" aria-label="LLM settings">
              <ModelSelector
                disabled={isSubmitting}
                models={freeModels}
                onChange={setSelectedModel}
                value={selectedModel}
              />
              <span className="model-badge">
                <span>Content length:</span>
                <strong>{contextWindowLength} messages</strong>
              </span>
              <button
                type="button"
                className="console-toggle"
                aria-controls="llm-log-console"
                aria-expanded={isConsoleVisible}
                onClick={() => setIsConsoleVisible((currentValue) => !currentValue)}
              >
                <PanelRight size={15} />
                <span>{isConsoleVisible ? "Hide logs" : "Show logs"}</span>
              </button>
            </div>
          </header>

          <div className="mobile-chat-nav">
            <SidebarContent
              currentTask={messages[0]?.content || "Current task"}
              deleteDisabled={messages.length === 0 || isSubmitting || isDeleting}
              isDeleting={isDeleting}
              onDeleteChat={handleDeleteChat}
              onNewTask={handleNewTask}
            />
          </div>

          <div className="messages">
            {messages.length === 0 && !isSubmitting && !error && (
              <article className="empty-chat">
                <p className="message-role">New task</p>
                <h2>What can I do for you?</h2>
                <p>Start a fresh chat from the composer below.</p>
              </article>
            )}

            {messages.map((message) => (
              <article className={`message message-${message.role}`} key={message.id}>
                {message.role === "user" ? <p className="message-role">You</p> : <AssistantLogo />}
                {message.isTyping ? (
                  <TypingMessage
                    text={message.content}
                    onComplete={() =>
                      setMessages((currentMessages) =>
                        currentMessages.map((currentMessage) =>
                          currentMessage.id === message.id ? { ...currentMessage, isTyping: false } : currentMessage
                        )
                      )
                    }
                  />
                ) : (
                  <div className="message-markdown">
                    <MarkdownText text={message.content} />
                  </div>
                )}
              </article>
            ))}

            {isSubmitting && (
              <article className="message message-assistant message-thinking">
                <AssistantLogo />
                <div
                  className="thinking-indicator"
                  role="status"
                  aria-label="Agentic Lite is thinking through your request"
                >
                  <div className="thinking-copy">
                    <span>Thinking through your request</span>
                    <span className="thinking-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                  <span className="thinking-track" aria-hidden="true">
                    <span />
                  </span>
                </div>
              </article>
            )}

            {error && (
              <article className="message message-error">
                <p className="message-role">Error</p>
                <p>{error}</p>
              </article>
            )}
          </div>

          <div className="chat-composer">{composer}</div>
        </section>

        {isConsoleVisible ? <OpenRouterConsole entries={consoleEntries} /> : null}
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Agentic home">
          <AgenticMark />
          <span>agentic</span>
        </Link>
      </header>

      <a className="announcement" href="#business">
        <span>Agentic is built for autonomous work across teams worldwide</span>
        <ArrowRight size={18} strokeWidth={2.1} />
      </a>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-inner">
          <h1 id="hero-title">What can I do for you?</h1>

          {composer}

          {(isSubmitting || error) && (
            <section className="result-panel" aria-live="polite">
              <p className="result-label">{isSubmitting ? "Working" : "Error"}</p>
              <p>{isSubmitting ? "Opening chat..." : error}</p>
            </section>
          )}

        </div>
      </section>

      <footer className="site-footer">
        <span>Agentic Lite</span>
        <div className="chat-header-meta" aria-label="LLM settings">
          <ModelSelector
            disabled={isSubmitting}
            models={freeModels}
            onChange={setSelectedModel}
            value={selectedModel}
          />
          <span className="model-badge">
            <span>Content length:</span>
            <strong>{contextWindowLength} messages</strong>
          </span>
        </div>
      </footer>
    </main>
  );
}

function SidebarContent({
  currentTask,
  deleteDisabled,
  isDeleting,
  onDeleteChat,
  onNewTask
}: {
  currentTask: string;
  deleteDisabled: boolean;
  isDeleting: boolean;
  onDeleteChat: () => void;
  onNewTask: () => void;
}) {
  return (
    <>
      <div className="sidebar-brand-row">
        <div className="brand" aria-label="Agentic Lite">
          <AgenticMark />
          <span>agentic</span>
        </div>
        <Search size={18} strokeWidth={2.1} />
      </div>

      <nav className="sidebar-nav">
        <button type="button" onClick={onNewTask}>
          <Plus size={18} />
          <span>New task</span>
        </button>
        <button type="button">
          <Library size={18} />
          <span>Library</span>
        </button>
      </nav>

      <div className="task-list">
        <p>All tasks</p>
        <button type="button" className="active-task">
          <AgenticMark />
          <span>{currentTask}</span>
        </button>
        <button
          type="button"
          className="delete-chat-button"
          disabled={deleteDisabled}
          onClick={onDeleteChat}
        >
          <Trash2 size={16} />
          <span>{isDeleting ? "Deleting…" : "Delete current chat"}</span>
        </button>
      </div>
    </>
  );
}
