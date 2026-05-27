import { describe, expect, it } from "vitest";
import { validatePasswordPolicy } from "./passwordPolicy";

describe("password policy", () => {
  it("rejects weak passwords", () => {
    expect(validatePasswordPolicy("password").valid).toBe(false);
    expect(validatePasswordPolicy("Password123").valid).toBe(false);
  });

  it("accepts long mixed passwords", () => {
    expect(validatePasswordPolicy("StrongPass123!").valid).toBe(true);
  });
});
