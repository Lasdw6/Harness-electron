import type { SelectorInput } from "../contracts/types.js";
import type { SessionStore } from "../session/store.js";
import { safeElementScreenshot, safeScreenshot, selectorToLocator } from "../runtime/playwright.js";
import { HarnessCliError } from "../errors.js";
import { withPage } from "./shared.js";

type TypeOptions = {
  session: string;
  selector: SelectorInput;
  text: string;
  clear: boolean;
  timeout: number;
};

type ClickOptions = {
  session: string;
  selector: SelectorInput;
  timeout: number;
};

type WaitOptions = {
  session: string;
  mode: "visible" | "hidden" | "url" | "text";
  selector?: SelectorInput;
  value?: string;
  timeout: number;
};

type ScreenshotOptions = {
  session: string;
  path: string;
  fullPage: boolean;
  selector?: SelectorInput;
  timeout: number;
};

type EvaluateOptions = {
  session: string;
  script: string;
};

export async function typeCommand(store: SessionStore, options: TypeOptions) {
  const session = await store.load(options.session);
  return withPage(session, async (page) => {
    const locator = selectorToLocator(page, options.selector);
    await locator.first().waitFor({ state: "visible", timeout: options.timeout });
    if (options.clear) {
      await locator.first().fill("");
    }
    await locator.first().fill(options.text, { timeout: options.timeout });
    return { typed: true };
  });
}

export async function clickCommand(store: SessionStore, options: ClickOptions) {
  const session = await store.load(options.session);
  return withPage(session, async (page) => {
    const locator = selectorToLocator(page, options.selector);
    await locator.first().click({ timeout: options.timeout });
    return { clicked: true };
  });
}

export async function waitCommand(store: SessionStore, options: WaitOptions) {
  const session = await store.load(options.session);
  return withPage(session, async (page) => {
    if (options.mode === "url") {
      if (!options.value) {
        throw new HarnessCliError("INVALID_INPUT", "--value is required for --for url", false);
      }
      await page.waitForURL(`**${options.value}**`, { timeout: options.timeout });
      return { matched: page.url() };
    }

    if (!options.selector) {
      throw new HarnessCliError("INVALID_SELECTOR", "A selector is required for this wait mode", false);
    }
    const locator = selectorToLocator(page, options.selector).first();
    if (options.mode === "visible") {
      await locator.waitFor({ state: "visible", timeout: options.timeout });
      return { visible: true };
    }
    if (options.mode === "hidden") {
      await locator.waitFor({ state: "hidden", timeout: options.timeout });
      return { hidden: true };
    }
    if (!options.value) {
      throw new HarnessCliError("INVALID_INPUT", "--value is required for --for text", false);
    }
    const deadline = Date.now() + options.timeout;
    while (Date.now() < deadline) {
      const text = await locator.textContent();
      if ((text ?? "").includes(options.value)) {
        return { textContains: options.value };
      }
      await page.waitForTimeout(100);
    }
    throw new HarnessCliError("TIMEOUT", `Timed out waiting for text "${options.value}"`, true);
  });
}

export async function screenshotCommand(store: SessionStore, options: ScreenshotOptions) {
  const session = await store.load(options.session);
  return withPage(session, async (page) => {
    if (options.selector) {
      const locator = selectorToLocator(page, options.selector);
      await safeElementScreenshot(locator, options.path, options.timeout);
      return { path: options.path, scope: "element" };
    }
    await safeScreenshot(page, options.path, options.fullPage);
    return { path: options.path, scope: options.fullPage ? "full-page" : "viewport" };
  });
}

export async function evaluateCommand(store: SessionStore, options: EvaluateOptions) {
  const session = await store.load(options.session);
  return withPage(session, async (page) => {
    const result = await page.evaluate(
      ({ script }) => {
        // eslint-disable-next-line no-eval
        return eval(script);
      },
      { script: options.script }
    );
    return { result };
  });
}
