# Command Reference (Human)

All commands return JSON on stdout.

## connect

Connect to Electron CDP and create/update a session.

```bash
harness-electron connect --host 127.0.0.1 --port 9222
```

Options:
- `--host` (default `127.0.0.1`)
- `--port` (required)
- `--session` (default `default`)
- `--window-title` optional target filter
- `--url-contains` optional target filter

Implementation detail (if you own Electron app startup code):

```js
app.commandLine.appendSwitch("remote-debugging-port", "9222");
```

## dom

Inspect the current renderer DOM.

```bash
harness-electron dom --format summary
```

Options:
- `--format` one of `summary`, `tree`, `html`
- `--max-nodes` used by `tree` (default `300`)

## type

Type into an input/control.

```bash
harness-electron type --css "input[type=email]" --value "user@example.com"
```

Options:
- `--value` required typed text
- `--clear` clear input first
- `--timeout` default `5000`
- selector flags: `--css`, `--xpath`, `--text`, `--role`, `--testid`
- `--name` optional when using `--role`

## click

Click a matched element.

```bash
harness-electron click --role button --name "Sign in"
```

## wait

Wait for UI state.

```bash
harness-electron wait --for visible --css ".toast.success"
harness-electron wait --for url --value "/dashboard"
```

Options:
- `--for`: `visible`, `hidden`, `url`, `text`
- `--value`: required for `url` and `text`
- selector required for `visible`, `hidden`, `text`

## screenshot

Capture the current page.

```bash
harness-electron screenshot --path "./artifacts/state.png" --full-page
harness-electron screenshot --path "./artifacts/debug-map.png" --text "Debug Map"
harness-electron screenshot --path "./artifacts/debug-map-button.png" --role button --name "Show"
```

Options:
- `--timeout` capture timeout in ms (default `15000`)
- optional selector flags to capture only one element: `--css`, `--xpath`, `--text`, `--role`, `--testid`
- `--full-page` captures whole page and cannot be combined with selector flags

## evaluate

Evaluate JavaScript in page context.

```bash
harness-electron evaluate --script "document.title"
```

## assert

Run assertion checks.

```bash
harness-electron assert --kind visible --css "#dashboard"
harness-electron assert --kind text --css ".status" --expected "Connected"
harness-electron assert --kind url --expected "/dashboard"
```

Kinds:
- `exists`
- `visible`
- `text` (requires `--expected`)
- `url` (requires `--expected`, selector not required)

## disconnect

Remove local session.

```bash
harness-electron disconnect
```

## sessions

List or prune session files.

```bash
harness-electron sessions list
harness-electron sessions prune
harness-electron sessions prune --session alt-app
```

## capabilities

Machine-discover supported command/features.

```bash
harness-electron capabilities
```
