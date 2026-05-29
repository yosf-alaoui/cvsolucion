import fs from "fs";
import { spawnSync } from "child_process";

const skippedPaths = new Set(["scripts/secrets-audit.mjs"]);

const skippedPrefixes = [
  ".git/",
  "node_modules/",
  "dist/",
  "data/",
  ".secrets/",
];

const secretPatterns = [
  {
    name: "private key block",
    pattern: /-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----/,
  },
  {
    name: "Google service account private key",
    pattern: /"private_key"\s*:\s*"-----BEGIN PRIVATE KEY-----/,
  },
  {
    name: "Stripe secret key",
    pattern: /\b(?:sk_live|sk_test)_[A-Za-z0-9]{16,}\b/,
  },
  {
    name: "Stripe webhook secret",
    pattern: /\bwhsec_[A-Za-z0-9]{16,}\b/,
  },
  {
    name: "GitHub token",
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b|github_pat_[A-Za-z0-9_]{40,}/,
  },
  {
    name: "Google API key",
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/,
  },
  {
    name: "Slack token",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  },
];

function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function listProjectFiles(dir = ".", prefix = "") {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relativePath = normalizePath(prefix ? `${prefix}/${entry.name}` : entry.name);
    if (shouldSkip(relativePath)) continue;
    if (entry.isDirectory()) {
      files.push(...listProjectFiles(relativePath, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files;
}

function listScannableFiles() {
  const result = spawnSync("git", ["ls-files", "-z"], {
    encoding: "buffer",
  });
  if (result.status !== 0) {
    return listProjectFiles();
  }
  return result.stdout
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .map(normalizePath);
}

function shouldSkip(filePath) {
  return (
    skippedPaths.has(filePath) ||
    filePath === ".env" ||
    filePath.startsWith(".env.") ||
    /^backup-cvsolucion-website-.*\.json$/i.test(filePath) ||
    /service-account.*\.json$/i.test(filePath) ||
    skippedPrefixes.some((prefix) => filePath === prefix.slice(0, -1) || filePath.startsWith(prefix))
  );
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath);
  if (content.includes(0)) return [];

  const text = content.toString("utf8");
  const findings = [];
  for (const secretPattern of secretPatterns) {
    if (secretPattern.pattern.test(text)) {
      findings.push(secretPattern.name);
    }
  }
  return findings;
}

const findings = [];
for (const filePath of listScannableFiles()) {
  if (shouldSkip(filePath)) continue;
  for (const finding of scanFile(filePath)) {
    findings.push({ filePath, finding });
  }
}

if (findings.length) {
  console.error("Potential secrets found in tracked files:");
  for (const { filePath, finding } of findings) {
    console.error(`- ${filePath}: ${finding}`);
  }
  process.exit(1);
}

console.log("No tracked secrets detected.");
