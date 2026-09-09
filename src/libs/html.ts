// Escape a value for safe interpolation into an HTML text node.
export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// JSON.stringify a value for embedding inside an inline <script> block.
// Escapes '<' so a value containing "</script>" can't terminate the tag early.
export function toSafeInlineJson(value: unknown): string {
  return JSON.stringify(value ?? null).replace(/</g, '\\u003c');
}
