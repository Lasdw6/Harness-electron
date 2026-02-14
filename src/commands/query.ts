import type { SelectorInput } from "../contracts/types.js";
import type { SessionStore } from "../session/store.js";
import { queryElements } from "../runtime/playwright.js";
import { withPage } from "./shared.js";

type QueryOptions = {
  session: string;
  selector: SelectorInput;
  limit: number;
  visibleOnly: boolean;
};

type QueryElement = {
  elementId: string;
  index: number;
  tag: string;
  text: string;
  role: string | null;
  ariaLabel: string | null;
  testId: string | null;
  visible: boolean;
};

export async function queryCommand(store: SessionStore, options: QueryOptions) {
  const session = await store.load(options.session);
  return withPage(session, async (page) => {
    const all = await queryElements(page, options.selector, options.limit);
    const filtered = options.visibleOnly ? all.filter((item) => item.visible) : all;
    const start = await store.nextElementId(options.session);
    let next = parseElementIdNumber(start);
    const now = new Date().toISOString();
    const elements: QueryElement[] = [];

    for (const item of filtered) {
      const elementId = `e${next}`;
      next += 1;
      await store.saveElement(options.session, elementId, {
        selector: options.selector,
        index: item.index,
        hint: buildHint(item),
        createdAt: now
      });
      elements.push({
        elementId,
        index: item.index,
        tag: item.tag,
        text: item.text,
        role: item.role,
        ariaLabel: item.ariaLabel,
        testId: item.testId,
        visible: item.visible
      });
    }

    return {
      selector: options.selector,
      count: elements.length,
      totalMatches: all.length,
      limit: options.limit,
      visibleOnly: options.visibleOnly,
      elements
    };
  });
}

function parseElementIdNumber(value: string): number {
  const match = value.match(/^e(\d+)$/);
  if (!match) {
    return 1;
  }
  const parsed = Number.parseInt(match[1], 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function buildHint(item: {
  tag: string;
  text: string;
  ariaLabel: string | null;
  testId: string | null;
}): string {
  if (item.testId) {
    return `${item.tag}[data-testid=${item.testId}]`;
  }
  if (item.ariaLabel) {
    return `${item.tag}[aria-label=${item.ariaLabel}]`;
  }
  if (item.text) {
    return `${item.tag}:${item.text.slice(0, 40)}`;
  }
  return item.tag;
}
