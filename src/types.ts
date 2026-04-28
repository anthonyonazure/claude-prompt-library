export interface PromptDefinition {
  path: string;
  systemPrompt: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  model?: string;
}

export interface RunOptions {
  apiKey: string;
  model?: string;
}

export interface RunResult {
  output: Record<string, unknown>;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    latencyMs: number;
  };
}

export interface EvalCase {
  name: string;
  input: Record<string, unknown>;
  expectations: Expectation[];
}

export type Expectation =
  | { kind: 'equals'; path: string; value: unknown }
  | { kind: 'contains'; path: string; value: string }
  | { kind: 'oneOf'; path: string; values: unknown[] }
  | { kind: 'minLength'; path: string; value: number }
  | { kind: 'maxLength'; path: string; value: number }
  | { kind: 'gte'; path: string; value: number }
  | { kind: 'lte'; path: string; value: number };

export interface EvalSuite {
  prompt: string;
  cases: EvalCase[];
}
