import assert from "assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";

const distEntry = path.resolve(process.cwd(), "dist", "index.js");
if (!fs.existsSync(distEntry)) {
  console.error("dist/index.js not found. Run pnpm run build before test:e2e.");
  process.exit(1);
}

const port = String(process.env.E2E_PORT || 4181);
const baseUrl = `http://127.0.0.1:${port}`;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cvsolucion-e2e-"));

const child = spawn(process.execPath, [distEntry], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: port,
    APP_ORIGIN: baseUrl,
    APP_STORAGE_DRIVER: "sqlite",
    APP_DATA_DIR: tempDir,
    APP_SQLITE_JSON_MIRROR: "false",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
child.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
child.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function stopServer() {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(3000).then(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }),
  ]);
}

async function request(pathname) {
  return fetch(`${baseUrl}${pathname}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(5000),
  });
}

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 20000) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited before smoke checks completed.\n${output}`);
    }

    try {
      const response = await request("/api/auth/me");
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await delay(250);
  }

  throw new Error(`Server did not become ready within 20s.\n${output}`);
}

try {
  await waitForServer();

  const home = await request("/");
  assert.equal(home.status, 200);
  assert.match(await home.text(), /CVsolucion/i);
  assert.equal(home.headers.get("x-content-type-options"), "nosniff");
  assert.ok(home.headers.get("content-security-policy"));

  const about = await request("/about");
  assert.equal(about.status, 200);
  assert.match(await about.text(), /Cabinet Vision/i);

  const auth = await request("/api/auth/me");
  assert.equal(auth.status, 200);
  assert.deepEqual(await auth.json(), { user: null });

  const catalog = await request("/api/catalog/public?locale=en");
  assert.equal(catalog.status, 200);
  assert.ok(Array.isArray((await catalog.json()).servicePackages));

  const training = await request("/api/training/programs");
  assert.equal(training.status, 200);
  assert.ok(Array.isArray((await training.json()).programs));

  const missingAsset = await request("/missing-smoke-asset-2026.png");
  assert.equal(missingAsset.status, 404);

  console.log("E2E smoke checks passed.");
} finally {
  await stopServer();
  fs.rmSync(tempDir, { recursive: true, force: true });
}
