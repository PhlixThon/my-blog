/**
 * Parses inline link syntax [link:<url>]text[/link] and returns HTML string.
 *
 * Example:
 *   Input:  "Built with [link:https://daisyui.com]🌼 DaisyUI[/link] and Astro"
 *   Output: "Built with <a href=\"https://daisyui.com\" class=\"link link-primary\" target=\"_blank\" rel=\"noopener noreferrer\">🌼 DaisyUI</a> and Astro"
 *
 * Text without link syntax is returned as HTML-escaped plain text.
 */
export function parseInlineLinks(text: string): string {
  // Escape HTML entities in the full text first, then process link tokens
  const escaped = escapeHtml(text);

  // Pattern matches the escaped version of [link:<url>]text[/link]
  // Since we escaped first, brackets and colons are still plain chars
  const pattern = /\[link:(.*?)\](.*?)\[\/link\]/g;

  return escaped.replace(pattern, (_match, url: string, label: string) => {
    return `<a href="${escapeAttr(url)}" class="link link-primary link-hover" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

