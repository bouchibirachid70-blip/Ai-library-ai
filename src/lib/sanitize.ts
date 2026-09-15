// Sanitize arbitrary markdown-ish content to safe HTML for display.
// Conservative: we escape everything, then turn a small, vetted subset of
// markup (paragraphs, line breaks, bold, italic, code, links, lists, headings)
// into HTML ourselves. Anything else is rendered as escaped text.

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function inlineFormat(text: string): string {
  let s = escapeHtml(text);
  // Inline code first so its content isn't mangled by other rules.
  s = s.replace(/`([^`]+)`/g, (_, code: string) => `<code>${code}</code>`);
  // Bold
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  // Italic
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');
  // Links [text](https://url)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, text: string, url: string) => {
    if (!/^https?:\/\//i.test(url)) return `${text}`;
    return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });
  return s;
}

/**
 * Render user-submitted content (article body, submission description) as
 * safe HTML. The input is treated as plain text with a minimal markdown-like
 * subset: paragraphs separated by blank lines, headings starting with #, lists
 * with -, and the inline formatting handled by inlineFormat(). All raw HTML
 * in the input is escaped, so user-supplied tags cannot inject scripts.
 */
export function renderSafeContent(input: string): string {
  if (!input) return '';
  const blocks = input.replace(/\r\n?/g, '\n').split(/\n{2,}/);
  const out: string[] = [];
  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;
    const lines = block.split('\n');
    const heading = lines[0].match(/^(#{1,6})\s+(.+)$/);
    if (heading && lines.length === 1) {
      const level = heading[1].length;
      out.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`);
      continue;
    }
    const listItems = lines.filter((l) => /^\s*[-*]\s+/.test(l));
    if (listItems.length === lines.length && listItems.length > 0) {
      const items = listItems
        .map((l) => l.replace(/^\s*[-*]\s+/, ''))
        .map((l) => `<li>${inlineFormat(l)}</li>`)
        .join('');
      out.push(`<ul>${items}</ul>`);
      continue;
    }
    out.push(`<p>${inlineFormat(lines.join('\n')).replace(/\n/g, '<br/>')}</p>`);
  }
  return out.join('\n');
}

export function plainTextSummary(input: string, max = 200): string {
  if (!input) return '';
  const text = input
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}
