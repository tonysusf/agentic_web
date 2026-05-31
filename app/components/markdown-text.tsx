import type { ReactNode } from "react";

function renderInlineMarkdown(text: string) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
    }

    return part;
  });
}

function renderParagraph(lines: string[], key: string) {
  return (
    <p key={key}>
      {lines.map((line, lineIndex) => (
        <span key={`${line}-${lineIndex}`}>
          {lineIndex > 0 ? <br /> : null}
          {renderInlineMarkdown(line)}
        </span>
      ))}
    </p>
  );
}

function renderList(items: string[], type: "ordered" | "unordered", key: string) {
  const Tag = type === "ordered" ? "ol" : "ul";

  return (
    <Tag key={key}>
      {items.map((item, itemIndex) => (
        <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
      ))}
    </Tag>
  );
}

function renderTextBlock(text: string) {
  const blocks: ReactNode[] = [];
  const paragraphLines: string[] = [];
  let listItems: string[] = [];
  let listType: "ordered" | "unordered" | null = null;

  function flushParagraph() {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push(renderParagraph([...paragraphLines], `paragraph-${blocks.length}`));
    paragraphLines.length = 0;
  }

  function flushList() {
    if (!listType || listItems.length === 0) {
      return;
    }

    blocks.push(renderList([...listItems], listType, `list-${blocks.length}`));
    listItems = [];
    listType = null;
  }

  text.replace(/\r\n/g, "\n").split("\n").forEach((line) => {
    const trimmedLine = line.trim();
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)$/);
    const orderedMatch = line.match(/^\s*\d+[.)]\s+(.+)$/);

    if (!trimmedLine) {
      flushParagraph();
      flushList();
      return;
    }

    if (bulletMatch || orderedMatch) {
      const nextListType = orderedMatch ? "ordered" : "unordered";
      flushParagraph();

      if (listType && listType !== nextListType) {
        flushList();
      }

      listType = nextListType;
      listItems.push((bulletMatch || orderedMatch)?.[1] || "");
      return;
    }

    flushList();
    paragraphLines.push(line);
  });

  flushParagraph();
  flushList();

  return blocks;
}

export function MarkdownText({ text }: { text: string }) {
  const parts = text.split(/```([\s\S]*?)```/g);

  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          const lines = part.replace(/^\n/, "").replace(/\n$/, "").split("\n");
          const firstLine = lines[0]?.trim() || "";
          const hasLanguage = Boolean(firstLine) && !firstLine.includes(" ") && lines.length > 1;
          const code = hasLanguage ? lines.slice(1).join("\n") : lines.join("\n");

          return (
            <pre key={`${part}-${index}`}>
              <code>{code}</code>
            </pre>
          );
        }

        return <span key={`${part}-${index}`}>{renderTextBlock(part)}</span>;
      })}
    </>
  );
}
