# claude-prompt-library

[![CI](https://github.com/anthonyonazure/claude-prompt-library/actions/workflows/ci.yml/badge.svg)](https://github.com/anthonyonazure/claude-prompt-library/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933)](https://nodejs.org)
[![Built with Claude](https://img.shields.io/badge/built%20with-Claude-cc785c)](https://anthropic.com)

**Production-ready Claude prompts with structured outputs and a deterministic eval harness.** Ten prompts spanning the B2B revenue and ops stack — sales, customer success, support, internal ops.

> **Watch a 60-second walkthrough →** _(Loom)_

Most prompt repos are either a copy-paste collection of one-liners or a tutorial that teaches concepts but doesn't ship anything you can run. This is neither — every prompt is a real `.md` file with a JSON schema, backed by a TypeScript runner that calls Claude with tool-use forcing, and covered by eval cases that score outputs deterministically.

So when you tweak a prompt, you can immediately see whether you improved or regressed.

## What's in here

### Sales & marketing

| Prompt | Purpose | Pattern |
|--------|---------|---------|
| [`prompts/research/company-research.md`](prompts/research/company-research.md) | Pre-outreach B2B company research with tier (A/B/C) + outreach angle | 6-phase chain-of-thought |
| [`prompts/classify/lead-tier.md`](prompts/classify/lead-tier.md) | A/B/C lead classification with mandatory counter-evidence | Self-check / cynical review |
| [`prompts/outreach/personalize-email.md`](prompts/outreach/personalize-email.md) | Personalized cold email — no template smell | Anti-template guards |
| [`prompts/sales/objection-handler.md`](prompts/sales/objection-handler.md) | Real-time objection classification + 2-3 scripted responses | Type-aware response strategy |
| [`prompts/sales/proposal-generator.md`](prompts/sales/proposal-generator.md) | Structured B2B proposal — willing to **disqualify** when off-the-shelf fits | Scope-honest, anti-puffery |
| [`prompts/sales/demo-follow-up.md`](prompts/sales/demo-follow-up.md) | 24-hour post-demo email + internal CRM notes + risk flags | Forecastable-by-evidence guard |

### Customer success & support

| Prompt | Purpose | Pattern |
|--------|---------|---------|
| [`prompts/customer-success/health-score.md`](prompts/customer-success/health-score.md) | Customer health across 4 dimensions (min, not avg) + recommended action | "Health = weakest dimension" |
| [`prompts/support/ticket-triage.md`](prompts/support/ticket-triage.md) | Severity / category / sentiment / route + first-draft response | Prompt-injection-aware triage |

### Internal ops & content

| Prompt | Purpose | Pattern |
|--------|---------|---------|
| [`prompts/summarize/meeting-summary.md`](prompts/summarize/meeting-summary.md) | Decisions / action items / open questions from transcript | Decision ≠ discussion guard |
| [`prompts/content/content-brief.md`](prompts/content/content-brief.md) | Content brief that a freelancer can execute without a kickoff call | Sharp angle + out-of-scope |

Every prompt has a sibling `.schema.json` defining its tool-use input schema, plus eval cases under `evals/cases/` covering at least the happy path and a known failure mode (often a prompt-injection or "should disqualify" case to verify the prompt's defensive guards).

## Sample output

Run `company-research.md` on a real RIA prospect:

```json
{
  "industry": {
    "sector": "Registered Investment Advisory (RIA) / Wealth Management",
    "valueProp": "Boutique mid-market RIA specializing in outdoor industry founders — a niche HNW/UHNW client base with concentrated equity and liquidity-event complexity",
    "competitors": ["Cetera", "Focus Financial Partners", "Mariner Wealth Advisors", "Savant Wealth Management"],
    "inferred": false
  },
  "recentSignals": [
    {
      "signal": "Hired first dedicated compliance lead in October",
      "implication": "Firm is formalizing compliance infrastructure for the first time — classic trigger for workflow tooling purchases; new compliance hire will immediately feel the pain of manual processes and will want to own a tool decision early."
    }
  ],
  "tier": "A",
  "outreachAngle": "Trailhead just brought on its first compliance lead the same month you announced two new office locations — that's a tough combination to land in on day one. We work with several single-compliance-officer RIAs that went multi-office and built their SEC exam readiness workflows in our platform before their first cross-office review. Worth a 20-minute conversation before the Q1 audit prep cycle kicks off?",
  "confidence": 0.82
}
```

Full sample outputs: [`docs/assets/`](docs/assets/)

Eval suite output:

```
$ pnpm eval

[PASS] company-research.md :: clear A — known company, real signal, fit angle (16684ms)
[PASS] company-research.md :: no signal — should not invent one (6002ms)
[PASS] lead-tier.md :: clear A — VP Eng at fit company with hiring signal (4100ms)
[PASS] lead-tier.md :: clear C — wrong title, wrong industry, no signal (3912ms)
[PASS] lead-tier.md :: ambiguous B — title is senior but company is tiny (3270ms)
[PASS] personalize-email.md :: specific reference present — must be used (7406ms)
[PASS] personalize-email.md :: no specific reference available — must admit it (12964ms)

7/7 cases passed
```

## Quickstart

```bash
pnpm install
cp .env.example .env  # add ANTHROPIC_API_KEY

# Run a single prompt against ad-hoc input
pnpm run prompts/classify/lead-tier.md '{"lead": {"name": "...", "title": "...", "company": "..."}}'

# Run the full eval suite
pnpm eval

# Run evals for one prompt
pnpm eval --prompt company-research
```

## Why chain-of-thought matters

The difference between "prompt that produces output" and "prompt you can ship to production" usually shows up in two places:

1. **Multi-step reasoning before output.** `company-research.md` doesn't just say "research this company" — it walks through six explicit phases (industry positioning → recent signals → buying-committee shape → cultural fit → tier → outreach angle) so the final output is reasoned, not riffed.
2. **Self-checks.** `lead-tier.md` requires the model to consider counter-evidence before locking in a tier. The schema mandates a `counterEvidence` array — saying "none considered" is allowed but forces the model to look.

CoT isn't just `<thinking>` tags. It's about giving the model a route to follow.

## Prompt design conventions

- **System prompt is markdown** with YAML frontmatter (`tool_name`, `tool_description`, optional `model`).
- **Output is always tool-use forced.** No free-form output. Every prompt ships with a JSON schema in a sibling `.schema.json`.
- **Examples in-prompt are minimal** — one or two, domain-relevant, labeled. Few-shot bloat hurts more than it helps when the schema is constrained.
- **Confidence fields** on every classification output. Use them to route low-confidence cases to human review.
- **Anti-template rules** for outreach prompts — explicit forbidden phrases, "if you can't do X, admit it instead of inventing" guards.

## How the runner works

Any prompt that follows the convention (markdown + sibling JSON schema + YAML frontmatter) works with the generic runner — no per-prompt code. The eval harness scores outputs against path-based expectations (`equals`, `contains`, `oneOf`, `minLength`, `gte`, `lte`) so you can verify behavior without brittle exact-match comparisons.

Add a new prompt:

```bash
mkdir -p prompts/your-category
# Write prompts/your-category/your-prompt.md (with YAML frontmatter)
# Write prompts/your-category/your-prompt.schema.json
# Write evals/cases/your-prompt.json
pnpm eval --prompt your-prompt
```

## Security

Small attack surface (developer CLI, no network server), but the obvious sharp edges are filed:

- **Path traversal in expectation walks** — `getPath()` in `src/expectations.ts` refuses to traverse `__proto__`, `constructor`, or `prototype`. Eval suites are author-controlled, but if you ever import third-party suites this matters.
- **CLI input** — `JSON.parse` on user input is wrapped in try/catch with a clean error message instead of stack-trace info disclosure.
- **Secret hygiene** — `.env` is gitignored, `.env.example` uses placeholder, no `console.log` of `process.env.ANTHROPIC_API_KEY` anywhere.

## Tests

25 unit tests cover the prompt loader (frontmatter parsing, schema discovery, error cases), the eval expectation matcher including prototype-pollution refusals, and a structural check that every shipped prompt has a valid sibling schema and required frontmatter. Runs in CI on every push and pull request.

```bash
pnpm test         # unit tests, no API spend
pnpm test:watch   # watch mode
pnpm typecheck    # tsc --noEmit
pnpm eval         # full eval suite — calls Anthropic API
```

CI runs typecheck + unit tests on every push. The full eval (`pnpm eval`) hits the live API and must be run manually.

## License

MIT
