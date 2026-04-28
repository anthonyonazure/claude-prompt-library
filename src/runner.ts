import Anthropic from '@anthropic-ai/sdk';
import type { PromptDefinition, RunOptions, RunResult } from './types.js';

export async function runPrompt(
  prompt: PromptDefinition,
  input: Record<string, unknown>,
  opts: RunOptions
): Promise<RunResult> {
  const client = new Anthropic({ apiKey: opts.apiKey });
  const model = opts.model ?? prompt.model ?? process.env.PROMPT_LIB_MODEL ?? 'claude-sonnet-4-6';

  const tool: Anthropic.Tool = {
    name: prompt.toolName,
    description: prompt.toolDescription,
    input_schema: prompt.inputSchema as Anthropic.Tool.InputSchema,
  };

  const start = Date.now();
  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: prompt.systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [tool],
    tool_choice: { type: 'tool', name: prompt.toolName },
    messages: [
      {
        role: 'user',
        content: JSON.stringify(input, null, 2),
      },
    ],
  });
  const latencyMs = Date.now() - start;

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === prompt.toolName
  );

  if (!toolUse) {
    throw new Error(
      `Expected tool_use block "${prompt.toolName}" not found in response for ${prompt.path}`
    );
  }

  return {
    output: toolUse.input as Record<string, unknown>,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      latencyMs,
    },
  };
}
