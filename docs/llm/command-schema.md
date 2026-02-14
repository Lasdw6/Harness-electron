# Command Schema (LLM)

Use `harness-electron schema` to discover commands and flags at runtime.

Example:

```bash
harness-electron schema
```

Example response (trimmed):

```json
{
  "ok": true,
  "protocolVersion": "1.0",
  "command": "schema",
  "session": "default",
  "data": {
    "package": "@harnessgg/electron",
    "defaults": {
      "session": "default",
      "timeoutMs": 5000
    },
    "globalOptionalOptions": [
      {
        "name": "--session",
        "default": "default",
        "advanced": true
      }
    ],
    "selectorRules": {
      "mutuallyExclusive": [
        "--css",
        "--xpath",
        "--text",
        "--role",
        "--testid",
        "--element-id"
      ],
      "roleNameOnlyWithRole": true
    },
    "commands": [
      {
        "name": "query",
        "summary": "find matching elements and persist reusable element ids",
        "options": [
          { "name": "--limit", "type": "number", "default": 10 }
        ]
      }
    ]
  }
}
```

Agent guidance:
1. Call `schema` once per run and cache it.
2. Use `query` first when UI labels are unstable.
3. Prefer `--element-id` for follow-up actions after `query`.
4. Omit `--session` for normal runs; only add it for intentional multi-session isolation.
5. Use `version` when the agent needs an explicit package version in logs/reports.
