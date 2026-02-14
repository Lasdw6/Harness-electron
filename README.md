# @harnessgg/electron

Lets AI agents test Electron apps through CLI commands and machine-readable JSON.

This package is agent-first (strict JSON output), with docs for both humans and LLMs.

- GitHub: https://github.com/harnessgg/electron
- Website: https://harness.gg

## Install

```bash
npm i -D @harnessgg/electron
```

Install as a development dependency so it is not part of production app installs.

For local source runs:

```bash
npm run dev -- capabilities
npm run dev -- click -- --text "Add Project"
```

## Publish automation

This repo includes `.github/workflows/publish.yml`.

- Triggers:
  - push tag `v*` (recommended release flow)
  - manual `workflow_dispatch`
- Steps:
  - `npm ci`
  - `npm run build`
  - `npm test`
  - publish with `npm publish --access public --provenance`
- Auth:
  - npm Trusted Publishing (OIDC) for this GitHub repository/workflow
  - no long-lived `NPM_TOKEN` required

## Prerequisite

Start your Electron app with a remote debugging port:

```bash
electron . --remote-debugging-port=9222
```

## Quick flow

```bash
harness-electron connect --port 9222
harness-electron dom --format summary
harness-electron query --role button --name "Sign in"
harness-electron type --css "input[type=email]" --value "user@example.com"
harness-electron click --element-id e1
harness-electron assert --kind url --expected "/dashboard"
harness-electron screenshot --path "./artifacts/login.png"
harness-electron version
harness-electron disconnect
```

Session is implicit by default. Do not pass `--session` unless you intentionally need multiple concurrent sessions.

Use `harness-electron schema` when an LLM needs machine-readable command and flag definitions.

## JSON output examples

Success (`dom`):

```json
{
  "ok": true,
  "protocolVersion": "1.0",
  "command": "dom",
  "session": "default",
  "data": {
    "title": "BoostOS",
    "url": "http://localhost:5174/",
    "buttons": 100,
    "inputs": 0,
    "forms": 0
  }
}
```

Success (`query`):

```json
{
  "ok": true,
  "protocolVersion": "1.0",
  "command": "query",
  "session": "default",
  "data": {
    "count": 2,
    "totalMatches": 2,
    "limit": 10,
    "visibleOnly": false,
    "elements": [
      {
        "elementId": "e1",
        "index": 0,
        "tag": "button",
        "text": "Sign in",
        "role": null,
        "ariaLabel": null,
        "testId": null,
        "visible": true
      }
    ]
  }
}
```

Failure (`screenshot` timeout):

```json
{
  "ok": false,
  "protocolVersion": "1.0",
  "command": "screenshot",
  "session": "default",
  "error": {
    "code": "TIMEOUT",
    "message": "page.screenshot: Timeout 30000ms exceeded.",
    "retryable": true,
    "suggestedNext": [
      "harness-electron dom --format summary",
      "Retry command with a larger timeout"
    ],
    "details": {
      "source": "TimeoutError"
    }
  }
}
```

Success (`version`):

```json
{
  "ok": true,
  "protocolVersion": "1.0",
  "command": "version",
  "session": "default",
  "data": {
    "package": "@harnessgg/electron",
    "version": "0.1.0",
    "description": "CLI harness for AI agents to test Electron apps",
    "protocolVersion": "1.0"
  }
}
```

## Docs

- Human reference: `docs/human/commands.md`
- LLM quickstart: `docs/llm/quickstart.md`
- LLM command spec: `docs/llm/command-spec.md`
- LLM schema output guide: `docs/llm/command-schema.md`
- LLM response schema: `docs/llm/response-schema.json`
- LLM error codes: `docs/llm/error-codes.md`
