import { SessionStore } from "../session/store.js";
import { attachBrowser, resolvePage } from "../runtime/playwright.js";
import type { SessionRecord } from "../contracts/types.js";

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
