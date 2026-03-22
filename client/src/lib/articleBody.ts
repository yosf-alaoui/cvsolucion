import DOMPurify from "dompurify";

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

function isLikelyHeading(text: string) {
  const value = text.trim();
  if (!value || value.length > 90) return false;
  if (/[.!?]$/.test(value)) return false;

  const words = value.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 12) return false;

  const capitalizedWords = words.filter((word) => /^[A-Z"'(][A-Za-z0-9"'():-]*/.test(word)).length;
  return capitalizedWords >= Math.max(2, Math.ceil(words.length * 0.5));
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
      const inferredHeading = lines.length === 1 && isLikelyHeading(block);

      if (heading) {
        const level = Math.min(heading[1].length, 6);
        return `<h${level}>${renderInlineMarkup(heading[2])}</h${level}>`;
      }

      if (inferredHeading) {
        return `<h2>${renderInlineMarkup(block)}</h2>`;
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

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "a",
    "ul",
    "ol",
    "li",
    "blockquote",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "span",
    "div",
    "img",
    "code",
    "pre",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "style", "src", "alt"],
  FORBID_TAGS: ["script", "style"],
  KEEP_CONTENT: true,
};

export function sanitizeArticleHtml(input: string) {
  const sanitized = DOMPurify.sanitize(input, SANITIZE_CONFIG);
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${sanitized}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement | null;

  if (!root) return "";

  root.querySelectorAll("a").forEach((anchor) => {
    const href = anchor.getAttribute("href") || "";
    if (!/^(https?:\/\/|\/)/i.test(href)) {
      anchor.replaceWith(...Array.from(anchor.childNodes));
      return;
    }

    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noreferrer");
  });

  root.querySelectorAll("img").forEach((image) => {
    const src = image.getAttribute("src") || "";
    if (!/^(https?:\/\/|\/)/i.test(src)) {
      image.remove();
      return;
    }

    image.setAttribute("alt", image.getAttribute("alt") || "");
  });

  return root.innerHTML.trim();
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
