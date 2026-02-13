import { describe, expect, it } from "vitest";
import { selectorFromOptions } from "../src/selector.js";

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
});
