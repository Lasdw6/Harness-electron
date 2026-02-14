# LLM Quickstart

Use this sequence for reliable Electron UI automation.

## 0) Start app with CDP enabled

```bash
electron . --remote-debugging-port=9222
```

If app startup is internal, make sure a CDP endpoint exists before `connect`.

## 1) Discover contract

```bash
harness-electron schema
```

## 2) Connect

```bash
harness-electron connect --port 9222
```

## 3) Fast health check

```bash
harness-electron dom --format summary
```

## 4) Query stable targets

```bash
harness-electron query --role button --name "Sign in"
```

Take the returned `elementId` (for example `e1`).

## 5) Interact

```bash
harness-electron type --css "input[type=email]" --value "user@example.com"
harness-electron type --css "input[type=password]" --value "my-secret"
harness-electron click --element-id e1
```

## 6) Verify

```bash
harness-electron assert --kind url --expected "/dashboard"
harness-electron assert --kind visible --css "#dashboard"
```

## 7) Capture artifact

```bash
harness-electron screenshot --path "./artifacts/dashboard.png"
```

## 8) Cleanup

```bash
harness-electron disconnect
```

## Retry strategy

1. On `CONNECT_FAILED`, rerun `connect` and verify port.
2. On `TARGET_NOT_FOUND`, open/focus a BrowserWindow and reconnect.
3. On `TIMEOUT`, retry with larger `--timeout`.
4. On `INVALID_SELECTOR`, run `dom --format tree` and retry with a different target strategy.
