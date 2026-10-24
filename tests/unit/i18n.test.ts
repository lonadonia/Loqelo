import { describe, expect, it } from 'vitest';
import en from '@/content/en.json';
import pl from '@/content/pl.json';
import de from '@/content/de.json';
import nl from '@/content/nl.json';
import fr from '@/content/fr.json';
import es from '@/content/es.json';

const others = { pl, de, nl, fr, es };

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
function keys(value: Json, prefix = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => keys(v, `${prefix}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
  return [prefix];
}
function get(value: Json, path: string): Json {
  return path.split(/\.|\[|\]/).filter(Boolean).reduce<Json>((v, k) => (v as Record<string, Json>)[k], value);
}

describe('translations', () => {
  const english = keys(en as Json);

  it.each(Object.entries(others))('%s has exactly the same keys as English', (_, dict) => {
    expect(keys(dict as Json).sort()).toEqual([...english].sort());
  });

  it.each(Object.entries(others))('%s keeps every {placeholder} used in English', (_, dict) => {
    for (const key of english) {
      const source = get(en as Json, key);
      if (typeof source !== 'string') continue;
      const placeholders = source.match(/\{\w+\}/g) ?? [];
      for (const placeholder of placeholders) expect(String(get(dict as Json, key)), key).toContain(placeholder);
    }
  });

  it.each(Object.entries({ en, ...others }))('%s keeps the exact tagline', (_, dict) => {
    expect(dict.hero.tagline).toBe('Everything your place needs.');
  });

  it.each(Object.entries({ en, ...others }))('%s mentions the February 2027 launch', (_, dict) => {
    expect(dict.hero.badge).toMatch(/2027/);
    expect(dict.launch.title).toMatch(/2027/);
  });
});
