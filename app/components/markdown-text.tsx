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

function renderTextBlock(text: string) {
  return text
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph, paragraphIndex) => (
      <p key={`${paragraph}-${paragraphIndex}`}>
        {paragraph.split("\n").map((line, lineIndex) => (
          <span key={`${line}-${lineIndex}`}>
            {lineIndex > 0 ? <br /> : null}
            {renderInlineMarkdown(line)}
          </span>
        ))}
      </p>
    ));
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
