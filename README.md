# claude-prompt-library

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933)](https://nodejs.org)
[![Built with Claude](https://img.shields.io/badge/built%20with-Claude-cc785c)](https://anthropic.com)

**Production-ready Claude prompts with structured outputs and a deterministic eval harness.** Targeted at sales, research, and outreach workflows.

Most prompt repos are either a copy-paste collection of one-liners or a tutorial that teaches concepts but doesn't ship anything you can run. This is neither — every prompt is a real `.md` file with a JSON schema, backed by a TypeScript runner that calls Claude with tool-use forcing, and covered by eval cases that score outputs deterministically.

So when you tweak a prompt, you can immediately see whether you improved or regressed.

## What's in here

| Prompt | Purpose | Pattern |
|--------|---------|---------|
| [`prompts/research/company-research.md`](prompts/research/company-research.md) | Pre-outreach B2B company research with tier (A/B/C) + outreach angle | 6-phase chain-of-thought |
| [`prompts/classify/lead-tier.md`](prompts/classify/lead-tier.md) | A/B/C lead classification with mandatory counter-evidence | Self-check / cynical review |
| [`prompts/outreach/personalize-email.md`](prompts/outreach/personalize-email.md) | Personalized cold email — no template smell | Anti-template guards |

Each prompt has a sibling `.schema.json` defining its tool-use input schema, and at least two eval cases under `evals/cases/` covering the happy path and a known failure mode.

## Sample output

Run `company-research.md` on a real RIA prospect:

```json
{
  "industry": {
    "sector": "Wealth management / SEC-registered investment advisor (RIA)",
    "valueProp": "Fiduciary financial planning specialized for outdoor-industry founders",
    "competitors": ["Mariner Wealth Advisors", "Mercer Advisors", "boutique sector-focused RIAs"],
    "inferred": false
  },
  "recentSignals": [
    {
      "signal": "Hired their first compliance lead in October",
      "implication": "Building out compliance infrastructure suggests AUM growth and regulatory maturity — typical trigger for compliance workflow tooling."
    }
  ],
  "tier": "A",
  "outreachAngle": "Reference the October compliance hire and the open ops roles together: 'Most RIAs we work with bring on a compliance lead and discover their workflow tooling can't keep up with the new oversight cadence...'",
  "confidence": 0.78
}
```

Full sample outputs: [`docs/assets/`](docs/assets/)

Eval suite output:

```
$ pnpm eval

[PASS] lead-tier.md :: clear A — VP Eng at fit company with hiring signal (1842ms)
[PASS] lead-tier.md :: clear C — wrong title, wrong industry, no signal (1601ms)
[PASS] lead-tier.md :: ambiguous B — title is senior but company is tiny (2104ms)
[PASS] personalize-email.md :: specific reference present — must be used (3217ms)
[PASS] personalize-email.md :: no specific reference available — must admit it (2455ms)
[PASS] company-research.md :: clear A — known company, real signal, fit angle (4108ms)
[PASS] company-research.md :: no signal — should not invent one (2890ms)

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

## License

MIT
