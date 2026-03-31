// @vitest-environment node

import { describe, expect, it } from "vitest";
import { findDemoUser, issueDemoToken, normalizeRole, parseDemoToken } from "./demo-auth.js";

describe("demo auth helpers", () => {
  it("maps SUPER_ADMIN to ADMIN", () => {
    expect(normalizeRole("SUPER_ADMIN")).toBe("ADMIN");
    expect(normalizeRole("RADIOLOGY")).toBe("RADIOLOGY");
  });

  it("issues and parses demo tokens", () => {
    const user = findDemoUser("admin1", "admin123");
    expect(user).not.toBeNull();

    const token = issueDemoToken(user);
    const parsed = parseDemoToken(token);

    expect(parsed?.username).toBe("admin1");
    expect(parsed?.role).toBe("ADMIN");
    expect(parsed?.fullName).toBe("Dectrocel Admin");
  });
});
