# Command Reference (Human)

All commands emit one JSON object on stdout.

Default flow uses one implicit session, so no `--session` flag is needed.

## connect

Connect to Electron CDP and persist target metadata.

```bash
harness-electron connect --port 9222
```

Options:
- `--host` (default `127.0.0.1`)
- `--port` (required)
- `--window-title` optional target title filter
- `--url-contains` optional target URL filter

## dom

Inspect the active renderer DOM.

```bash
harness-electron dom --format summary
```

Options:
- `--format`: `summary`, `tree`, `html`
- `--max-nodes`: used by `tree` (default `300`)

## query

Discover elements and persist stable `elementId` handles in session state.

```bash
harness-electron query --role button --name "Add Project"
```

Options:
- selector flags (required): `--css`, `--xpath`, `--text`, `--role`, `--testid`
- `--name` optional with `--role`
- `--limit` max results (default `10`)
- `--visible-only` return only visible matches

## type

Type into an input/control.

```bash
harness-electron type --css "input[type=email]" --value "user@example.com"
harness-electron type --element-id e2 --value "user@example.com"
```

Options:
- `--value` required typed text
- `--clear` clear first
- `--timeout` default `5000`
- target options:
  - selector flags (`--css|--xpath|--text|--role|--testid`, optional `--name`)
  - or `--element-id <id>` from `query`
  - disambiguation: `--index <n>` or `--strict-single`

## click

Click a matched element.

```bash
harness-electron click --role button --name "Sign in"
harness-electron click --element-id e1
```

## wait

Wait for state transitions.

```bash
harness-electron wait --for visible --css ".toast.success"
harness-electron wait --for url --value "/dashboard"
```

Rules:
- `--for url`: requires `--value`, does not accept selector flags or `--element-id`
- `--for text`: requires target + `--value`
- `--for visible|hidden`: requires target

## screenshot

Capture viewport, full page, or one element.

```bash
harness-electron screenshot --path "./artifacts/state.png" --full-page
harness-electron screenshot --path "./artifacts/debug-map.png" --text "Debug Map"
harness-electron screenshot --path "./artifacts/show-button.png" --element-id e3
```

Options:
- `--timeout` screenshot timeout in ms (default `15000`)
- target options: selector flags or `--element-id`
- `--full-page` cannot be combined with selector flags or `--element-id`

## evaluate

Evaluate JavaScript in page context.

```bash
harness-electron evaluate --script "document.title"
```

## assert

Run assertions.

```bash
harness-electron assert --kind visible --css "#dashboard"
harness-electron assert --kind text --element-id e4 --expected "Connected"
harness-electron assert --kind url --expected "/dashboard"
```

Kinds:
- `exists`
- `visible`
- `text` (requires target + `--expected`)
- `url` (requires `--expected`, no target)

## disconnect

Remove one local session.

```bash
harness-electron disconnect
```

## sessions

List or prune sessions.

```bash
harness-electron sessions list
harness-electron sessions prune
```

Advanced override:
- pass `--session <id>` only when you intentionally run multiple concurrent sessions.

## capabilities

High-level feature discovery.

```bash
harness-electron capabilities
```

## schema

Machine-readable command + flag schema for LLM tool planning.

```bash
harness-electron schema
```

## version

Return package metadata and package version as JSON.

```bash
harness-electron version
```
