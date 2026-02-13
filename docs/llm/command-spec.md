# Command Spec (LLM)

## Global rules

1. Commands emit one JSON object to stdout.
2. Exit code `0` means success, non-zero means failure.
3. Use `--session` to reuse connection metadata across one-shot commands.
4. Target Electron app must expose a CDP port (for example `--remote-debugging-port=9222`) before `connect`.

## Command grammar

## connect

`harness-electron connect --port <int> [--host <host>] [--session <id>] [--window-title <text>] [--url-contains <text>]`

## dom

`harness-electron dom [--session <id>] [--format summary|tree|html] [--max-nodes <int>]`

## type

`harness-electron type [--session <id>] <selector> --value <text> [--clear] [--timeout <ms>]`

## click

`harness-electron click [--session <id>] <selector> [--timeout <ms>]`

## wait

`harness-electron wait [--session <id>] --for visible|hidden|url|text [<selector>] [--value <text>] [--timeout <ms>]`

Rules:
1. `--for url` requires `--value`, no selector required.
2. `--for text` requires selector + `--value`.
3. `--for visible|hidden` requires selector.

## screenshot

`harness-electron screenshot [--session <id>] --path <path> [--full-page] [<selector>] [--timeout <ms>]`

Rules:
1. With no selector, captures viewport by default.
2. With `--full-page`, captures whole page.
3. With selector, captures matched element only.
4. `--full-page` and selector flags are mutually exclusive.

## evaluate

`harness-electron evaluate [--session <id>] --script <js_expr>`

## assert

`harness-electron assert [--session <id>] --kind exists|visible|text|url [<selector>] [--expected <text>] [--timeout <ms>]`

Rules:
1. `url` requires `--expected`, selector not required.
2. `text` requires selector + `--expected`.
3. `exists|visible` require selector.

## disconnect

`harness-electron disconnect [--session <id>]`

## sessions

`harness-electron sessions list`

`harness-electron sessions prune [--session <id>]`

## capabilities

`harness-electron capabilities`

## Selector syntax

Exactly one selector flag must be set unless command kind/mode explicitly does not need one:

1. `--css <selector>`
2. `--xpath <selector>`
3. `--text <text>`
4. `--role <aria_role> [--name <accessible_name>]`
5. `--testid <test_id>`

Notes:
1. Multi-word values are supported (for example `--text "Add Project"` and `--name "Add Project"`).
2. If your runner splits args, pass quoted values for selectors and free-text flags.
