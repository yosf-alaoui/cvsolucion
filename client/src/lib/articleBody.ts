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

const ALLOWED_BLOCK_TAGS = new Set(["P", "UL", "OL", "LI", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6"]);
const INLINE_TAGS = new Set(["STRONG", "B", "EM", "I", "A", "BR", "SPAN"]);
const BLOCK_CONTAINER_TAGS = new Set(["DIV", "SECTION", "ARTICLE", "MAIN", "HEADER", "FOOTER", "ASIDE", "FIGURE", "FIGCAPTION"]);

function sanitizeStyleValue(property: string, value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return "";

  if (property === "font-family") {
    return /^[a-z0-9"' ,_-]+$/i.test(normalized) ? normalized : "";
  }

  if (property === "font-size" || property === "margin-top" || property === "margin-bottom" || property === "letter-spacing") {
    return /^-?\d+(?:\.\d+)?(px|em|rem|%)$/i.test(normalized) ? normalized : "";
  }

  if (property === "line-height") {
    return /^(normal|-?\d+(?:\.\d+)?(?:px|em|rem|%)?)$/i.test(normalized) ? normalized : "";
  }

  if (property === "font-weight") {
    return /^(normal|bold|[1-9]00)$/i.test(normalized) ? normalized : "";
  }

  if (property === "font-style") {
    return /^(normal|italic|oblique)$/i.test(normalized) ? normalized : "";
  }

  if (property === "text-align") {
    return /^(left|right|center|justify|start|end)$/i.test(normalized) ? normalized : "";
  }

  if (property === "text-decoration") {
    return /^(none|underline|line-through|overline)(\s+(solid|double|dotted|dashed|wavy))?$/i.test(normalized) ? normalized : "";
  }

  return "";
}

function sanitizeStyleAttribute(node: HTMLElement) {
  const rawStyle = node.getAttribute("style") || "";
  if (!rawStyle.trim()) return "";

  const allowedProperties = new Set([
    "font-family",
    "font-size",
    "line-height",
    "font-weight",
    "font-style",
    "text-align",
    "text-decoration",
    "margin-top",
    "margin-bottom",
    "letter-spacing",
  ]);

  const sanitizedRules = rawStyle
    .split(";")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const separatorIndex = rule.indexOf(":");
      if (separatorIndex === -1) return "";
      const property = rule.slice(0, separatorIndex).trim().toLowerCase();
      const value = rule.slice(separatorIndex + 1).trim();
      if (!allowedProperties.has(property)) return "";
      const safeValue = sanitizeStyleValue(property, value);
      return safeValue ? `${property}: ${safeValue}` : "";
    })
    .filter(Boolean);

  return sanitizedRules.length ? ` style="${escapeHtml(sanitizedRules.join("; "))}"` : "";
}

function sanitizeInlineNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent || "");
  }

  if (!(node instanceof HTMLElement)) {
    return "";
  }

  if (node.tagName === "BR") {
    return "<br>";
  }

  if (node.tagName === "A") {
    const href = node.getAttribute("href") || "";
    const safeHref = /^https?:\/\//i.test(href) ? escapeHtml(href) : "";
    const content = Array.from(node.childNodes).map(sanitizeInlineNode).join("");
    const style = sanitizeStyleAttribute(node);
    if (!content.trim()) return "";
    if (!safeHref) return content;
    return `<a href="${safeHref}" target="_blank" rel="noreferrer"${style}>${content}</a>`;
  }

  if (node.tagName === "STRONG" || node.tagName === "B") {
    const content = Array.from(node.childNodes).map(sanitizeInlineNode).join("");
    const style = sanitizeStyleAttribute(node);
    return content.trim() ? `<strong${style}>${content}</strong>` : "";
  }

  if (node.tagName === "EM" || node.tagName === "I") {
    const content = Array.from(node.childNodes).map(sanitizeInlineNode).join("");
    const style = sanitizeStyleAttribute(node);
    return content.trim() ? `<em${style}>${content}</em>` : "";
  }

  return Array.from(node.childNodes).map(sanitizeInlineNode).join("");
}

function splitListItemSegments(node: HTMLElement) {
  const segments: string[] = [];
  let currentSegment = "";

  const flushSegment = () => {
    const normalized = currentSegment.trim();
    if (normalized) {
      segments.push(normalized);
    }
    currentSegment = "";
  };

  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = escapeHtml(child.textContent || "").trim();
      if (text) {
        currentSegment += `${currentSegment ? " " : ""}${text}`;
      }
      return;
    }

    if (!(child instanceof HTMLElement)) {
      return;
    }

    if (child.tagName === "BR") {
      flushSegment();
      return;
    }

    const isBlockLike = ALLOWED_BLOCK_TAGS.has(child.tagName) || BLOCK_CONTAINER_TAGS.has(child.tagName);
    if (isBlockLike) {
      const content = Array.from(child.childNodes).map(sanitizeInlineNode).join("").trim();
      if (content) {
        flushSegment();
        segments.push(content);
      }
      return;
    }

    const inlineContent = sanitizeInlineNode(child).trim();
    if (inlineContent) {
      currentSegment += `${currentSegment ? " " : ""}${inlineContent}`;
    }
  });

  flushSegment();
  return segments;
}

export function sanitizeArticleHtml(input: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "text/html");

  const sanitizeNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim() || "";
      return text ? `<p>${escapeHtml(text)}</p>` : "";
    }

    if (!(node instanceof HTMLElement)) {
      return "";
    }

    if (INLINE_TAGS.has(node.tagName)) {
      const inlineContent = sanitizeInlineNode(node).trim();
      return inlineContent ? `<p>${inlineContent}</p>` : "";
    }

    if (ALLOWED_BLOCK_TAGS.has(node.tagName)) {
      if (node.tagName === "LI") {
        const style = sanitizeStyleAttribute(node);
        const segments = splitListItemSegments(node);
        if (!segments.length) return "";
        if (segments.length === 1) {
          return `<li${style}>${segments[0]}</li>`;
        }
        return segments.map((segment) => `<li${style}>${segment}</li>`).join("");
      }

      const content = Array.from(node.childNodes).map(sanitizeInlineNode).join("").trim();
      if (!content) return "";
      const tag = node.tagName.toLowerCase();
      const style = sanitizeStyleAttribute(node);
      return `<${tag}${style}>${content}</${tag}>`;
    }

    if (BLOCK_CONTAINER_TAGS.has(node.tagName)) {
      const hasNestedBlocks = Array.from(node.children).some(
        (child) => ALLOWED_BLOCK_TAGS.has(child.tagName) || BLOCK_CONTAINER_TAGS.has(child.tagName)
      );

      if (hasNestedBlocks) {
        return Array.from(node.childNodes).map(sanitizeNode).join("");
      }

      const inlineContent = Array.from(node.childNodes).map(sanitizeInlineNode).join("").trim();
      if (!inlineContent) return "";
      const style = sanitizeStyleAttribute(node);

      const plainText = node.textContent?.replace(/\s+/g, " ").trim() || "";
      if (isLikelyHeading(plainText) && !/<a\b/i.test(inlineContent)) {
        return `<h2${style}>${inlineContent}</h2>`;
      }

      return `<p${style}>${inlineContent}</p>`;
    }

    return Array.from(node.childNodes).map(sanitizeNode).join("");
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
