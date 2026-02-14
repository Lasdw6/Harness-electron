import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { describe, expect, it } from "vitest";
import { SessionStore } from "../src/session/store.js";

describe("SessionStore", () => {
  it("saves and loads a session", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "harness-electron-"));
    const store = new SessionStore(temp);

    await store.save("default", {
      host: "127.0.0.1",
      port: 9222,
      wsEndpoint: "ws://127.0.0.1:9222/devtools/browser/abc",
      targetId: "target-1",
      targetUrl: "http://localhost",
      targetTitle: "App"
    });

    const loaded = await store.load("default");
    expect(loaded.id).toBe("default");
    expect(loaded.port).toBe(9222);
    expect(loaded.wsEndpoint).toContain("devtools/browser");
  });

  it("lists and prunes sessions", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "harness-electron-"));
    const store = new SessionStore(temp);
    await store.save("a", {
      host: "127.0.0.1",
      port: 9222,
      wsEndpoint: "ws://127.0.0.1:9222/devtools/browser/abc"
    });
    await store.save("b", {
      host: "127.0.0.1",
      port: 9223,
      wsEndpoint: "ws://127.0.0.1:9223/devtools/browser/def"
    });

    const listed = await store.list();
    expect(listed).toHaveLength(2);

    const removed = await store.prune();
    expect(removed).toBe(2);
  });

  it("stores and resolves element references", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "harness-electron-"));
    const store = new SessionStore(temp);
    await store.save("default", {
      host: "127.0.0.1",
      port: 9222,
      wsEndpoint: "ws://127.0.0.1:9222/devtools/browser/abc"
    });

    await store.saveElement("default", "e1", {
      selector: { text: "Sign in" },
      index: 0,
      hint: "button:Sign in",
      createdAt: new Date().toISOString()
    });

    const loaded = await store.loadElement("default", "e1");
    expect(loaded.selector.text).toBe("Sign in");
    expect(loaded.index).toBe(0);
  });

  it("increments element ids from saved map", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "harness-electron-"));
    const store = new SessionStore(temp);
    await store.save("default", {
      host: "127.0.0.1",
      port: 9222,
      wsEndpoint: "ws://127.0.0.1:9222/devtools/browser/abc",
      elementMap: {
        e2: {
          selector: { css: "#app" },
          index: 0,
          createdAt: new Date().toISOString()
        }
      }
    });

    const next = await store.nextElementId("default");
    expect(next).toBe("e3");
  });
});
