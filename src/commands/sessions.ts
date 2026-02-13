import type { SessionStore } from "../session/store.js";

export async function listSessionsCommand(store: SessionStore) {
  const sessions = await store.list();
  return {
    count: sessions.length,
    sessions
  };
}

export async function pruneSessionsCommand(store: SessionStore, session?: string) {
  const removed = await store.prune(session);
  return {
    removed,
    scope: session ?? "all"
  };
}

export async function disconnectCommand(store: SessionStore, session: string) {
  const removed = await store.delete(session);
  return {
    removed,
    session
  };
}
