#!/usr/bin/env node
import 'dotenv/config';
import { loadPrompt } from './loader.js';
import { runPrompt } from './runner.js';

async function main() {
  const promptPath = process.argv[2];
  const inputJson = process.argv[3];

  if (!promptPath || !inputJson) {
    console.error('Usage: pnpm run <prompt-path> \'<json-input>\'');
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const prompt = await loadPrompt(promptPath);
  let input: unknown;
  try {
    input = JSON.parse(inputJson);
  } catch (err) {
    console.error(`Invalid JSON input: ${(err as Error).message}`);
    process.exit(1);
  }
  const result = await runPrompt(prompt, input as Record<string, unknown>, { apiKey });

  console.log(JSON.stringify(result.output, null, 2));
  console.error(
    `\n[usage] ${result.usage.inputTokens} in · ${result.usage.outputTokens} out · ${result.usage.latencyMs}ms`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
