import { z } from "zod";

export const protocolVersion = "1.0";

export const errorCodeSchema = z.enum([
  "INVALID_INPUT",
  "CONNECT_FAILED",
  "TARGET_NOT_FOUND",
  "INVALID_SELECTOR",
  "ACTION_FAILED",
  "TIMEOUT",
  "ASSERT_FAIL",
  "INTERNAL_ERROR"
]);

export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const harnessErrorSchema = z.object({
  code: errorCodeSchema,
  message: z.string(),
  retryable: z.boolean(),
  suggestedNext: z.array(z.string()),
  details: z.record(z.string(), z.unknown()).optional()
});

export type HarnessError = z.infer<typeof harnessErrorSchema>;

export const successEnvelopeSchema = z.object({
  ok: z.literal(true),
  protocolVersion: z.literal(protocolVersion),
  command: z.string(),
  session: z.string(),
  data: z.unknown(),
  meta: z.record(z.string(), z.unknown()).optional()
});

export const errorEnvelopeSchema = z.object({
  ok: z.literal(false),
  protocolVersion: z.literal(protocolVersion),
  command: z.string(),
  session: z.string(),
  error: harnessErrorSchema
});

export type SuccessEnvelope<T> = {
  ok: true;
  protocolVersion: typeof protocolVersion;
  command: string;
  session: string;
  data: T;
  meta?: Record<string, unknown>;
};

export type ErrorEnvelope = {
  ok: false;
  protocolVersion: typeof protocolVersion;
  command: string;
  session: string;
  error: HarnessError;
};

export type HarnessResult<T> = SuccessEnvelope<T> | ErrorEnvelope;

export const sessionRecordSchema = z.object({
  id: z.string(),
  host: z.string(),
  port: z.number().int().positive(),
  wsEndpoint: z.string(),
  targetId: z.string().optional(),
  targetUrl: z.string().optional(),
  targetTitle: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type SessionRecord = z.infer<typeof sessionRecordSchema>;

export const selectorInputSchema = z.object({
  css: z.string().optional(),
  xpath: z.string().optional(),
  text: z.string().optional(),
  role: z.string().optional(),
  testid: z.string().optional(),
  name: z.string().optional()
});

export type SelectorInput = z.infer<typeof selectorInputSchema>;

export const assertKindSchema = z.enum(["exists", "visible", "text", "url"]);
export type AssertKind = z.infer<typeof assertKindSchema>;

export const capabilitySchema = z.object({
  protocolVersion: z.literal(protocolVersion),
  package: z.string(),
  commands: z.array(z.string()),
  selectors: z.array(z.string()),
  assertions: z.array(assertKindSchema),
  defaults: z.object({
    timeoutMs: z.number().int().positive(),
    sessionPath: z.string()
  })
});

export type CapabilitiesResponse = z.infer<typeof capabilitySchema>;
