import ReactMarkdown from "react-markdown";
import { StreamingCursor } from "./StreamingCursor";

type MarkdownContentProps = {
  text: string;
  isStreaming?: boolean;
};

/**
 * Renders markdown text with optional streaming cursor.
 * Uses the `markdown-content` CSS class for consistent styling.
 */
export function MarkdownContent({ text, isStreaming }: MarkdownContentProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown>{text}</ReactMarkdown>
      {isStreaming && <StreamingCursor />}
    </div>
  );
}
