import { readFile } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import type { PromptDefinition } from './types.js';

const FRONT_MATTER = /^---\n([\s\S]+?)\n---\n([\s\S]+)$/;

export async function loadPrompt(promptPath: string): Promise<PromptDefinition> {
  const absPath = resolve(promptPath);
  const raw = await readFile(absPath, 'utf8');

  const match = FRONT_MATTER.exec(raw);
  if (!match) {
    throw new Error(`Prompt ${promptPath} missing YAML frontmatter (--- ... ---)`);
  }

  const [, yamlBlock, body] = match;
  const meta = parseSimpleYaml(yamlBlock);
  const toolName = meta.tool_name as string | undefined;
  if (!toolName) {
    throw new Error(`Prompt ${promptPath} missing tool_name in frontmatter`);
  }

  const schemaPath = resolve(dirname(absPath), basename(absPath, '.md') + '.schema.json');
  const schemaRaw = await readFile(schemaPath, 'utf8');
  const inputSchema = JSON.parse(schemaRaw);

  return {
    path: promptPath,
    systemPrompt: body.trim(),
    toolName,
    toolDescription: (meta.tool_description as string) ?? `Record output for ${toolName}`,
    inputSchema,
    model: meta.model as string | undefined,
  };
}

function parseSimpleYaml(input: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const line of input.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colon = trimmed.indexOf(':');
    if (colon === -1) continue;
    const key = trimmed.slice(0, colon).trim();
    const value = trimmed.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
    out[key] = value;
  }
  return out;
}
