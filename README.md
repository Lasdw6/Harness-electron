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

## Prerequisite

Start your Electron app with a remote debugging port:

```bash
electron . --remote-debugging-port=9222
```

## Quick flow

```bash
harness-electron connect --port 9222
harness-electron dom --format summary
harness-electron type --css "input[type=email]" --value "user@example.com"
harness-electron click --role button --name "Sign in"
harness-electron assert --kind url --expected "/dashboard"
harness-electron screenshot --path "./artifacts/login.png"
harness-electron disconnect
```

`--session` defaults to `default`, so you only pass it when you need multiple concurrent sessions.

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

## Docs

- Human reference: `docs/human/commands.md`
- LLM quickstart: `docs/llm/quickstart.md`
- LLM command spec: `docs/llm/command-spec.md`
- LLM response schema: `docs/llm/response-schema.json`
- LLM error codes: `docs/llm/error-codes.md`
