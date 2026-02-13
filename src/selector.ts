import type { Command } from "commander";
import type { SelectorInput } from "./contracts/types.js";
import { HarnessCliError } from "./errors.js";

export function addSelectorOptions(command: Command): Command {
  return command
    .option("--css <selector>", "CSS selector")
    .option("--xpath <selector>", "XPath selector")
    .option("--text <text>", "Text selector")
    .option("--role <role>", "ARIA role selector")
    .option("--testid <id>", "Test id selector")
    .option("--name <name>", "Optional role name filter");
}

export function selectorFromOptions(options: Record<string, unknown>): SelectorInput {
  const selector = selectorFromOptionsOptional(options);
  const chosen = [selector.css, selector.xpath, selector.text, selector.role, selector.testid].filter(Boolean);
  if (chosen.length !== 1) {
    throw new HarnessCliError(
      "INVALID_SELECTOR",
      "Provide exactly one of --css, --xpath, --text, --role, --testid",
      false
    );
  }
  return selector;
}

export function selectorFromOptionsOptional(options: Record<string, unknown>): SelectorInput {
  const selector: SelectorInput = {
    css: asString(options.css),
    xpath: asString(options.xpath),
    text: asString(options.text),
    role: asString(options.role),
    testid: asString(options.testid),
    name: asString(options.name)
  };
  const chosen = [selector.css, selector.xpath, selector.text, selector.role, selector.testid].filter(Boolean);
  if (chosen.length > 1) {
    throw new HarnessCliError(
      "INVALID_SELECTOR",
      "Provide at most one of --css, --xpath, --text, --role, --testid",
      false
    );
  }
  return selector;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
