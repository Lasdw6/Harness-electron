#!/usr/bin/env node
import { Command } from "commander";
import { connectCommand } from "./commands/connect.js";
import { domCommand } from "./commands/dom.js";
import {
  clickCommand,
  evaluateCommand,
  screenshotCommand,
  typeCommand,
  waitCommand
} from "./commands/action.js";
import { assertCommand } from "./commands/assert.js";
import { capabilitiesCommand } from "./commands/capabilities.js";
import { disconnectCommand, listSessionsCommand, pruneSessionsCommand } from "./commands/sessions.js";
import { assertKindSchema } from "./contracts/types.js";
import { HarnessCliError, normalizeError, toExitCode } from "./errors.js";
import { fail, ok, printJson } from "./io.js";
import { selectorFromOptions, addSelectorOptions, selectorFromOptionsOptional } from "./selector.js";
import { SessionStore } from "./session/store.js";

const program = new Command();
const store = new SessionStore(process.cwd());

program.name("harness-electron").description("@harnessgg/electron");

program
  .command("connect")
  .requiredOption("--port <number>", "CDP port")
  .option("--host <host>", "CDP host", "127.0.0.1")
  .option("--session <id>", "session id", "default")
  .option("--window-title <title>", "window title contains filter")
  .option("--url-contains <text>", "URL contains filter")
  .action(async (options) => {
    await run("connect", options.session, async () => {
      const port = parsePositiveInt(options.port, "port");
      return connectCommand(store, {
        host: options.host,
        port,
        session: options.session,
        windowTitle: options.windowTitle,
        urlContains: options.urlContains
      });
    });
  });

program
  .command("dom")
  .option("--session <id>", "session id", "default")
  .option("--format <format>", "summary|tree|html", "summary")
  .option("--max-nodes <number>", "max nodes for tree", "300")
  .action(async (options) => {
    await run("dom", options.session, async () => {
      const format = options.format as "summary" | "tree" | "html";
      if (!["summary", "tree", "html"].includes(format)) {
        throw new HarnessCliError("INVALID_INPUT", "--format must be summary|tree|html", false);
      }
      return domCommand(store, {
        session: options.session,
        format,
        maxNodes: parsePositiveInt(options.maxNodes, "max-nodes")
      });
    });
  });

const typeCmd = addSelectorOptions(
  program
    .command("type")
    .requiredOption("--value <text>", "text to type")
    .option("--session <id>", "session id", "default")
    .option("--timeout <ms>", "timeout in milliseconds", "5000")
    .option("--clear", "clear before typing", false)
);
typeCmd.action(async (options) => {
  await run("type", options.session, async () => {
    return typeCommand(store, {
      session: options.session,
      selector: selectorFromOptions(options),
      text: options.value,
      clear: options.clear,
      timeout: parsePositiveInt(options.timeout, "timeout")
    });
  });
});

const clickCmd = addSelectorOptions(
  program.command("click").option("--session <id>", "session id", "default").option("--timeout <ms>", "timeout in milliseconds", "5000")
);
clickCmd.action(async (options) => {
  await run("click", options.session, async () => {
    return clickCommand(store, {
      session: options.session,
      selector: selectorFromOptions(options),
      timeout: parsePositiveInt(options.timeout, "timeout")
    });
  });
});

const waitCmd = addSelectorOptions(
  program
    .command("wait")
    .option("--session <id>", "session id", "default")
    .requiredOption("--for <mode>", "visible|hidden|url|text")
    .option("--value <value>", "wait value for url/text")
    .option("--timeout <ms>", "timeout in milliseconds", "5000")
);
waitCmd.action(async (options) => {
  await run("wait", options.session, async () => {
    const mode = options.for as "visible" | "hidden" | "url" | "text";
    if (!["visible", "hidden", "url", "text"].includes(mode)) {
      throw new HarnessCliError("INVALID_INPUT", "--for must be visible|hidden|url|text", false);
    }
    return waitCommand(store, {
      session: options.session,
      mode,
      selector: mode === "url" ? undefined : selectorFromOptions(options),
      value: options.value,
      timeout: parsePositiveInt(options.timeout, "timeout")
    });
  });
});

