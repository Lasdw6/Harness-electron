import path from "node:path";
import fs from "fs-extra";
import { sessionRecordSchema, type ElementReference, type SessionRecord } from "../contracts/types.js";
import { HarnessCliError } from "../errors.js";

function nowIso(): string {
  return new Date().toISOString();
}

export class SessionStore {
  private readonly baseDir: string;

  constructor(cwd = process.cwd()) {
    this.baseDir = path.join(cwd, ".harness-electron", "sessions");
  }

  getBaseDir(): string {
    return this.baseDir;
  }

  private getSessionPath(id: string): string {
    return path.join(this.baseDir, `${id}.json`);
  }

  async ensureDir(): Promise<void> {
    await fs.ensureDir(this.baseDir);
  }

  async save(
    id: string,
    record: Omit<SessionRecord, "id" | "createdAt" | "updatedAt"> &
      Partial<Pick<SessionRecord, "createdAt">>
  ): Promise<SessionRecord> {
    await this.ensureDir();
    const existing = await this.loadOptional(id);
    const fullRecord: SessionRecord = {
      id,
      ...record,
      elementMap: record.elementMap ?? existing?.elementMap,
      createdAt: existing?.createdAt ?? record.createdAt ?? nowIso(),
      updatedAt: nowIso()
    };
    sessionRecordSchema.parse(fullRecord);
    await fs.writeJson(this.getSessionPath(id), fullRecord, { spaces: 2 });
    return fullRecord;
  }

  async load(id: string): Promise<SessionRecord> {
    const sessionPath = this.getSessionPath(id);
    if (!(await fs.pathExists(sessionPath))) {
      const connectHint =
        id === "default"
          ? "harness-electron connect --port 9222"
          : `harness-electron connect --port 9222 --session ${id}`;
      throw new HarnessCliError("INVALID_INPUT", `Session "${id}" not found`, false, [
        connectHint
      ]);
    }
    const record = await fs.readJson(sessionPath);
    return sessionRecordSchema.parse(record);
  }

  async loadOptional(id: string): Promise<SessionRecord | null> {
    const sessionPath = this.getSessionPath(id);
    if (!(await fs.pathExists(sessionPath))) {
      return null;
    }
    const record = await fs.readJson(sessionPath);
    return sessionRecordSchema.parse(record);
  }

  async list(): Promise<SessionRecord[]> {
    await this.ensureDir();
    const files = await fs.readdir(this.baseDir);
    const sessions: SessionRecord[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) {
        continue;
      }
      const record = await fs.readJson(path.join(this.baseDir, file));
      sessions.push(sessionRecordSchema.parse(record));
    }
    return sessions.sort((a, b) => a.id.localeCompare(b.id));
  }

  async delete(id: string): Promise<boolean> {
    const sessionPath = this.getSessionPath(id);
    const exists = await fs.pathExists(sessionPath);
    if (!exists) {
      return false;
    }
    await fs.remove(sessionPath);
    return true;
  }

  async prune(id?: string): Promise<number> {
    if (id) {
      return (await this.delete(id)) ? 1 : 0;
    }

    await this.ensureDir();
    const files = await fs.readdir(this.baseDir);
    let removed = 0;
    for (const file of files) {
      if (!file.endsWith(".json")) {
        continue;
      }
      await fs.remove(path.join(this.baseDir, file));
      removed += 1;
    }
    return removed;
  }

  async saveElement(sessionId: string, elementId: string, reference: ElementReference): Promise<void> {
    const session = await this.load(sessionId);
    const elementMap = {
      ...(session.elementMap ?? {}),
      [elementId]: reference
    };
    await this.save(sessionId, {
      host: session.host,
      port: session.port,
      wsEndpoint: session.wsEndpoint,
      targetId: session.targetId,
      targetUrl: session.targetUrl,
      targetTitle: session.targetTitle,
      elementMap,
      createdAt: session.createdAt
    });
  }

  async loadElement(sessionId: string, elementId: string): Promise<ElementReference> {
    const session = await this.load(sessionId);
    const reference = session.elementMap?.[elementId];
    const queryHint =
      sessionId === "default"
        ? "harness-electron query --text \"...\""
        : `harness-electron query --session ${sessionId} --text "..."`;
    if (!reference) {
      throw new HarnessCliError("INVALID_INPUT", `Element "${elementId}" not found in session "${sessionId}"`, false, [
        queryHint,
        `harness-electron schema`
      ]);
    }
    return reference;
  }

  async nextElementId(sessionId: string): Promise<string> {
    const session = await this.load(sessionId);
    const keys = Object.keys(session.elementMap ?? {});
    let max = 0;
    for (const key of keys) {
      const match = key.match(/^e(\d+)$/);
      if (!match) {
        continue;
      }
      const n = Number.parseInt(match[1], 10);
      if (Number.isInteger(n) && n > max) {
        max = n;
      }
    }
    return `e${max + 1}`;
  }
}
