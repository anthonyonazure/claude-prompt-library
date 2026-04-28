# Changelog

All notable changes to claude-prompt-library are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] — 2026-04-28

### Added
- Seven new prompts across four new categories:
  - `prompts/sales/proposal-generator.md` — structured B2B proposal with willingness to disqualify when an off-the-shelf tool fits.
  - `prompts/sales/objection-handler.md` — classify objections (price/timing/authority/competitor/fit/trust/stall) and produce 2-3 scripted responses.
  - `prompts/sales/demo-follow-up.md` — 24-hour post-demo email, internal CRM notes, and a `forecastable: boolean` deal flag.
  - `prompts/customer-success/health-score.md` — health across 4 dimensions taking the min (not the average) so weak signals aren't hidden.
  - `prompts/support/ticket-triage.md` — severity / category / sentiment / route + first-draft response, with prompt-injection-aware classification.
  - `prompts/summarize/meeting-summary.md` — decisions, action items, and open questions from a transcript with "decision ≠ discussion" enforcement.
  - `prompts/content/content-brief.md` — brief that a freelancer can execute without a kickoff call.
- Eight new eval suites with 16 new test cases (one happy-path + one failure-mode per prompt).
- README reorganized by category (sales / customer success / support / internal ops).

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
