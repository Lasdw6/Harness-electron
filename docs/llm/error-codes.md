# Error Codes

## Exit code mapping

1. `0`: Success
2. `10`: `INVALID_INPUT`
3. `20`: `CONNECT_FAILED`, `TARGET_NOT_FOUND`
4. `30`: `INVALID_SELECTOR`, `ACTION_FAILED`
5. `40`: `TIMEOUT`
6. `50`: `ASSERT_FAIL`
7. `70`: `INTERNAL_ERROR`

## Error payload

```json
{
  "ok": false,
  "protocolVersion": "1.0",
  "command": "click",
  "session": "default",
  "error": {
    "code": "TIMEOUT",
    "message": "locator.click: Timeout 5000ms exceeded",
    "retryable": true,
    "suggestedNext": [
      "harness-electron dom --format summary"
    ],
    "details": {
      "name": "TimeoutError",
      "stack": "TimeoutError: ... (truncated)"
    }
  }
}
```

## Agent handling guidance

1. Retry once for `CONNECT_FAILED` and `TIMEOUT`.
2. Do not retry unchanged for `INVALID_SELECTOR`; re-discover DOM first.
3. Treat `ASSERT_FAIL` as test failure, not infrastructure failure.
