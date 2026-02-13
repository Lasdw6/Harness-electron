import type { SessionStore } from "../session/store.js";
import { fetchTargets, fetchVersion, pickTarget } from "../runtime/cdp.js";

type ConnectOptions = {
  host: string;
  port: number;
  session: string;
  windowTitle?: string;
  urlContains?: string;
};

export async function connectCommand(store: SessionStore, options: ConnectOptions) {
  const version = await fetchVersion(options.host, options.port);
  const targets = await fetchTargets(options.host, options.port);
  const selected = pickTarget(targets, options.windowTitle, options.urlContains);
  const session = await store.save(options.session, {
    host: options.host,
    port: options.port,
    wsEndpoint: version.webSocketDebuggerUrl,
    targetId: selected.id,
    targetUrl: selected.url,
    targetTitle: selected.title
  });

  return {
    session,
    browser: version.Browser,
    protocol: version["Protocol-Version"],
    target: {
      id: selected.id,
      title: selected.title,
      url: selected.url
    }
  };
}
