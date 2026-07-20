"use client";

import { sanitizeLlmDisplayText, sanitizeLlmHtml } from "@/lib/security/sanitize-html";
import { cn } from "@/app/utils/cn";

type SafeLlmTextProps = {
  children: string;
  className?: string;
  as?: "p" | "span" | "dd" | "div";
};

/** Renders LLM text with XSS sanitization (plain text, no innerHTML). */
export function SafeLlmText({ children, className, as: Tag = "p" }: SafeLlmTextProps) {
  const safe = sanitizeLlmDisplayText(children);
  return <Tag className={className}>{safe}</Tag>;
}

type SafeLlmHtmlProps = {
  html: string;
  className?: string;
};

/** Renders sanitized LLM HTML via dangerouslySetInnerHTML — use sparingly. */
export function SafeLlmHtml({ html, className }: SafeLlmHtmlProps) {
  const safe = sanitizeLlmHtml(html);
  if (!safe) return null;
  return (
    <div
      className={cn("safe-llm-html", className)}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
