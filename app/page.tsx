import {
  ArrowRight,
  ArrowUp,
  Briefcase,
  Code2,
  Laptop,
  Paintbrush2,
  Plus,
  Sparkles
} from "lucide-react";
import Link from "next/link";

const quickActions = [
  { label: "Create slides", icon: Briefcase },
  { label: "Build website", icon: Code2 },
  { label: "Develop desktop apps", icon: Laptop },
  { label: "Design", icon: Paintbrush2 },
  { label: "More" }
];

function AgenticMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <Sparkles size={18} strokeWidth={2.4} />
    </span>
  );
}

export default function Home() {
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

          <form className="composer" aria-label="Task prompt">
            <label className="sr-only" htmlFor="task">
              Assign a task or ask anything
            </label>
            <textarea id="task" placeholder="Assign a task or ask anything" rows={4} />
            <div className="composer-actions">
              <button type="button" className="round-control" aria-label="Attach file">
                <Plus size={24} strokeWidth={1.9} />
              </button>
              <button type="submit" className="round-control submit-control" aria-label="Submit task">
                <ArrowUp size={22} strokeWidth={2.4} />
              </button>
            </div>
          </form>

          <div className="quick-actions" aria-label="Example tasks">
            {quickActions.map(({ label, icon: Icon }) => (
              <button type="button" className="quick-chip" key={label}>
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
