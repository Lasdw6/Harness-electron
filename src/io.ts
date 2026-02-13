import { protocolVersion, type ErrorEnvelope, type SuccessEnvelope } from "./contracts/types.js";
import type { HarnessError } from "./contracts/types.js";

export function ok<T>(
  command: string,
  session: string,
  data: T,
  meta?: Record<string, unknown>
): SuccessEnvelope<T> {
  return {
    ok: true,
    protocolVersion,
    command,
    session,
    data,
    ...(meta ? { meta } : {})
  };
}

export function fail(command: string, session: string, error: HarnessError): ErrorEnvelope {
  return {
    ok: false,
    protocolVersion,
    command,
    session,
    error
  };
}

export function printJson(payload: unknown): void {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}
