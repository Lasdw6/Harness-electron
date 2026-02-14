import { protocolVersion } from "../contracts/types.js";

type OptionSchema = {
  name: string;
  type: "string" | "number" | "boolean";
  required?: boolean;
  default?: string | number | boolean;
  repeatable?: boolean;
  enum?: string[];
  description: string;
};

type CommandSchema = {
  name: string;
  summary: string;
  options: OptionSchema[];
};

type GlobalOptionSchema = OptionSchema & {
  appliesTo: string[];
  advanced?: boolean;
};

const discoverySelectorOptions: OptionSchema[] = [
  { name: "--css", type: "string", description: "CSS selector", repeatable: true },
  { name: "--xpath", type: "string", description: "XPath selector", repeatable: true },
  { name: "--text", type: "string", description: "text selector", repeatable: true },
  { name: "--role", type: "string", description: "ARIA role selector", repeatable: true },
  { name: "--testid", type: "string", description: "data-testid selector", repeatable: true },
  { name: "--name", type: "string", description: "accessible name filter for role", repeatable: true }
];

const targetSelectorOptions: OptionSchema[] = [
  ...discoverySelectorOptions,
  { name: "--element-id", type: "string", description: "element id returned by query" },
  { name: "--index", type: "number", default: 0, description: "0-based selector match index" },
  { name: "--strict-single", type: "boolean", default: false, description: "require exactly one selector match" }
];

const commands: CommandSchema[] = [
  {
    name: "connect",
    summary: "connect to an Electron CDP endpoint and persist a session",
    options: [
      { name: "--port", type: "number", required: true, description: "CDP port" },
      { name: "--host", type: "string", default: "127.0.0.1", description: "CDP host" },
      { name: "--window-title", type: "string", description: "target title filter", repeatable: true },
      { name: "--url-contains", type: "string", description: "target URL filter", repeatable: true }
    ]
  },
  {
    name: "dom",
    summary: "read renderer DOM in summary/tree/html formats",
    options: [
      {
        name: "--format",
        type: "string",
        default: "summary",
        enum: ["summary", "tree", "html"],
        description: "output mode"
      },
      { name: "--max-nodes", type: "number", default: 300, description: "tree node cap" }
    ]
  },
  {
    name: "query",
    summary: "find matching elements and persist reusable element ids",
    options: [
      { name: "--limit", type: "number", default: 10, description: "maximum matches to return" },
      { name: "--visible-only", type: "boolean", default: false, description: "return visible matches only" },
      ...discoverySelectorOptions
    ]
  },
  {
    name: "type",
    summary: "type text into a matched element",
    options: [
      { name: "--value", type: "string", required: true, repeatable: true, description: "text to type" },
      { name: "--clear", type: "boolean", default: false, description: "clear before typing" },
      { name: "--timeout", type: "number", default: 5000, description: "timeout milliseconds" },
      ...targetSelectorOptions
    ]
  },
  {
    name: "click",
    summary: "click a matched element",
    options: [
      { name: "--timeout", type: "number", default: 5000, description: "timeout milliseconds" },
      ...targetSelectorOptions
    ]
  },
  {
    name: "wait",
    summary: "wait for visibility, text, or URL conditions",
    options: [
      {
        name: "--for",
        type: "string",
        required: true,
        enum: ["visible", "hidden", "url", "text"],
        description: "wait mode"
      },
      { name: "--value", type: "string", repeatable: true, description: "expected URL/text substring" },
      { name: "--timeout", type: "number", default: 5000, description: "timeout milliseconds" },
      ...targetSelectorOptions
    ]
  },
  {
    name: "screenshot",
    summary: "capture page or element screenshots",
    options: [
      { name: "--path", type: "string", required: true, description: "output path" },
      { name: "--full-page", type: "boolean", default: false, description: "capture full document" },
      { name: "--timeout", type: "number", default: 15000, description: "timeout milliseconds" },
      ...targetSelectorOptions
    ]
  },
  {
    name: "evaluate",
    summary: "evaluate JavaScript in page context",
    options: [
      { name: "--script", type: "string", required: true, repeatable: true, description: "JavaScript expression" }
    ]
  },
  {
    name: "assert",
    summary: "assert DOM or URL state",
    options: [
      {
        name: "--kind",
        type: "string",
        required: true,
        enum: ["exists", "visible", "text", "url"],
        description: "assertion kind"
      },
      { name: "--expected", type: "string", repeatable: true, description: "expected text/url substring" },
      { name: "--timeout", type: "number", default: 5000, description: "timeout milliseconds" },
      ...targetSelectorOptions
    ]
  },
  {
    name: "disconnect",
    summary: "remove one session record",
    options: []
  },
  {
    name: "sessions list",
    summary: "list saved sessions",
    options: []
  },
  {
    name: "sessions prune",
    summary: "remove one or all sessions",
    options: []
  },
  {
    name: "capabilities",
    summary: "return high-level supported features",
    options: []
  },
  {
    name: "schema",
    summary: "return machine-readable command/flag schema",
    options: []
  },
  {
    name: "version",
    summary: "return package metadata and current package version",
    options: []
  }
];

export function schemaCommand() {
  const sessionAppliesTo = [
    "connect",
    "dom",
    "query",
    "type",
    "click",
    "wait",
    "screenshot",
    "evaluate",
    "assert",
    "disconnect",
    "sessions prune"
  ];

  return {
    protocolVersion,
    package: "@harnessgg/electron",
    defaults: {
      session: "default",
      timeoutMs: 5000
    },
    globalOptionalOptions: [
      {
        name: "--session",
        type: "string",
        default: "default",
        description: "optional advanced session override; omit for default flow",
        advanced: true,
        appliesTo: sessionAppliesTo
      } satisfies GlobalOptionSchema
    ],
    selectorRules: {
      mutuallyExclusive: ["--css", "--xpath", "--text", "--role", "--testid", "--element-id"],
      roleNameOnlyWithRole: true
    },
    commands
  };
}
