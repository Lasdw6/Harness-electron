import { HarnessCliError } from "../errors.js";

export type CdpVersionResponse = {
  webSocketDebuggerUrl: string;
  Browser: string;
  "Protocol-Version": string;
};

export type CdpTarget = {
  id: string;
  type: string;
  title: string;
  url: string;
  webSocketDebuggerUrl?: string;
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new HarnessCliError("CONNECT_FAILED", `Failed to fetch ${url}: ${response.status}`, true, [
      "Ensure Electron is running with --remote-debugging-port"
    ]);
  }
  return (await response.json()) as T;
}

export async function fetchVersion(host: string, port: number): Promise<CdpVersionResponse> {
  return getJson<CdpVersionResponse>(`http://${host}:${port}/json/version`);
}

export async function fetchTargets(host: string, port: number): Promise<CdpTarget[]> {
  return getJson<CdpTarget[]>(`http://${host}:${port}/json/list`);
}

export function pickTarget(
  targets: CdpTarget[],
  titleContains?: string,
  urlContains?: string
): CdpTarget {
  const pages = targets.filter((target) => target.type === "page");
  if (pages.length === 0) {
    throw new HarnessCliError("TARGET_NOT_FOUND", "No page target found in Electron instance", true, [
      "Open a BrowserWindow and retry connect"
    ]);
  }

  const filtered = pages.filter((target) => {
    const titleOk = titleContains ? target.title.includes(titleContains) : true;
    const urlOk = urlContains ? target.url.includes(urlContains) : true;
    return titleOk && urlOk;
  });

  if (filtered.length === 0) {
    throw new HarnessCliError(
      "TARGET_NOT_FOUND",
      "No page target matched window-title/url filters",
      true,
      ["Run `harness-electron connect --port <port>` without filters to inspect targets"]
    );
  }

  return filtered[0];
}
