import type { ErrorCode, HarnessError } from "./contracts/types.js";

export class HarnessCliError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly suggestedNext: string[];
  readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    retryable: boolean,
    suggestedNext: string[] = [],
    details?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.suggestedNext = suggestedNext;
    this.details = details;
  }
}

const exitCodes: Record<ErrorCode, number> = {
  INVALID_INPUT: 10,
  CONNECT_FAILED: 20,
  TARGET_NOT_FOUND: 20,
  INVALID_SELECTOR: 30,
  ACTION_FAILED: 30,
  TIMEOUT: 40,
  ASSERT_FAIL: 50,
  INTERNAL_ERROR: 70
};

export function toExitCode(code: ErrorCode): number {
  return exitCodes[code];
}

export function normalizeError(error: unknown): HarnessError {
  if (error instanceof HarnessCliError) {
    return {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      suggestedNext: error.suggestedNext,
      ...(error.details ? { details: error.details } : {})
    };
  }

  if (error instanceof Error) {
    return {
      code: "INTERNAL_ERROR",
      message: error.message,
      retryable: false,
      suggestedNext: ["harness-electron dom --format summary"],
      details: {
        name: error.name,
        stack: error.stack?.split("\n").slice(0, 6).join("\n")
      }
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "Unknown error",
    retryable: false,
    suggestedNext: ["harness-electron dom --format summary"],
    details: {
      raw: typeof error === "string" ? error : JSON.stringify(error)
    }
  };
}
