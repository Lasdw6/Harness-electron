#!/usr/bin/env node
import { Command, CommanderError } from "commander";
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
import { queryCommand } from "./commands/query.js";
import { schemaCommand } from "./commands/schema.js";
import { versionCommand } from "./commands/version.js";
import { assertKindSchema } from "./contracts/types.js";
import { HarnessCliError, normalizeError, toExitCode } from "./errors.js";
import { fail, ok, printJson } from "./io.js";
import {
  addDiscoverySelectorOptions,
  addSelectorOptions,
  hasSelectorInput,
  targetFromOptions
} from "./selector.js";
import { SessionStore } from "./session/store.js";

const program = new Command();
const store = new SessionStore(process.cwd());

program
  .name("harness-electron")
  .description("@harnessgg/electron")
  .allowExcessArguments(true)
  .configureOutput({
    writeOut: (text) => process.stdout.write(text),
    writeErr: () => {
      // Parse errors are emitted as JSON envelopes below.
    }
  })
  .exitOverride();

program
  .command("connect")
  .requiredOption("--port <number>", "CDP port")
  .option("--host <host>", "CDP host", "127.0.0.1")
  .option("--session <id>", "session id", "default")
  .option("--window-title <title...>", "window title contains filter")
  .option("--url-contains <text...>", "URL contains filter")
  .action(async (options) => {
    await run("connect", options.session, async () => {
      const port = parsePositiveInt(options.port, "port");
      return connectCommand(store, {
        host: options.host,
        port,
        session: options.session,
        windowTitle: options.windowTitle ? parseStringValue(options.windowTitle, "window-title") : undefined,
        urlContains: options.urlContains ? parseStringValue(options.urlContains, "url-contains") : undefined
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

const queryCmd = addDiscoverySelectorOptions(
  program
    .command("query")
    .option("--session <id>", "session id", "default")
    .option("--limit <number>", "max matches to return", "10")
    .option("--visible-only", "only return visible matches", false)
);
queryCmd.action(async (options) => {
  await run("query", options.session, async () => {
    const target = targetFromOptions(options, { requireTarget: true });
    if (!target.selector || target.elementId) {
      throw new HarnessCliError("INVALID_SELECTOR", "query requires one selector flag", false);
    }
    return queryCommand(store, {
      session: options.session,
      selector: target.selector,
      limit: parsePositiveInt(options.limit, "limit"),
      visibleOnly: options.visibleOnly
    });
  });
});

const typeCmd = addSelectorOptions(
  program
    .command("type")
    .requiredOption("--value <text...>", "text to type")
    .option("--session <id>", "session id", "default")
    .option("--timeout <ms>", "timeout in milliseconds", "5000")
    .option("--clear", "clear before typing", false)
);
typeCmd.action(async (options) => {
  await run("type", options.session, async () => {
    const target = targetFromOptions(options, { requireTarget: true });
    return typeCommand(store, {
      session: options.session,
      ...target,
      text: parseStringValue(options.value, "value"),
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
    const target = targetFromOptions(options, { requireTarget: true });
    return clickCommand(store, {
      session: options.session,
      ...target,
      timeout: parsePositiveInt(options.timeout, "timeout")
    });
  });
});

const waitCmd = addSelectorOptions(
  program
    .command("wait")
    .option("--session <id>", "session id", "default")
    .requiredOption("--for <mode>", "visible|hidden|url|text")
    .option("--value <value...>", "wait value for url/text")
    .option("--timeout <ms>", "timeout in milliseconds", "5000")
);
waitCmd.action(async (options) => {
  await run("wait", options.session, async () => {
    const mode = options.for as "visible" | "hidden" | "url" | "text";
    if (!["visible", "hidden", "url", "text"].includes(mode)) {
      throw new HarnessCliError("INVALID_INPUT", "--for must be visible|hidden|url|text", false);
    }
    const target = targetFromOptions(options, { requireTarget: mode !== "url" });
    if (mode === "url" && (target.selector || target.elementId)) {
      throw new HarnessCliError(
        "INVALID_INPUT",
        "--for url does not accept selector flags or --element-id",
        false
      );
    }
    return waitCommand(store, {
      session: options.session,
      mode,
      ...target,
      value: options.value ? parseStringValue(options.value, "value") : undefined,
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
    const target = targetFromOptions(options, { requireTarget: false });
    const hasTarget = Boolean(target.elementId || (target.selector && hasSelectorInput(target.selector)));
    if (options.fullPage && hasTarget) {
      throw new HarnessCliError(
        "INVALID_INPUT",
        "--full-page cannot be combined with selector flags or --element-id",
        false
      );
    }
    return screenshotCommand(store, {
      session: options.session,
      path: options.path,
      fullPage: options.fullPage,
      ...target,
      timeout: parsePositiveInt(options.timeout, "timeout")
    });
  });
});

program
  .command("evaluate")
  .option("--session <id>", "session id", "default")
  .requiredOption("--script <script...>", "expression to evaluate")
  .action(async (options) => {
    await run("evaluate", options.session, async () => {
      return evaluateCommand(store, {
        session: options.session,
        script: parseStringValue(options.script, "script")
      });
    });
  });

const assertCmd = addSelectorOptions(
  program
    .command("assert")
    .option("--session <id>", "session id", "default")
    .requiredOption("--kind <kind>", "exists|visible|text|url")
    .option("--expected <value...>", "expected value for text/url")
    .option("--timeout <ms>", "timeout in milliseconds", "5000")
);
assertCmd.action(async (options) => {
  await run("assert", options.session, async () => {
    const parsedKind = assertKindSchema.safeParse(options.kind);
    if (!parsedKind.success) {
      throw new HarnessCliError("INVALID_INPUT", "--kind must be exists|visible|text|url", false);
    }
    const target = targetFromOptions(options, { requireTarget: parsedKind.data !== "url" });
    if (parsedKind.data === "url" && (target.selector || target.elementId)) {
      throw new HarnessCliError(
        "INVALID_INPUT",
        "--kind url does not accept selector flags or --element-id",
        false
      );
    }
    return assertCommand(store, {
      session: options.session,
      kind: parsedKind.data,
      ...target,
      expected: options.expected ? parseStringValue(options.expected, "expected") : undefined,
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

program.command("schema").action(async () => {
  await run("schema", "default", async () => schemaCommand());
});

program.command("version").action(async () => {
  await run("version", "default", async () => versionCommand());
});

program.parseAsync(process.argv).catch(async (error) => {
  if (error instanceof CommanderError && error.code === "commander.helpDisplayed") {
    return;
  }
  await emitFailure(process.argv[2] ?? "unknown", "default", normalizeCommanderError(error));
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

function parseStringValue(value: unknown, field: string): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (Array.isArray(value)) {
    const parts = value.filter((part) => typeof part === "string") as string[];
    const joined = parts.join(" ").trim();
    if (joined) {
      return joined;
    }
  }
  throw new HarnessCliError("INVALID_INPUT", `${field} is required`, false);
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

function normalizeCommanderError(error: unknown): unknown {
  if (!(error instanceof CommanderError)) {
    return error;
  }
  return new HarnessCliError(
    "INVALID_INPUT",
    error.message.replace(/^error:\s*/i, "").trim(),
    false,
    [
      "harness-electron schema",
      "harness-electron <command> --help"
    ],
    { source: error.code }
  );
}
