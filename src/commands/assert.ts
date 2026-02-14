import type { SelectorInput, AssertKind } from "../contracts/types.js";
import type { SessionStore } from "../session/store.js";
import { HarnessCliError } from "../errors.js";
import { resolveLocatorTarget, withPage } from "./shared.js";

type AssertOptions = {
  session: string;
  kind: AssertKind;
  selector?: SelectorInput;
  elementId?: string;
  index: number;
  strictSingle: boolean;
  expected?: string;
  timeout: number;
};

export async function assertCommand(store: SessionStore, options: AssertOptions) {
  const session = await store.load(options.session);
  return withPage(session, async (page) => {
    if (options.kind === "url") {
      if (!options.expected) {
        throw new HarnessCliError("INVALID_INPUT", "--expected is required for --kind url", false);
      }
      const ok = page.url().includes(options.expected);
      if (!ok) {
        throw new HarnessCliError(
          "ASSERT_FAIL",
          `URL assertion failed. Current URL "${page.url()}" does not include "${options.expected}"`,
          false
        );
      }
      return { asserted: true, kind: options.kind };
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
    if (options.kind === "exists") {
      await locator.waitFor({ state: "attached", timeout: options.timeout });
      return {
        asserted: true,
        kind: options.kind,
        target: {
          strategy: resolved.strategy,
          index: resolved.index,
          ...(resolved.matchCount !== undefined ? { matchCount: resolved.matchCount } : {})
        }
      };
    }
    if (options.kind === "visible") {
      await locator.waitFor({ state: "visible", timeout: options.timeout });
      return {
        asserted: true,
        kind: options.kind,
        target: {
          strategy: resolved.strategy,
          index: resolved.index,
          ...(resolved.matchCount !== undefined ? { matchCount: resolved.matchCount } : {})
        }
      };
    }
    if (!options.expected) {
      throw new HarnessCliError("INVALID_INPUT", "--expected is required for --kind text", false);
    }

    const deadline = Date.now() + options.timeout;
    while (Date.now() < deadline) {
      const text = await locator.textContent();
      if ((text ?? "").includes(options.expected)) {
        return {
          asserted: true,
          kind: options.kind,
          target: {
            strategy: resolved.strategy,
            index: resolved.index,
            ...(resolved.matchCount !== undefined ? { matchCount: resolved.matchCount } : {})
          }
        };
      }
      await page.waitForTimeout(100);
    }

    throw new HarnessCliError(
      "ASSERT_FAIL",
      `Text assertion failed. Expected to find "${options.expected}"`,
      false
    );
  });
}
