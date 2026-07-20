import DOMPurify from "isomorphic-dompurify";

const LLM_TEXT_ALLOWED_TAGS: string[] = [];

const RICH_HTML_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "blockquote",
  "code",
  "pre",
  "span",
  "div",
] as const;

/**
 * Strips all HTML from LLM-generated plain text before React rendering.
 * Defense-in-depth even when content is rendered as text nodes (not innerHTML).
 */
export function sanitizeLlmDisplayText(text: string): string {
  if (!text) return "";
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: LLM_TEXT_ALLOWED_TAGS,
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
}

/**
 * Sanitizes rich HTML from LLM output before `dangerouslySetInnerHTML`.
 * Use only when structured markup (tables, lists) is required.
 */
export function sanitizeLlmHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...RICH_HTML_ALLOWED_TAGS],
    ALLOWED_ATTR: ["class"],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
    FORBID_ATTR: ["onerror", "onclick", "onload", "onmouseover", "style"],
  });
}
