"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  Library,
  Plus,
  Search,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { MarkdownText } from "./components/markdown-text";

type ApiResponse = {
  result: string;
};

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

async function submitPrompt(prompt: string, sessionId: string) {
  const response = await fetch("/api/prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt, sessionId })
  });

  if (!response.ok) {
    throw new Error("Agentic Lite could not process that prompt.");
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
  llmModel: string;
};

export default function AgenticClient({ initialChatOpen = false, llmModel }: AgenticClientProps) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(initialChatOpen);
  const [sessionId, setSessionId] = useState("");
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
      const data = await submitPrompt(trimmedPrompt, currentSessionId);
      if (conversationRef.current !== conversationId) {
        return;
      }
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
        rows={4}
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
      <main className="chat-shell">
        <aside className="chat-sidebar" aria-label="Workspace navigation">
          <SidebarContent
            currentTask={messages[0]?.content || "Current task"}
            onNewTask={handleNewTask}
          />
        </aside>

        <section className="chat-main" aria-label="Chat">
          <header className="chat-header">
            <h1>Agentic Lite</h1>
            <span className="model-badge" title={llmModel}>
              <span>Model</span>
              <strong>{llmModel}</strong>
            </span>
          </header>

          <div className="mobile-chat-nav">
            <SidebarContent
              currentTask={messages[0]?.content || "Current task"}
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
              <article className="message message-assistant">
                <AssistantLogo />
                <p>Thinking through your request...</p>
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
        <span className="model-badge" title={llmModel}>
          <span>Model</span>
          <strong>{llmModel}</strong>
        </span>
      </footer>
    </main>
  );
}

function SidebarContent({
  currentTask,
  onNewTask
}: {
  currentTask: string;
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
      </div>
    </>
  );
}
