import type { KeyboardEvent } from "react";

type TextareaEnterSubmitOptions = {
  onSubmit: () => void;
  isDisabled?: boolean;
  getValue?: () => string;
};

/**
 * Enter sends; Shift+Enter inserts a newline (default textarea behavior).
 * Ignores empty / whitespace-only input and IME composition.
 */
export function handleTextareaEnterSubmit(
  event: KeyboardEvent<HTMLTextAreaElement>,
  options: TextareaEnterSubmitOptions,
): void {
  if (event.key !== "Enter" || event.shiftKey) return;
  if (event.nativeEvent.isComposing) return;
  if (options.isDisabled) return;

  const value = options.getValue?.() ?? event.currentTarget.value;
  if (!value.trim()) return;

  event.preventDefault();
  options.onSubmit();
}
