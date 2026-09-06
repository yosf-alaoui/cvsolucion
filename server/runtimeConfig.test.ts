import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

describe("PM2 runtime configuration", () => {
  it("uses fork mode so the selected Node interpreter is honored", () => {
    const config = require("../ecosystem.config.cjs") as {
      apps: Array<{
        exec_mode: string;
        instances: number;
        interpreter: string;
      }>;
    };

    expect(config.apps).toHaveLength(1);
    expect(config.apps[0]).toMatchObject({
      exec_mode: "fork",
      instances: 1,
    });
    expect(config.apps[0].interpreter).toBeTruthy();
  });
});
