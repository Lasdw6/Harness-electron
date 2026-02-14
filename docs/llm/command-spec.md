# Command Spec (LLM)

## Global rules

1. Each command prints exactly one JSON object to stdout.
2. Exit code `0` means success; non-zero means failure.
3. Connect target app first with CDP enabled (`--remote-debugging-port=<port>`).
4. Session is implicit by default; do not pass `--session` unless you intentionally run multi-session flows.

## Targeting model

Use one of:
1. Selector flags: `--css | --xpath | --text | --role | --testid` (optional `--name` with `--role`)
2. `--element-id <id>` returned by `query`

Disambiguation for selector mode:
1. `--index <n>` picks nth match (0-based, default `0`)
2. `--strict-single` requires exactly one match
3. Do not combine `--element-id` with selector flags or disambiguation flags

## Command grammar

## connect

`harness-electron connect --port <int> [--host <host>] [--window-title <text>] [--url-contains <text>]`

## dom

`harness-electron dom [--format summary|tree|html] [--max-nodes <int>]`

## query

`harness-electron query <selector> [--limit <int>] [--visible-only]`

Returns persisted `elementId`s that can be reused in later commands.

## type

`harness-electron type <target> --value <text> [--clear] [--timeout <ms>]`

## click

`harness-electron click <target> [--timeout <ms>]`

## wait

`harness-electron wait --for visible|hidden|url|text [<target>] [--value <text>] [--timeout <ms>]`

Rules:
1. `--for url`: requires `--value`; no target allowed
2. `--for text`: requires target + `--value`
3. `--for visible|hidden`: requires target

## screenshot

`harness-electron screenshot --path <path> [--full-page] [<target>] [--timeout <ms>]`

Rules:
1. No target and no `--full-page`: viewport screenshot
2. With target: element screenshot
3. `--full-page` cannot be combined with target flags

## evaluate

`harness-electron evaluate --script <js_expr>`

## assert

`harness-electron assert --kind exists|visible|text|url [<target>] [--expected <text>] [--timeout <ms>]`

Rules:
1. `url`: requires `--expected`; target not allowed
2. `text`: requires target + `--expected`
3. `exists|visible`: require target

## disconnect

`harness-electron disconnect`

## sessions

`harness-electron sessions list`

`harness-electron sessions prune`

## capabilities

`harness-electron capabilities`

## schema

`harness-electron schema`

Use for machine-readable command/flag discovery.

## version

`harness-electron version`

Returns package name, version, and description as JSON.

## Advanced multi-session override

If you need isolated concurrent sessions, pass `--session <id>` explicitly to supported commands.
