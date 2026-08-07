import { describe, it, expect } from 'vitest';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadPrompt } from './loader.js';

async function withFixture(
  promptBody: string,
  schema: object | null,
  fn: (path: string) => Promise<void>
) {
  const dir = await mkdtemp(join(tmpdir(), 'cpl-'));
  try {
    const promptPath = join(dir, 'test.md');
    await writeFile(promptPath, promptBody);
    if (schema) {
      const schemaPath = join(dir, 'test.schema.json');
      await writeFile(schemaPath, JSON.stringify(schema));
    }
    await fn(promptPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe('loadPrompt', () => {
  it('parses YAML frontmatter and loads sibling schema', async () => {
    const body = `---
tool_name: my_tool
tool_description: A test tool
model: claude-haiku-4-5-20251001
---

This is the system prompt body.`;
    const schema = { type: 'object', properties: { x: { type: 'string' } } };

    await withFixture(body, schema, async (path) => {
      const prompt = await loadPrompt(path);
      expect(prompt.toolName).toBe('my_tool');
      expect(prompt.toolDescription).toBe('A test tool');
      expect(prompt.model).toBe('claude-haiku-4-5-20251001');
      expect(prompt.systemPrompt).toBe('This is the system prompt body.');
      expect(prompt.inputSchema).toEqual(schema);
    });
  });

  it('throws when frontmatter is missing', async () => {
    await withFixture('No frontmatter here.', { type: 'object' }, async (path) => {
      await expect(loadPrompt(path)).rejects.toThrow(/frontmatter/);
    });
  });

  it('throws when tool_name is missing', async () => {
    const body = `---
tool_description: Missing tool_name
---

Body.`;
    await withFixture(body, { type: 'object' }, async (path) => {
      await expect(loadPrompt(path)).rejects.toThrow(/tool_name/);
    });
  });

  it('strips quotes from frontmatter values', async () => {
    const body = `---
tool_name: "quoted_tool"
tool_description: 'single-quoted'
---

Body.`;
    await withFixture(body, { type: 'object' }, async (path) => {
      const prompt = await loadPrompt(path);
      expect(prompt.toolName).toBe('quoted_tool');
      expect(prompt.toolDescription).toBe('single-quoted');
    });
  });

  it('throws when sibling schema is missing', async () => {
    const body = `---
tool_name: t
---

Body.`;
    await withFixture(body, null, async (path) => {
      await expect(loadPrompt(path)).rejects.toThrow();
    });
  });

  // The frontmatter parser is hand-rolled, so the cases that separate it from
  // "split on the first colon" are the ones worth pinning.
  it('skips comment lines and blank lines in frontmatter', async () => {
    const body = `---
# this is a comment, not a key
tool_name: commented_tool

# another comment
---

Body.`;
    await withFixture(body, { type: 'object' }, async (path) => {
      const prompt = await loadPrompt(path);
      expect(prompt.toolName).toBe('commented_tool');
      expect(prompt.inputSchema).toEqual({ type: 'object' });
    });
  });

  it('ignores a frontmatter line with no colon', async () => {
    const body = `---
this line has no colon
tool_name: still_found
---

Body.`;
    await withFixture(body, { type: 'object' }, async (path) => {
      const prompt = await loadPrompt(path);
      expect(prompt.toolName).toBe('still_found');
    });
  });

  it('trims whitespace around both key and value', async () => {
    const body = `---
   tool_name   :    spaced_tool
---

Body.`;
    await withFixture(body, { type: 'object' }, async (path) => {
      const prompt = await loadPrompt(path);
      expect(prompt.toolName).toBe('spaced_tool');
    });
  });

  it('keeps a value that only starts with a quote intact apart from that quote', async () => {
    const body = `---
tool_name: t
tool_description: "unbalanced
---

Body.`;
    await withFixture(body, { type: 'object' }, async (path) => {
      const prompt = await loadPrompt(path);
      expect(prompt.toolDescription).toBe('unbalanced');
    });
  });

  it('leaves quotes that are not at the ends alone', async () => {
    const body = `---
tool_name: t
tool_description: say "hello" loudly
---

Body.`;
    await withFixture(body, { type: 'object' }, async (path) => {
      const prompt = await loadPrompt(path);
      expect(prompt.toolDescription).toBe('say "hello" loudly');
    });
  });

  it('keeps everything after the first colon, colons included', async () => {
    const body = `---
tool_name: t
tool_description: before: after
---

Body.`;
    await withFixture(body, { type: 'object' }, async (path) => {
      const prompt = await loadPrompt(path);
      expect(prompt.toolDescription).toBe('before: after');
    });
  });

  it('falls back to a generated tool description when none is given', async () => {
    const body = `---
tool_name: undescribed_tool
---

Body.`;
    await withFixture(body, { type: 'object' }, async (path) => {
      const prompt = await loadPrompt(path);
      expect(prompt.toolDescription).toBe('Record output for undescribed_tool');
      expect(prompt.model).toBeUndefined();
    });
  });

  it('trims surrounding whitespace off the prompt body', async () => {
    const body = `---
tool_name: t
---


   Padded body.
`;
    await withFixture(body, { type: 'object' }, async (path) => {
      const prompt = await loadPrompt(path);
      expect(prompt.systemPrompt).toBe('Padded body.');
    });
  });

  it('reports the path it was given, not the resolved absolute path', async () => {
    const body = `---
tool_name: t
---

Body.`;
    await withFixture(body, { type: 'object' }, async (path) => {
      const prompt = await loadPrompt(path);
      expect(prompt.path).toBe(path);
    });
  });
});
