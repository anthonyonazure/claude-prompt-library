import { describe, it, expect } from 'vitest';
import type { Expectation } from './types.js';

function getPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object') {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

function check(output: unknown, expectations: Expectation[]): string[] {
  const failures: string[] = [];
  for (const exp of expectations) {
    const value = getPath(output, exp.path);
    switch (exp.kind) {
      case 'equals':
        if (value !== exp.value) failures.push(`${exp.path} not equal`);
        break;
      case 'contains':
        if (typeof value !== 'string' || !value.toLowerCase().includes(exp.value.toLowerCase()))
          failures.push(`${exp.path} not contains`);
        break;
      case 'oneOf':
        if (!exp.values.includes(value as string)) failures.push(`${exp.path} not oneOf`);
        break;
      case 'minLength':
        if (typeof value !== 'string' || value.length < exp.value) failures.push(`${exp.path} below minLength`);
        break;
      case 'maxLength':
        if (typeof value !== 'string' || value.length > exp.value) failures.push(`${exp.path} above maxLength`);
        break;
      case 'gte':
        if (typeof value !== 'number' || value < exp.value) failures.push(`${exp.path} below gte`);
        break;
      case 'lte':
        if (typeof value !== 'number' || value > exp.value) failures.push(`${exp.path} above lte`);
        break;
    }
  }
  return failures;
}

describe('check expectations', () => {
  const sample = {
    tier: 'A',
    confidence: 0.85,
    reasoning: { count: 4 },
    text: 'Hello world',
  };

  it('equals passes when matching', () => {
    expect(check(sample, [{ kind: 'equals', path: 'tier', value: 'A' }])).toHaveLength(0);
  });

  it('equals fails on mismatch', () => {
    expect(check(sample, [{ kind: 'equals', path: 'tier', value: 'B' }])).toHaveLength(1);
  });

  it('contains is case-insensitive', () => {
    expect(check(sample, [{ kind: 'contains', path: 'text', value: 'WORLD' }])).toHaveLength(0);
  });

  it('contains fails when substring missing', () => {
    expect(check(sample, [{ kind: 'contains', path: 'text', value: 'foo' }])).toHaveLength(1);
  });

  it('oneOf passes when value in set', () => {
    expect(check(sample, [{ kind: 'oneOf', path: 'tier', values: ['A', 'B'] }])).toHaveLength(0);
  });

  it('oneOf fails when value not in set', () => {
    expect(check(sample, [{ kind: 'oneOf', path: 'tier', values: ['B', 'C'] }])).toHaveLength(1);
  });

  it('minLength passes when string long enough', () => {
    expect(check(sample, [{ kind: 'minLength', path: 'text', value: 5 }])).toHaveLength(0);
  });

  it('minLength fails on short string', () => {
    expect(check(sample, [{ kind: 'minLength', path: 'text', value: 100 }])).toHaveLength(1);
  });

  it('gte passes for sufficient number', () => {
    expect(check(sample, [{ kind: 'gte', path: 'confidence', value: 0.8 }])).toHaveLength(0);
  });

  it('gte fails for low number', () => {
    expect(check(sample, [{ kind: 'gte', path: 'confidence', value: 0.9 }])).toHaveLength(1);
  });

  it('lte passes for sufficient', () => {
    expect(check(sample, [{ kind: 'lte', path: 'confidence', value: 0.9 }])).toHaveLength(0);
  });

  it('nested path resolution works', () => {
    expect(check(sample, [{ kind: 'gte', path: 'reasoning.count', value: 3 }])).toHaveLength(0);
  });

  it('missing path produces failure', () => {
    expect(check(sample, [{ kind: 'equals', path: 'missing.field', value: 'x' }])).toHaveLength(1);
  });

  it('multiple expectations accumulate failures', () => {
    const failures = check(sample, [
      { kind: 'equals', path: 'tier', value: 'B' },
      { kind: 'gte', path: 'confidence', value: 0.99 },
    ]);
    expect(failures).toHaveLength(2);
  });
});
