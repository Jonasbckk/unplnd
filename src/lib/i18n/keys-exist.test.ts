import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { de } from './de';

/**
 * Every i18n key written in the app must resolve to a real string.
 *
 * The parity test only compares de against en, so a key written into the WRONG block sails through
 * it as long as both languages are wrong the same way — which is exactly how `route.swapNoOptions`
 * shipped as raw text (it had landed in `onboarding.pages.route`). This test asks the other
 * question: does the key the code actually uses exist?
 *
 * It does NOT look for `tr(...)` call shapes — the first attempt did, and missed the very bug that
 * prompted it, because the broken call was `tr(cond ? 'a' : 'b')`. Instead it takes every dotted
 * string literal whose first segment is a real top-level i18n block (route, planner, map, …) and
 * demands it resolve. Anything shaped like a key is treated as one.
 */

const SRC = join(__dirname, '..', '..');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

function resolve(path: string): unknown {
  return path.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      return (node as Record<string, unknown>)[part];
    }
    return undefined;
  }, de);
}

/** Single- or double-quoted dotted literals: 'route.swapNoOptions', "common.close". */
const DOTTED_LITERAL = /['"]([a-z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+)['"]/g;

const TOP_LEVEL = new Set(Object.keys(de));

describe('i18n keys used in code exist', () => {
  const files = walk(SRC);

  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('every dotted literal starting with an i18n block resolves to a string', () => {
    const missing: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(DOTTED_LITERAL)) {
        const key = match[1];
        // Only literals rooted in a real i18n block are keys; everything else is just a string.
        if (!TOP_LEVEL.has(key.split('.')[0])) continue;
        const value = resolve(key);
        if (typeof value !== 'string' && !Array.isArray(value)) {
          missing.push(`${key}  (${file.replace(SRC, '').replace(/\\/g, '/')})`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
