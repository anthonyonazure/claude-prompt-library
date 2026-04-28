import type { Expectation } from './types.js';

const UNSAFE_PATH_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function getPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (UNSAFE_PATH_KEYS.has(p)) return undefined;
    if (cur && typeof cur === 'object') {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

export function check(output: unknown, expectations: Expectation[]): string[] {
  const failures: string[] = [];
  for (const exp of expectations) {
    const value = getPath(output, exp.path);
    switch (exp.kind) {
      case 'equals':
        if (value !== exp.value) failures.push(`${exp.path} expected ${JSON.stringify(exp.value)}, got ${JSON.stringify(value)}`);
        break;
      case 'contains':
        if (typeof value !== 'string' || !value.toLowerCase().includes(exp.value.toLowerCase()))
          failures.push(`${exp.path} expected to contain "${exp.value}", got "${value}"`);
        break;
      case 'oneOf':
        if (!exp.values.includes(value as string)) failures.push(`${exp.path} expected one of ${JSON.stringify(exp.values)}, got ${JSON.stringify(value)}`);
        break;
      case 'minLength':
        if (typeof value !== 'string' || value.length < exp.value)
          failures.push(`${exp.path} expected length >= ${exp.value}, got ${typeof value === 'string' ? value.length : 'non-string'}`);
        break;
      case 'maxLength':
        if (typeof value !== 'string' || value.length > exp.value)
          failures.push(`${exp.path} expected length <= ${exp.value}, got ${typeof value === 'string' ? value.length : 'non-string'}`);
        break;
      case 'gte':
        if (typeof value !== 'number' || value < exp.value) failures.push(`${exp.path} expected >= ${exp.value}, got ${value}`);
        break;
      case 'lte':
        if (typeof value !== 'number' || value > exp.value) failures.push(`${exp.path} expected <= ${exp.value}, got ${value}`);
        break;
    }
  }
  return failures;
}
