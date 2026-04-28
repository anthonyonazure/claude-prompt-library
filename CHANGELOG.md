# Changelog

All notable changes to claude-prompt-library are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] — 2026-04-28

### Security
- **Prototype-pollution guard.** `getPath()` in `src/expectations.ts` refuses to traverse `__proto__`, `constructor`, or `prototype` keys. Eval suites are author-controlled today, but if you ever import third-party suites this matters.
- **CLI input handling.** `JSON.parse(process.argv[3])` in `src/cli.ts` is now wrapped in try/catch with a clean error message instead of bubbling a `SyntaxError` stack trace (info-disclosure papercut).

### Changed
- Extracted `getPath` and `check` into `src/expectations.ts` so the security guard is genuinely tested rather than duplicated between the eval runner and the test file.
- Bumped `@anthropic-ai/sdk` to `^0.91`.

### Added
- 25 unit tests total (up from 22) — three explicitly verify the prototype-pollution refusal.

## [0.1.0] — 2026-04-27

### Added
- Initial release. Production-ready Claude prompts with structured outputs and a deterministic eval harness.
- Three prompt families:
  - `prompts/research/company-research.md` — six-phase chain-of-thought B2B company research.
  - `prompts/classify/lead-tier.md` — A/B/C lead classification with mandatory counter-evidence.
  - `prompts/outreach/personalize-email.md` — anti-template cold-email drafting.
- Generic runner: any prompt with YAML frontmatter + sibling `.schema.json` works without per-prompt code.
- Eval harness with path-based expectation kinds (`equals`, `contains`, `oneOf`, `minLength`, `maxLength`, `gte`, `lte`).
- Real Claude API runs on every shipped prompt; sample outputs in `docs/assets/`.
- 22 unit tests covering loader, expectation matcher, and structural prompt validation.
- GitHub Actions CI: typecheck + tests on push and PR.
