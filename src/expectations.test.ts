// The existing eval.test.ts asserts only how MANY failures came back. That
// leaves the two things an eval harness is actually judged on untested: whether
// a boundary value passes or fails, and whether the failure message tells you
// what went wrong. Both are pinned here.

import { describe, it, expect } from 'vitest';
import { check, getPath } from './expectations.js';

describe('getPath', () => {
  const obj = { a: { b: { c: 1 } }, s: 'text', n: 0, nil: null };

  it('walks a nested path', () => {
    expect(getPath(obj, 'a.b.c')).toBe(1);
  });

  it('returns the root when the path is a single key', () => {
    expect(getPath(obj, 's')).toBe('text');
  });

  it('returns undefined for a missing key', () => {
    expect(getPath(obj, 'a.missing')).toBeUndefined();
  });

  it('stops rather than indexing into a primitive', () => {
    // 's' is a string; without the object guard this would read String.length.
    expect(getPath(obj, 's.length')).toBeUndefined();
  });

  it('stops on a null segment instead of throwing', () => {
    expect(getPath(obj, 'nil.anything')).toBeUndefined();
  });

  it('treats a falsy-but-present value as a value, not a miss', () => {
    expect(getPath(obj, 'n')).toBe(0);
  });

  it('refuses __proto__ even when the rest of the path would resolve', () => {
    expect(getPath(obj, '__proto__')).toBeUndefined();
    expect(getPath(obj, '__proto__.toString')).toBeUndefined();
  });

  it('refuses constructor', () => {
    expect(getPath(obj, 'constructor')).toBeUndefined();
    expect(getPath(obj, 'constructor.name')).toBeUndefined();
  });

  it('refuses prototype', () => {
    expect(getPath(obj, 'prototype')).toBeUndefined();
  });

  it('refuses an unsafe key anywhere in the path, not just at the root', () => {
    expect(getPath(obj, 'a.__proto__.polluted')).toBeUndefined();
  });

  it('returns the object itself for an empty-ish path only when that key exists', () => {
    expect(getPath({ '': 'blank' }, '')).toBe('blank');
  });
});

describe('check — boundaries', () => {
  it('minLength passes at exactly the boundary', () => {
    expect(check({ t: 'abcde' }, [{ kind: 'minLength', path: 't', value: 5 }])).toEqual([]);
  });

  it('minLength fails one below the boundary', () => {
    expect(check({ t: 'abcd' }, [{ kind: 'minLength', path: 't', value: 5 }])).toHaveLength(1);
  });

  it('maxLength passes at exactly the boundary', () => {
    expect(check({ t: 'abcde' }, [{ kind: 'maxLength', path: 't', value: 5 }])).toEqual([]);
  });

  it('maxLength fails one above the boundary', () => {
    expect(check({ t: 'abcdef' }, [{ kind: 'maxLength', path: 't', value: 5 }])).toHaveLength(1);
  });

  it('gte passes at exactly the boundary', () => {
    expect(check({ n: 5 }, [{ kind: 'gte', path: 'n', value: 5 }])).toEqual([]);
  });

  it('gte fails just below the boundary', () => {
    expect(check({ n: 4.999 }, [{ kind: 'gte', path: 'n', value: 5 }])).toHaveLength(1);
  });

  it('lte passes at exactly the boundary', () => {
    expect(check({ n: 5 }, [{ kind: 'lte', path: 'n', value: 5 }])).toEqual([]);
  });

  it('lte fails just above the boundary', () => {
    expect(check({ n: 5.001 }, [{ kind: 'lte', path: 'n', value: 5 }])).toHaveLength(1);
  });

  it('equals distinguishes types rather than coercing', () => {
    expect(check({ n: 1 }, [{ kind: 'equals', path: 'n', value: '1' }])).toHaveLength(1);
  });

  it('oneOf compares by identity, so a matching value passes', () => {
    expect(check({ t: 'B' }, [{ kind: 'oneOf', path: 't', values: ['A', 'B'] }])).toEqual([]);
  });

  it('oneOf does not coerce', () => {
    expect(check({ n: 1 }, [{ kind: 'oneOf', path: 'n', values: ['1'] }])).toHaveLength(1);
  });

  it('contains matches a differently-cased needle in a differently-cased haystack', () => {
    expect(check({ t: 'HeLLo' }, [{ kind: 'contains', path: 't', value: 'hEllO' }])).toEqual([]);
  });

  it('returns no failures for an empty expectation list', () => {
    expect(check({ t: 'x' }, [])).toEqual([]);
  });
});

