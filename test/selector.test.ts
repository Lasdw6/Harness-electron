import { describe, expect, it } from "vitest";
import { selectorFromOptions, targetFromOptions } from "../src/selector.js";

describe("selectorFromOptions", () => {
  it("returns css selector", () => {
    const selector = selectorFromOptions({ css: "#app" });
    expect(selector.css).toBe("#app");
  });

  it("throws when none defined", () => {
    expect(() => selectorFromOptions({})).toThrowError(/exactly one/i);
  });

  it("throws when multiple are defined", () => {
    expect(() => selectorFromOptions({ css: "#app", text: "Login" })).toThrowError(/at most one/i);
  });

  it("joins variadic selector values into one string", () => {
    const selector = selectorFromOptions({ text: ["Add", "Project"] });
    expect(selector.text).toBe("Add Project");
  });

  it("parses element-id target", () => {
    const target = targetFromOptions({ elementId: "e4" }, { requireTarget: true });
    expect(target.elementId).toBe("e4");
    expect(target.selector).toBeUndefined();
    expect(target.index).toBe(0);
  });

  it("rejects mixed selector and element-id", () => {
    expect(() =>
      targetFromOptions({ text: ["Add", "Project"], elementId: "e2" }, { requireTarget: true })
    ).toThrowError(/either selector flags or --element-id/i);
  });

  it("rejects strict-single with index", () => {
    expect(() =>
      targetFromOptions({ text: "Save", strictSingle: true, index: "1" }, { requireTarget: true })
    ).toThrowError(/cannot be combined with --index/i);
  });
});
