# Recording the demo Loom

Target: 60-second screencast embedded in the README near the top.

This repo doesn't have a hosted UI (it's a CLI tool), so the Loom is a terminal walkthrough.

## Setup

1. Have `.env` set with a valid `ANTHROPIC_API_KEY`.
2. Open a clean terminal at 1280×720 minimum, large readable font.
3. Have one prompt picked: `prompts/research/company-research.md` reads best on camera.
4. Have the GitHub repo open in a second tab.

## Script

**[0-10s] What.** Show the repo on GitHub.

> "This is a Claude prompt library. Three production-ready prompts for B2B sales workflows — research, classification, outreach — each with a sibling JSON schema, structured-output enforcement, and an eval harness."

**[10-30s] Run a prompt.** Tab to terminal. Paste a `pnpm run` command and execute it.

> "I'll run the company research prompt against a real-shaped input. Six-phase chain-of-thought — industry positioning, recent signals, buying-committee shape, cultural fit, tier, outreach angle. Output is forced through a JSON schema, so I always get back the same structure."

**[30-50s] Show the output.** As the JSON renders, narrate the key fields.

> "Tier A. Confidence 0.82. The outreach angle isn't generic — it cites the specific events I gave it: the October compliance hire, the open ops roles. Falsifiable, specific, ready for a human to send."

**[50-60s] Show the eval suite.** Run `pnpm eval` or show the captured eval-output.txt.

> "Seven cases pass against real Claude API runs. When I tweak a prompt, I can measure whether I improved or regressed. That's the difference between a prompt repo and a tested prompt library."

## After recording

1. Trim silence; speed up any waiting (LLM calls take 5-10s).
2. Thumbnail: a clear shot of the structured JSON output.
3. Replace the `Watch a 60-second walkthrough →` placeholder in README with the Loom URL.
