"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUp,
  Briefcase,
  Code2,
  Library,
  Laptop,
  Paintbrush2,
  Plus,
  Search,
  Sparkles
} from "lucide-react";
import Link from "next/link";

type ApiResponse = {
  result: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const quickActions = [
  { label: "Create slides", icon: Briefcase },
  { label: "Build website", icon: Code2 },
  { label: "Develop desktop apps", icon: Laptop },
  { label: "Design", icon: Paintbrush2 },
  { label: "More" }
];

const CHAT_STORAGE_KEY = "agentic-lite-chat";

function persistMessages(messages: Message[]) {
  window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
}

async function submitPrompt(prompt: string) {
  const response = await fetch("/api/prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    throw new Error("The fake backend could not process that prompt.");
  }

  return (await response.json()) as ApiResponse;
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

type AgenticClientProps = {
  initialChatOpen?: boolean;
};

export default function AgenticClient({ initialChatOpen = false }: AgenticClientProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!initialChatOpen || typeof window === "undefined") {
      return [];
    }

    const storedMessages = window.localStorage.getItem(CHAT_STORAGE_KEY);

    if (!storedMessages) {
      return [];
    }

    try {
      return JSON.parse(storedMessages) as Message[];
    } catch {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
      return [];
    }
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(initialChatOpen);
  const formRef = useRef<HTMLFormElement>(null);
  const conversationRef = useRef(0);
  const canSubmit = prompt.trim().length > 0 && !isSubmitting;

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
      router.push("/chat");
    }
    setPrompt("");
    const conversationId = conversationRef.current;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedPrompt
    };

    const messagesWithUser = [...messages, userMessage];
    persistMessages(messagesWithUser);
    setMessages(messagesWithUser);

    try {
      const data = await submitPrompt(trimmedPrompt);
      if (conversationRef.current !== conversationId) {
        return;
      }
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.result
      };
      setMessages((currentMessages) => {
        const nextMessages = [...currentMessages, assistantMessage];
        persistMessages(nextMessages);
        return nextMessages;
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

  function handleExample(label: string) {
    setPrompt(label);
    setError("");
  }

  function handleNewTask() {
    conversationRef.current += 1;
    setMessages([]);
    setPrompt("");
    setError("");
    setIsSubmitting(false);
    setIsChatOpen(true);
    persistMessages([]);
    router.push("/chat");
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
          <div className="sidebar-brand-row">
            <Link className="brand" href="/" aria-label="Agentic home">
              <AgenticMark />
              <span>agentic</span>
            </Link>
            <Search size={18} strokeWidth={2.1} />
          </div>

          <nav className="sidebar-nav">
            <button type="button" onClick={handleNewTask}>
              <Plus size={18} />
              <span>New task</span>
            </button>
            <button type="button">
              <Sparkles size={18} />
              <span>Agent</span>
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
              <span>{messages[0]?.content || "Current task"}</span>
            </button>
          </div>
        </aside>

        <section className="chat-main" aria-label="Chat">
          <header className="chat-header">
            <h1>Agentic Lite</h1>
            <button type="button">Share</button>
          </header>

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
                <p>{message.content}</p>
              </article>
            ))}

            {isSubmitting && (
              <article className="message message-assistant">
                <AssistantLogo />
                <p>Working on a fake backend response...</p>
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

          <div className="quick-actions" aria-label="Example tasks">
            {quickActions.map(({ label, icon: Icon }) => (
              <button type="button" className="quick-chip" key={label} onClick={() => handleExample(label)}>
                {Icon ? <Icon size={18} strokeWidth={2.1} aria-hidden="true" /> : null}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
