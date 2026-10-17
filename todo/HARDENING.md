# Fork hardening: status

Branch `fix/audit-hardening`, based on upstream `96dc4ac` (v0.7.1). Audit reports
that drove this work were written in a Claude session scratchpad on 2026-10-17;
the findings are summarised below so they do not need to be re-derived.

Baseline before changes: 845 pass / 0 fail / 2 skipped (`node --test`).
After the commits below: 871 pass / 0 fail / 2 skipped.

## Done

1. `ee74bcb` agy-rescue runs only on an explicit user request; rescue, continue,
   transfer and setup carry `disable-model-invocation: true`.
2. `aad27d1` result-handling skill no longer coaches rewording a task past the
   auto mode classifier ("throwaway sandbox" phrasing removed and forbidden).
3. `a51940f` `resolveWorkspaceRoot` never climbs to home or above (a `.git` stub
   in `~` made all of home the workspace).
4. `3a2859a` transfer deletes the brief only when it is a regular file under the
   temp dir and outside the workspace; reports `briefRemoved`.
5. `f613110` secret scan: `sk-` (OpenAI/Anthropic), `glpat-`, `npm_`, `hf_`,
   Telegram, `define('DB_PASSWORD', ...)`/salts, short dotenv passwords.

## Left, in priority order

- [ ] setup/README push users toward `command(*)`, `read_file(*)` and
      `always-proceed` (`scripts/agy-setup.mjs:445-491,528-534,634`,
      `scripts/lib/stop-review.mjs:63`, `README.md:520`). Split readiness: review
      and whisper need no shell; never recommend `always-proceed`.
- [ ] Review focus text is not secret-scanned (`agy-companion.mjs:234-283`);
      stop-gate sends up to 8000 chars of Claude's reply unscanned
      (`stop-review-gate-hook.mjs:77-90`).
- [ ] rescue template: refuse when `root` resolves to `$HOME`
      (`agents/agy-rescue.md` template, `root=$(git rev-parse ...) || root=$PWD`).
- [ ] Consider read-only default for rescue (`--mode accept-edits` only on an
      explicit fix/implement request); update README, continue.md, tests.
- [ ] Restore upstream attribution removed in `fdfd5eb` (NOTICE and
      LICENSE-APACHE-2.0 for code derived from openai/codex-plugin-cc).
- [ ] Model tables are stale for agy 1.4.0 (`skills/agy-cli-runtime/SKILL.md:42-50`,
      `README.md:387`): real ids are `gemini-3.8-flash-{high,medium,low}`,
      `claude-sonnet-4-6`, `claude-opus-4-6-thinking`, `gpt-oss-120b-medium`.
- [ ] Point `plugin.json` homepage/repository at `thewebarea/antigravity-plugin-cc`
      and bump the version with `scripts/bump-version.mjs`.
- [ ] Verify against agy 1.4.0 live (not done in the audit): stream-json result
      shape, `denied_actions`, `/usage` for quota, image tool output.

## Do not run

`npm run test:denials` and `npm run bench:review` (tests/live) build a scratch
HOME with symlinks into the real home and spend quota.
