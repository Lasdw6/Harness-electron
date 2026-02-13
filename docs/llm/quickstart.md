# LLM Quickstart

Use exact command sequence below for a login flow.

## 1) Connect

```bash
harness-electron connect --port 9222
```

## 2) Inspect DOM

```bash
harness-electron dom --format summary
```

If needed:

```bash
harness-electron dom --format tree --max-nodes 500
```

## 3) Interact

```bash
harness-electron type --css "input[type=email]" --value "user@example.com"
harness-electron type --css "input[type=password]" --value "my-secret"
harness-electron click --role button --name "Sign in"
```

## 4) Verify

```bash
harness-electron assert --kind url --expected "/dashboard"
harness-electron assert --kind visible --css "#dashboard"
```

## 5) Artifact

```bash
harness-electron screenshot --path "./artifacts/dashboard.png"
harness-electron screenshot --path "./artifacts/debug-map.png" --text "Debug Map"
```

## 6) Cleanup

```bash
harness-electron disconnect
```

## Retry strategy

1. On `CONNECT_FAILED`, rerun `connect` and verify port.
2. On `TARGET_NOT_FOUND`, open/focus app window and reconnect.
3. On `TIMEOUT`, retry once with larger `--timeout`.
4. On `INVALID_SELECTOR`, run `dom --format tree` and choose a different selector.
