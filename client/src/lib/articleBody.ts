export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizePastedText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeInlineText(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function renderInlineMarkup(value: string) {
  let html = sanitizeInlineText(value);
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, text, href) => {
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(text)}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return html;
}

export function markdownishToHtml(body: string) {
  const blocks = normalizePastedText(body)
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      const heading = block.match(/^(#{1,6})\s+(.+)$/);
      const isBulletList = lines.every((line) => /^[-*•]\s+/.test(line));
      const isNumberedList = lines.every((line) => /^\d+\.\s+/.test(line));

      if (heading) {
        const level = Math.min(heading[1].length, 6);
        return `<h${level}>${renderInlineMarkup(heading[2])}</h${level}>`;
      }

      if (isBulletList) {
        const items = lines.map((line) => `<li>${renderInlineMarkup(line.replace(/^[-*•]\s+/, ""))}</li>`).join("");
        return `<ul>${items}</ul>`;
      }

      if (isNumberedList) {
        const items = lines.map((line) => `<li>${renderInlineMarkup(line.replace(/^\d+\.\s+/, ""))}</li>`).join("");
        return `<ol>${items}</ol>`;
      }

      return `<p>${renderInlineMarkup(block)}</p>`;
    })
    .join("");
}

export function sanitizeArticleHtml(input: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "text/html");
  const allowed = new Set(["P", "BR", "STRONG", "B", "EM", "I", "A", "UL", "OL", "LI", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6"]);

  const sanitizeNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent || "");
    }

    if (!(node instanceof HTMLElement)) {
      return "";
    }

    if (!allowed.has(node.tagName)) {
      return Array.from(node.childNodes).map(sanitizeNode).join("");
    }

    if (node.tagName === "BR") {
      return "<br>";
    }

    if (node.tagName === "A") {
      const href = node.getAttribute("href") || "";
      const safeHref = /^https?:\/\//i.test(href) ? escapeHtml(href) : "";
      const content = Array.from(node.childNodes).map(sanitizeNode).join("");
      if (!safeHref || !content.trim()) return content;
      return `<a href="${safeHref}" target="_blank" rel="noreferrer">${content}</a>`;
    }

    const content = Array.from(node.childNodes).map(sanitizeNode).join("");
    const tag = node.tagName.toLowerCase();
    return `<${tag}>${content}</${tag}>`;
  };

  return Array.from(doc.body.childNodes).map(sanitizeNode).join("").trim();
}

export function bodyToHtml(body: string) {
  if (!body.trim()) return "";
  if (/<[a-z][\s\S]*>/i.test(body)) {
    return sanitizeArticleHtml(body);
  }
  return markdownishToHtml(body);
}

export function htmlToArticleHtml(html: string) {
  return sanitizeArticleHtml(html);
}

export function plainTextToArticleHtml(text: string) {
  return markdownishToHtml(text);
}
