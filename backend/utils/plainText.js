/**
 * Convert Markdown-formatted LLM prose into clean, readable plain English
 * with no **, *, #, _, backticks, or link syntax.
 */
export function toPlainEnglish(text) {
  if (text == null) return '';

  return String(text)
    .replace(/\r\n/g, '\n')
    // Unwrap fenced code blocks (keep inner content without ``` fences)
    .replace(/```[^\n]*\n([\s\S]*?)```/g, '$1')
    .replace(/```/g, '')
    // Remove ATX headings (# Heading -> Heading)
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    // Remove blockquote markers (> quote -> quote)
    .replace(/^\s*>\s?/gm, '')
    // Remove horizontal rules (---, ***, ___)
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    // Convert Markdown links [label](url) -> label (url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    // Strip bold / underline / strikethrough markers
    .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
    .replace(/__([\s\S]*?)__/g, '$1')
    .replace(/~~([\s\S]*?)~~/g, '$1')
    // Strip inline code backticks
    .replace(/`([^`]*)`/g, '$1')
    // Normalize unordered list markers (* item or + item -> - item)
    .replace(/^\s*[*+]\s+/gm, '- ')
    // Strip italic markers (*word* or _word_) without breaking snake_case
    .replace(/(^|[^\w*])\*([^*\n]+?)\*(?!\w)/g, '$1$2')
    .replace(/(^|[^\w_])_([^_\n]+?)_(?!\w)/g, '$1$2')
    // Remove any remaining stray bold asterisks or backticks
    .replace(/\*{2,}/g, '')
    .replace(/`/g, '')
    // Collapse excess blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

