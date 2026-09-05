import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve("client/src");
const files = [];

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(target);
    else if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(target);
  }
}

function isFunction(node) {
  return ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node);
}

function isHookCall(node) {
  if (!ts.isCallExpression(node)) return false;
  if (ts.isIdentifier(node.expression)) return /^use[A-Z0-9]/.test(node.expression.text);
  return ts.isPropertyAccessExpression(node.expression) && /^use[A-Z0-9]/.test(node.expression.name.text);
}

function nameOf(node, source) {
  if (node.name) return node.name.getText(source);
  if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) return node.parent.name.text;
  return "anonymous";
}

collect(root);
let findings = 0;
for (const file of files) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  function visitFunction(fn) {
    if (!fn.body) return;
    const hooks = [];
    const returns = [];
    function scan(node, conditional = false) {
      if (node !== fn && isFunction(node)) return;
      if (isHookCall(node)) hooks.push({ node, conditional });
      if (ts.isReturnStatement(node)) returns.push(node);
      const nextConditional = conditional || ts.isIfStatement(node) || ts.isConditionalExpression(node) || ts.isSwitchStatement(node) || ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node) || ts.isWhileStatement(node) || ts.isDoStatement(node) || ts.isTryStatement(node) || ts.isCatchClause(node);
      ts.forEachChild(node, (child) => scan(child, nextConditional));
    }
    scan(fn.body);
    const lastHook = Math.max(-1, ...hooks.map(({ node }) => node.getStart(source)));
    const suspiciousReturns = returns.filter((node) => node.getStart(source) < lastHook);
    const conditionalHooks = hooks.filter(({ conditional }) => conditional);
    for (const item of conditionalHooks) {
      const position = source.getLineAndCharacterOfPosition(item.node.getStart(source));
      console.log(`${path.relative(process.cwd(), file)}:${position.line + 1} conditional hook in ${nameOf(fn, source)}: ${item.node.getText(source)}`);
      findings += 1;
    }
    for (const node of suspiciousReturns) {
      const position = source.getLineAndCharacterOfPosition(node.getStart(source));
      console.log(`${path.relative(process.cwd(), file)}:${position.line + 1} return before later hook in ${nameOf(fn, source)}: ${node.getText(source).slice(0, 100)}`);
      findings += 1;
    }
  }
  function walk(node) {
    if (isFunction(node)) visitFunction(node);
    ts.forEachChild(node, walk);
  }
  walk(source);
}
console.log(`findings=${findings}`);
if (findings > 0) {
  process.exitCode = 1;
}