const screenshotCmd = addSelectorOptions(
  program
    .command("screenshot")
    .option("--session <id>", "session id", "default")
    .requiredOption("--path <path>", "output path")
    .option("--full-page", "capture full page", false)
    .option("--timeout <ms>", "timeout in milliseconds", "15000")
);
screenshotCmd.action(async (options) => {
  await run("screenshot", options.session, async () => {
    const selector = selectorFromOptionsOptional(options);
    const hasSelector = Boolean(selector.css || selector.xpath || selector.text || selector.role || selector.testid);
    if (options.fullPage && hasSelector) {
      throw new HarnessCliError("INVALID_INPUT", "--full-page cannot be combined with selector flags", false);
    }
    return screenshotCommand(store, {
      session: options.session,
      path: options.path,
      fullPage: options.fullPage,
      selector: hasSelector ? selector : undefined,
      timeout: parsePositiveInt(options.timeout, "timeout")
    });
  });
});

program
  .command("evaluate")
  .option("--session <id>", "session id", "default")
  .requiredOption("--script <script>", "expression to evaluate")
  .action(async (options) => {
    await run("evaluate", options.session, async () => {
      return evaluateCommand(store, {
        session: options.session,
        script: options.script
      });
    });
  });

const assertCmd = addSelectorOptions(
  program
    .command("assert")
    .option("--session <id>", "session id", "default")
    .requiredOption("--kind <kind>", "exists|visible|text|url")
    .option("--expected <value>", "expected value for text/url")
    .option("--timeout <ms>", "timeout in milliseconds", "5000")
);
assertCmd.action(async (options) => {
  await run("assert", options.session, async () => {
    const parsedKind = assertKindSchema.safeParse(options.kind);
    if (!parsedKind.success) {
      throw new HarnessCliError("INVALID_INPUT", "--kind must be exists|visible|text|url", false);
    }
    return assertCommand(store, {
      session: options.session,
      kind: parsedKind.data,
      selector: parsedKind.data === "url" ? undefined : selectorFromOptions(options),
      expected: options.expected,
      timeout: parsePositiveInt(options.timeout, "timeout")
    });
  });
});

program
  .command("disconnect")
  .option("--session <id>", "session id", "default")
  .action(async (options) => {
    await run("disconnect", options.session, async () => {
      return disconnectCommand(store, options.session);
    });
  });

const sessions = program.command("sessions");
sessions.command("list").action(async () => {
  await run("sessions list", "default", async () => listSessionsCommand(store));
});
sessions
  .command("prune")
  .option("--session <id>", "optional single session id")
  .action(async (options) => {
    await run("sessions prune", options.session ?? "default", async () =>
      pruneSessionsCommand(store, options.session)
    );
  });

program.command("capabilities").action(async () => {
  await run("capabilities", "default", async () => capabilitiesCommand(store.getBaseDir()));
});

program.parseAsync(process.argv).catch(async (error) => {
  await emitFailure("unknown", "default", error);
});

async function run<T>(command: string, session: string, fn: () => Promise<T>): Promise<void> {
  try {
    const data = await fn();
    printJson(ok(command, session, data));
  } catch (error) {
    await emitFailure(command, session, error);
  }
}

async function emitFailure(command: string, session: string, error: unknown): Promise<void> {
  const normalized = normalizeTimeoutError(error);
  printJson(fail(command, session, normalizeError(normalized)));
  const code = normalized instanceof HarnessCliError ? toExitCode(normalized.code) : toExitCode("INTERNAL_ERROR");
  process.exitCode = code;
}

function parsePositiveInt(value: string | number, field: string): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HarnessCliError("INVALID_INPUT", `${field} must be a positive integer`, false);
  }
  return parsed;
}

function normalizeTimeoutError(error: unknown): unknown {
  if (error instanceof Error && error.name === "TimeoutError") {
    return new HarnessCliError(
      "TIMEOUT",
      error.message,
      true,
      [
        "harness-electron dom --format summary",
        "Retry command with a larger timeout"
      ],
      {
        source: error.name,
        stack: error.stack?.split("\n").slice(0, 6).join("\n")
      }
    );
  }
  return error;
}
