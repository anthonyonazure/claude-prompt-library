import { describe, it, expect } from 'vitest';
import { check } from './expectations.js';

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

  it('refuses to traverse __proto__ in path', () => {
    expect(check(sample, [{ kind: 'equals', path: '__proto__.toString', value: 'foo' }])).toHaveLength(1);
  });

  it('refuses to traverse constructor in path', () => {
    expect(check(sample, [{ kind: 'equals', path: 'constructor.name', value: 'Object' }])).toHaveLength(1);
  });

  it('refuses to traverse prototype in path', () => {
    expect(check(sample, [{ kind: 'equals', path: 'prototype.x', value: 'y' }])).toHaveLength(1);
  });
});
