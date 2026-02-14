import type { Command } from "commander";
import type { SelectorInput } from "./contracts/types.js";
import { HarnessCliError } from "./errors.js";

export type TargetInput = {
  selector?: SelectorInput;
  elementId?: string;
  index: number;
  strictSingle: boolean;
};

export function addSelectorOptions(command: Command): Command {
  return addBaseSelectorOptions(command)
    .option("--element-id <id>", "Use an element id returned by query")
    .option("--index <number>", "Pick nth selector match (0-based)", "0")
    .option("--strict-single", "Require exactly one selector match", false);
}

export function addDiscoverySelectorOptions(command: Command): Command {
  return addBaseSelectorOptions(command);
}

function addBaseSelectorOptions(command: Command): Command {
  return command
    .option("--css <selector...>", "CSS selector")
    .option("--xpath <selector...>", "XPath selector")
    .option("--text <text...>", "Text selector")
    .option("--role <role...>", "ARIA role selector")
    .option("--testid <id...>", "Test id selector")
    .option("--name <name...>", "Optional role name filter");
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

export function targetFromOptions(
  options: Record<string, unknown>,
  config: { requireTarget: boolean }
): TargetInput {
  const selector = selectorFromOptionsOptional(options);
  const hasSelector = hasSelectorInput(selector);
  const elementId = asString(options.elementId)?.trim() || undefined;
  const index = parseNonNegativeInt(options.index, "index");
  const strictSingle = Boolean(options.strictSingle);

  if (strictSingle && index !== 0) {
    throw new HarnessCliError("INVALID_INPUT", "--strict-single cannot be combined with --index", false);
  }

  if (elementId && hasSelector) {
    throw new HarnessCliError(
      "INVALID_SELECTOR",
      "Use either selector flags or --element-id, not both",
      false
    );
  }

  if (elementId && (strictSingle || index !== 0)) {
    throw new HarnessCliError(
      "INVALID_INPUT",
      "--index/--strict-single cannot be combined with --element-id",
      false
    );
  }

  if (config.requireTarget && !elementId && !hasSelector) {
    throw new HarnessCliError(
      "INVALID_SELECTOR",
      "Provide one selector flag or --element-id",
      false
    );
  }

  return {
    selector: hasSelector ? selector : undefined,
    elementId,
    index,
    strictSingle
  };
}

export function hasSelectorInput(selector: SelectorInput): boolean {
  return Boolean(selector.css || selector.xpath || selector.text || selector.role || selector.testid);
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    const parts = value.filter((part) => typeof part === "string") as string[];
    if (parts.length === 0) {
      return undefined;
    }
    return parts.join(" ");
  }
  return undefined;
}

function parseNonNegativeInt(value: unknown, field: string): number {
  const raw = asString(value);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new HarnessCliError("INVALID_INPUT", `${field} must be a non-negative integer`, false);
  }
  return parsed;
}
