import { SessionStore } from "../session/store.js";
import { attachBrowser, referenceToLocator, resolvePage, selectorToLocator } from "../runtime/playwright.js";
import type { SelectorInput, SessionRecord } from "../contracts/types.js";
import { HarnessCliError } from "../errors.js";
import type { Locator, Page } from "playwright-core";

export type CommandContext = {
  sessionId: string;
  store: SessionStore;
};

export async function withPage<T>(
  session: SessionRecord,
  run: (page: import("playwright-core").Page) => Promise<T>
): Promise<T> {
  const browser = await attachBrowser(session);
  try {
    const page = await resolvePage(browser, session);
    return await run(page);
  } finally {
    await browser.close();
  }
}

export type LocatorTargetOptions = {
  store: SessionStore;
  sessionId: string;
  page: Page;
  selector?: SelectorInput;
  elementId?: string;
  index: number;
  strictSingle: boolean;
  timeout: number;
};

export type ResolvedLocator = {
  locator: Locator;
  strategy: "selector" | "element-id";
  index: number;
  matchCount?: number;
};

export async function resolveLocatorTarget(options: LocatorTargetOptions): Promise<ResolvedLocator> {
  if (options.elementId) {
    const reference = await options.store.loadElement(options.sessionId, options.elementId);
    return {
      locator: referenceToLocator(options.page, reference),
      strategy: "element-id",
      index: reference.index
    };
  }

  if (!options.selector) {
    throw new HarnessCliError("INVALID_SELECTOR", "A selector or --element-id is required", false);
  }

  const locator = selectorToLocator(options.page, options.selector);

  if (options.strictSingle) {
    await locator.first().waitFor({ state: "attached", timeout: options.timeout });
    const count = await locator.count();
    if (count !== 1) {
      throw new HarnessCliError(
        "INVALID_SELECTOR",
        `Expected exactly one match but found ${count}`,
        false,
        [],
        { count, selector: options.selector }
      );
    }
    return {
      locator: locator.first(),
      strategy: "selector",
      index: 0,
      matchCount: count
    };
  }

  if (options.index > 0) {
    await locator.nth(options.index).waitFor({ state: "attached", timeout: options.timeout });
    const count = await locator.count();
    if (count <= options.index) {
      throw new HarnessCliError(
        "INVALID_SELECTOR",
        `Selector index ${options.index} is out of range (matches: ${count})`,
        false,
        [],
        { count, index: options.index, selector: options.selector }
      );
    }
    return {
      locator: locator.nth(options.index),
      strategy: "selector",
      index: options.index,
      matchCount: count
    };
  }

  return {
    locator: locator.first(),
    strategy: "selector",
    index: 0
  };
}
