import path from "node:path";
import fs from "fs-extra";
import { sessionRecordSchema, type SessionRecord } from "../contracts/types.js";
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
}