describe('check — non-matching types are failures, not crashes', () => {
  it('minLength on a number fails', () => {
    expect(check({ n: 12345 }, [{ kind: 'minLength', path: 'n', value: 3 }])).toHaveLength(1);
  });

  it('maxLength on a number fails', () => {
    expect(check({ n: 1 }, [{ kind: 'maxLength', path: 'n', value: 100 }])).toHaveLength(1);
  });

  it('contains on a number fails', () => {
    expect(check({ n: 123 }, [{ kind: 'contains', path: 'n', value: '2' }])).toHaveLength(1);
  });

  it('gte on a string fails', () => {
    expect(check({ t: '10' }, [{ kind: 'gte', path: 't', value: 5 }])).toHaveLength(1);
  });

  it('lte on a string fails', () => {
    expect(check({ t: '1' }, [{ kind: 'lte', path: 't', value: 5 }])).toHaveLength(1);
  });
});

describe('check — failure messages name the path, the expectation and the actual value', () => {
  it('equals', () => {
    expect(check({ tier: 'A' }, [{ kind: 'equals', path: 'tier', value: 'B' }])).toEqual([
      'tier expected "B", got "A"',
    ]);
  });

  it('contains', () => {
    expect(check({ t: 'hello' }, [{ kind: 'contains', path: 't', value: 'zzz' }])).toEqual([
      't expected to contain "zzz", got "hello"',
    ]);
  });

  it('oneOf', () => {
    expect(check({ tier: 'C' }, [{ kind: 'oneOf', path: 'tier', values: ['A', 'B'] }])).toEqual([
      'tier expected one of ["A","B"], got "C"',
    ]);
  });

  it('minLength on a short string reports the actual length', () => {
    expect(check({ t: 'ab' }, [{ kind: 'minLength', path: 't', value: 5 }])).toEqual([
      't expected length >= 5, got 2',
    ]);
  });

  it('minLength on a non-string says so instead of reporting a length', () => {
    expect(check({ n: 7 }, [{ kind: 'minLength', path: 'n', value: 5 }])).toEqual([
      'n expected length >= 5, got non-string',
    ]);
  });

  it('maxLength on a long string reports the actual length', () => {
    expect(check({ t: 'abcdef' }, [{ kind: 'maxLength', path: 't', value: 5 }])).toEqual([
      't expected length <= 5, got 6',
    ]);
  });

  it('maxLength on a non-string says so instead of reporting a length', () => {
    expect(check({ n: 7 }, [{ kind: 'maxLength', path: 'n', value: 5 }])).toEqual([
      'n expected length <= 5, got non-string',
    ]);
  });

  it('gte', () => {
    expect(check({ n: 1 }, [{ kind: 'gte', path: 'n', value: 5 }])).toEqual([
      'n expected >= 5, got 1',
    ]);
  });

  it('lte', () => {
    expect(check({ n: 9 }, [{ kind: 'lte', path: 'n', value: 5 }])).toEqual([
      'n expected <= 5, got 9',
    ]);
  });

  it('reports a missing path as undefined rather than pretending it matched', () => {
    expect(check({}, [{ kind: 'equals', path: 'nope', value: 'x' }])).toEqual([
      'nope expected "x", got undefined',
    ]);
  });

  it('accumulates failures in expectation order', () => {
    expect(
      check({ tier: 'A', n: 1 }, [
        { kind: 'equals', path: 'tier', value: 'B' },
        { kind: 'gte', path: 'n', value: 5 },
      ])
    ).toEqual(['tier expected "B", got "A"', 'n expected >= 5, got 1']);
  });
});
