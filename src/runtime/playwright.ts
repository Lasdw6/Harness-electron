import path from "node:path";
import fs from "fs-extra";
import type { Browser, Locator, Page } from "playwright-core";
import { chromium } from "playwright-core";
import type { SelectorInput, SessionRecord } from "../contracts/types.js";
import { HarnessCliError } from "../errors.js";

export async function attachBrowser(session: SessionRecord): Promise<Browser> {
  try {
    return await chromium.connectOverCDP(session.wsEndpoint);
  } catch (error) {
    throw new HarnessCliError(
      "CONNECT_FAILED",
      `Failed to connect via CDP endpoint ${session.wsEndpoint}: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
      true,
      [`harness-electron connect --host ${session.host} --port ${session.port} --session ${session.id}`]
    );
  }
}

export async function resolvePage(browser: Browser, session: SessionRecord): Promise<Page> {
  for (const context of browser.contexts()) {
    for (const page of context.pages()) {
      const pageUrl = page.url();
      if (session.targetUrl && pageUrl === session.targetUrl) {
        return page;
      }
    }
  }

  const fallback = browser.contexts()[0]?.pages()[0];
  if (!fallback) {
    throw new HarnessCliError("TARGET_NOT_FOUND", "No page found from CDP browser contexts", true, [
      "Open a BrowserWindow and retry"
    ]);
  }
  return fallback;
}

export function selectorToLocator(page: Page, selector: SelectorInput): Locator {
  const defined = [
    selector.css ? "css" : null,
    selector.xpath ? "xpath" : null,
    selector.text ? "text" : null,
    selector.role ? "role" : null,
    selector.testid ? "testid" : null
  ].filter(Boolean);

  if (defined.length !== 1) {
    throw new HarnessCliError(
      "INVALID_SELECTOR",
      "Exactly one selector type must be provided: --css|--xpath|--text|--role|--testid",
      false
    );
  }

  if (selector.css) {
    return page.locator(selector.css);
  }
  if (selector.xpath) {
    return page.locator(`xpath=${selector.xpath}`);
  }
  if (selector.text) {
    return page.getByText(selector.text);
  }
  if (selector.role) {
    return page.getByRole(selector.role as never, selector.name ? { name: selector.name } : undefined);
  }
  return page.getByTestId(selector.testid as string);
}

export async function domSummary(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => {
    const buttons = document.querySelectorAll("button").length;
    const inputs = document.querySelectorAll("input").length;
    const forms = document.querySelectorAll("form").length;
    return {
      title: document.title,
      url: window.location.href,
      buttons,
      inputs,
      forms
    };
  });
}

export async function domTree(page: Page, maxNodes: number): Promise<unknown> {
  return page.evaluate((limit) => {
    let visited = 0;
    const walk = (node: Element): unknown => {
      if (visited >= limit) {
        return null;
      }
      visited += 1;
      const childNodes = Array.from(node.children)
        .map((child) => walk(child))
        .filter((value) => value !== null);
      return {
        tag: node.tagName.toLowerCase(),
        id: node.id || undefined,
        class: node.className || undefined,
        text: (node.textContent || "").trim().slice(0, 80) || undefined,
        children: childNodes
      };
    };
    return walk(document.documentElement);
  }, maxNodes);
}

export async function domHtml(page: Page, maxChars = 30000): Promise<string> {
  const html = await page.evaluate(() => document.documentElement.outerHTML);
  return html.slice(0, maxChars);
}

export async function safeScreenshot(
  page: Page,
  screenshotPath: string,
  fullPage = false,
  timeout = 30000
): Promise<void> {
  await fs.ensureDir(path.dirname(screenshotPath));
  await page.screenshot({ path: screenshotPath, fullPage, timeout });
}

export async function safeElementScreenshot(
  locator: Locator,
  screenshotPath: string,
  timeout: number
): Promise<void> {
  await fs.ensureDir(path.dirname(screenshotPath));
  await locator.first().waitFor({ state: "visible", timeout });
  await locator.first().screenshot({ path: screenshotPath, timeout });
}
