import { describe, expect, it } from "vitest";
import { versionCommand } from "../src/commands/version.js";

describe("versionCommand", () => {
  it("returns package metadata", async () => {
    const data = await versionCommand();
    expect(data.package).toBe("@harnessgg/electron");
    expect(data.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(data.description.length).toBeGreaterThan(0);
    expect(data.protocolVersion).toBe("1.0");
  });
});
