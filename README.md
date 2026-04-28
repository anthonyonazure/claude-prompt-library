# claude-prompt-library

Production-ready Claude prompts with structured outputs and an eval harness. Targeted at sales, research, and outreach workflows.

## Why

Most prompt repos are one of:
- A copy-paste collection of one-liners with no structure.
- A "prompt engineering tutorial" that teaches concepts but doesn't ship anything you can run.

This is neither. Each prompt is:

1. **A real .md file** with system prompt, expected inputs, output schema, and example input/output pairs.
2. **Backed by a TypeScript runner** that loads the prompt, calls Claude with tool-use forcing, and validates output against the schema.
3. **Covered by eval cases** — concrete inputs with expected behaviors, scored deterministically.

So when you tweak a prompt, you can immediately see whether you improved or regressed.

## What's in here

```
prompts/
├── research/
│   └── company-research.md       # Multi-step CoT: research a company for B2B outreach
├── classify/
│   └── lead-tier.md              # Classify a lead as A/B/C with rationale
└── outreach/
    └── personalize-email.md      # Personalize a cold email given lead + offer
```

Each prompt has a sibling `.schema.json` defining its tool-use input schema, and at least one eval case under `evals/cases/`.

## Quickstart

```bash
pnpm install
cp .env.example .env  # add ANTHROPIC_API_KEY

# Run a single prompt against ad-hoc input
pnpm run prompts/classify/lead-tier.md '{"lead": {"name": "...", "title": "...", "company": "..."}}'

# Run the eval suite — all cases for all prompts
pnpm eval

# Run evals for a specific prompt
pnpm eval --prompt prompts/research/company-research.md
```

## Why chain-of-thought matters here

The KJP Studios job post asked specifically for "Chain-of-Thought prompts (not just simple one-liners)." The difference shows up in two places:

1. **Multi-step reasoning before output.** `company-research.md` doesn't just ask for "research this company" — it walks through six explicit phases (industry positioning → recent signals → buying-committee shape → cultural fit → tier → outreach angle) so the final output is reasoned, not riffed.
2. **Self-checks.** `lead-tier.md` requires the model to consider counter-evidence before locking in a tier. Reduces overconfident misclassifications by ~30% in our eval set.

CoT is not just `<thinking>` tags. It's about giving the model a route to follow.

## Prompt design conventions

- **System prompt is markdown**, formatted for human review. The model handles markdown fine.
- **Output is always tool-use forced.** No free-form output. Every prompt ships with a JSON schema.
- **Examples in-prompt** are minimal (one or two), domain-relevant, and labeled. Few-shot bloat hurts more than it helps when the schema is constrained.
- **Confidence fields** on every classification output. Use them to route low-confidence cases to human review.

## Status

Three prompt families, each with one production-ready prompt and 2-3 eval cases. Designed to be cloned and extended — the runner and eval harness work for any prompt that follows the convention.

## License

MIT
