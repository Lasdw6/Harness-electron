import type { SelectorInput } from "../contracts/types.js";
import type { SessionStore } from "../session/store.js";
import { safeElementScreenshot, safeScreenshot } from "../runtime/playwright.js";
import { HarnessCliError } from "../errors.js";
import { resolveLocatorTarget, withPage } from "./shared.js";

type Targetable = {
  selector?: SelectorInput;
  elementId?: string;
  index: number;
  strictSingle: boolean;
};

type TypeOptions = Targetable & {
  session: string;
  text: string;
  clear: boolean;
  timeout: number;
};

type ClickOptions = Targetable & {
  session: string;
  timeout: number;
};

type WaitOptions = Targetable & {
  session: string;
  mode: "visible" | "hidden" | "url" | "text";
  value?: string;
  timeout: number;
};

type ScreenshotOptions = Targetable & {
  session: string;
  path: string;
  fullPage: boolean;
  timeout: number;
};

type EvaluateOptions = {
  session: string;
  script: string;
};

export async function typeCommand(store: SessionStore, options: TypeOptions) {
  const session = await store.load(options.session);
  return withPage(session, async (page) => {
    const resolved = await resolveLocatorTarget({
      store,
      sessionId: options.session,
      page,
      selector: options.selector,
      elementId: options.elementId,
      index: options.index,
      strictSingle: options.strictSingle,
      timeout: options.timeout
    });
    await resolved.locator.waitFor({ state: "visible", timeout: options.timeout });
    if (options.clear) {
      await resolved.locator.fill("");
    }
    await resolved.locator.fill(options.text, { timeout: options.timeout });
    return {
      typed: true,
      target: {
        strategy: resolved.strategy,
        index: resolved.index,
        ...(resolved.matchCount !== undefined ? { matchCount: resolved.matchCount } : {})
      }
    };
  });
}

export async function clickCommand(store: SessionStore, options: ClickOptions) {
  const session = await store.load(options.session);
  return withPage(session, async (page) => {
    const resolved = await resolveLocatorTarget({
      store,
      sessionId: options.session,
      page,
      selector: options.selector,
      elementId: options.elementId,
      index: options.index,
      strictSingle: options.strictSingle,
      timeout: options.timeout
    });
    await resolved.locator.click({ timeout: options.timeout });
    return {
      clicked: true,
      target: {
        strategy: resolved.strategy,
        index: resolved.index,
        ...(resolved.matchCount !== undefined ? { matchCount: resolved.matchCount } : {})
      }
    };
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

    const resolved = await resolveLocatorTarget({
      store,
      sessionId: options.session,
      page,
      selector: options.selector,
      elementId: options.elementId,
      index: options.index,
      strictSingle: options.strictSingle,
      timeout: options.timeout
    });
    const locator = resolved.locator;
    if (options.mode === "visible") {
      await locator.waitFor({ state: "visible", timeout: options.timeout });
      return {
        visible: true,
        target: {
          strategy: resolved.strategy,
          index: resolved.index,
          ...(resolved.matchCount !== undefined ? { matchCount: resolved.matchCount } : {})
        }
      };
    }
    if (options.mode === "hidden") {
      await locator.waitFor({ state: "hidden", timeout: options.timeout });
      return {
        hidden: true,
        target: {
          strategy: resolved.strategy,
          index: resolved.index,
          ...(resolved.matchCount !== undefined ? { matchCount: resolved.matchCount } : {})
        }
      };
    }
    if (!options.value) {
      throw new HarnessCliError("INVALID_INPUT", "--value is required for --for text", false);
    }
    const deadline = Date.now() + options.timeout;
    while (Date.now() < deadline) {
      const text = await locator.textContent();
      if ((text ?? "").includes(options.value)) {
        return {
          textContains: options.value,
          target: {
            strategy: resolved.strategy,
            index: resolved.index,
            ...(resolved.matchCount !== undefined ? { matchCount: resolved.matchCount } : {})
          }
        };
      }
      await page.waitForTimeout(100);
    }
    throw new HarnessCliError("TIMEOUT", `Timed out waiting for text "${options.value}"`, true);
  });
}

export async function screenshotCommand(store: SessionStore, options: ScreenshotOptions) {
  const session = await store.load(options.session);
  return withPage(session, async (page) => {
    if (options.selector || options.elementId) {
      const resolved = await resolveLocatorTarget({
        store,
        sessionId: options.session,
        page,
        selector: options.selector,
        elementId: options.elementId,
        index: options.index,
        strictSingle: options.strictSingle,
        timeout: options.timeout
      });
      await withOperationTimeout(
        () => safeElementScreenshot(resolved.locator, options.path, options.timeout),
        options.timeout,
        "element-screenshot"
      );
      return {
        path: options.path,
        scope: "element",
        target: {
          strategy: resolved.strategy,
          index: resolved.index,
          ...(resolved.matchCount !== undefined ? { matchCount: resolved.matchCount } : {})
        }
      };
    }
    await withOperationTimeout(
      () => safeScreenshot(page, options.path, options.fullPage, options.timeout),
      options.timeout,
      "page-screenshot"
    );
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

async function withOperationTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  phase: string
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;
  const pending = operation();
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(
        new HarnessCliError(
          "TIMEOUT",
          `Operation timed out after ${timeoutMs}ms (${phase})`,
          true,
          ["Retry command with a larger --timeout"],
          { phase, timeoutMs }
        )
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([pending, timeout]);
  } catch (error) {
    if (error instanceof HarnessCliError && error.code === "TIMEOUT") {
      pending.catch(() => {
        // Ignore late rejections after timeout.
      });
    }
    throw error;
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}
