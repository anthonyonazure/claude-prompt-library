#!/usr/bin/env node
import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { loadPrompt } from './loader.js';
import { runPrompt } from './runner.js';
import { check } from './expectations.js';
import type { EvalSuite } from './types.js';

interface CaseResult {
  prompt: string;
  case: string;
  passed: boolean;
  failures: string[];
  output: unknown;
  latencyMs: number;
}

async function loadSuites(): Promise<EvalSuite[]> {
  const casesDir = resolve(import.meta.dirname, '..', 'evals', 'cases');
  const files = await readdir(casesDir);
  const suites: EvalSuite[] = [];
  for (const file of files.filter((f) => f.endsWith('.json'))) {
    const data = JSON.parse(await readFile(resolve(casesDir, file), 'utf8')) as EvalSuite;
    suites.push(data);
  }
  return suites;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const filterArg = process.argv.indexOf('--prompt');
  const promptFilter = filterArg !== -1 ? process.argv[filterArg + 1] : null;

  const suites = await loadSuites();
  const results: CaseResult[] = [];

  for (const suite of suites) {
    if (promptFilter && !suite.prompt.includes(promptFilter)) continue;

    console.error(`\n[suite] ${suite.prompt}`);
    const prompt = await loadPrompt(suite.prompt);

    for (const c of suite.cases) {
      console.error(`  - ${c.name}...`);
      try {
        const result = await runPrompt(prompt, c.input, { apiKey });
        const failures = check(result.output, c.expectations);
        results.push({
          prompt: suite.prompt,
          case: c.name,
          passed: failures.length === 0,
          failures,
          output: result.output,
          latencyMs: result.usage.latencyMs,
        });
      } catch (err) {
        results.push({
          prompt: suite.prompt,
          case: c.name,
          passed: false,
          failures: [`runtime error: ${(err as Error).message}`],
          output: null,
          latencyMs: 0,
        });
      }
    }
  }

  console.log('\n=== Eval Results ===\n');
  for (const r of results) {
    const symbol = r.passed ? 'PASS' : 'FAIL';
    console.log(`[${symbol}] ${basename(r.prompt)} :: ${r.case} (${r.latencyMs}ms)`);
    for (const f of r.failures) {
      console.log(`         ${f}`);
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`\n${passed}/${total} cases passed`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
