export type Expression = "happy" | "content" | "neutral" | "sad" | "sleepy";

function Eyes({ expression }: { expression: Expression }) {
  if (expression === "content" || expression === "happy") {
    return (
      <>
        <path d="M8.8 14.6c1.3-2.2 3.7-2.2 5 0" />
        <path d="M18.2 14.6c1.3-2.2 3.7-2.2 5 0" />
      </>
    );
  }
  if (expression === "sleepy") {
    return (
      <>
        <path d="M9.2 14h4.4" />
        <path d="M18.4 14h4.4" />
      </>
    );
  }
  return (
    <>
      <circle cx="11.8" cy="13.6" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="20.2" cy="13.6" r="1.7" fill="currentColor" stroke="none" />
    </>
  );
}

function Mouth({ expression }: { expression: Expression }) {
  switch (expression) {
    case "happy":
      return <path d="M10.4 19.4c1.9 3.4 9.3 3.4 11.2 0" />;
    case "content":
      return <path d="M12 20c1.2 1.7 6.8 1.7 8 0" />;
    case "neutral":
      return <path d="M12.2 20.6h7.6" />;
    case "sad":
      return <path d="M10.8 22.2c1.8-3.2 8.6-3.2 10.4 0" />;
    case "sleepy":
      return <path d="M14.4 20.6h3.2" />;
  }
}

export default function Face({
  expression = "content",
  className = "w-6 h-6",
}: {
  expression?: Expression;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <Eyes expression={expression} />
      <Mouth expression={expression} />
    </svg>
  );
}
