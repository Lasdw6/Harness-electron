import type { CapabilitiesResponse } from "../contracts/types.js";

export function capabilitiesCommand(sessionPath: string): CapabilitiesResponse {
  return {
    protocolVersion: "1.0",
    package: "@harnessgg/electron",
    commands: [
      "connect",
      "dom",
      "type",
      "click",
      "wait",
      "screenshot",
      "evaluate",
      "assert",
      "disconnect",
      "sessions list",
      "sessions prune",
      "capabilities"
    ],
    selectors: ["css", "xpath", "text", "role", "testid"],
    assertions: ["exists", "visible", "text", "url"],
    defaults: {
      timeoutMs: 5000,
      sessionPath
    }
  };
}
