import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = resolve(__dirname, '..', 'prompts');

async function* findPromptFiles(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      yield* findPromptFiles(full);
    } else if (entry.name.endsWith('.md')) {
      yield full;
    }
  }
}

describe('shipped prompts', () => {
  it('every prompt has a sibling .schema.json', async () => {
    for await (const promptPath of findPromptFiles(PROMPTS_DIR)) {
      const schemaPath = resolve(dirname(promptPath), basename(promptPath, '.md') + '.schema.json');
      try {
        await readFile(schemaPath, 'utf8');
      } catch {
        throw new Error(`Missing schema for ${promptPath}`);
      }
    }
  });

  it('every schema is valid JSON with type=object', async () => {
    for await (const promptPath of findPromptFiles(PROMPTS_DIR)) {
      const schemaPath = resolve(dirname(promptPath), basename(promptPath, '.md') + '.schema.json');
      const raw = await readFile(schemaPath, 'utf8');
      const parsed = JSON.parse(raw);
      expect(parsed.type, `${schemaPath}`).toBe('object');
      expect(parsed.properties, `${schemaPath}`).toBeTruthy();
    }
  });

  it('every prompt has YAML frontmatter with tool_name', async () => {
    for await (const promptPath of findPromptFiles(PROMPTS_DIR)) {
      const raw = await readFile(promptPath, 'utf8');
      expect(raw, `${promptPath}`).toMatch(/^---\n[\s\S]+?\n---\n/);
      expect(raw, `${promptPath}`).toMatch(/tool_name:\s*\S+/);
    }
  });
});
