import type { SessionStore } from "../session/store.js";
import { HarnessCliError } from "../errors.js";
import { domHtml, domSummary, domTree } from "../runtime/playwright.js";
import { withPage } from "./shared.js";

type DomOptions = {
  session: string;
  format: "summary" | "tree" | "html";
  maxNodes: number;
};

export async function domCommand(store: SessionStore, options: DomOptions) {
  const session = await store.load(options.session);
  return withPage(session, async (page) => {
    if (options.format === "summary") {
      return domSummary(page);
    }
    if (options.format === "tree") {
      return domTree(page, options.maxNodes);
    }
    if (options.format === "html") {
      const html = await domHtml(page);
      return { html };
    }
    throw new HarnessCliError("INVALID_INPUT", `Unsupported dom format: ${options.format}`, false);
  });
}
