import 'server-only';
import en from '@/content/en.json';
import pl from '@/content/pl.json';
import de from '@/content/de.json';
import nl from '@/content/nl.json';
import fr from '@/content/fr.json';
import es from '@/content/es.json';
import type { Locale } from './config';

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, pl, de, nl, fr, es };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** The short "also available in …" prompt in every language, for the suggestion bar. */
export function languageSuggestions(): Record<Locale, Dictionary['langSuggest']> {
  return Object.fromEntries(Object.entries(dictionaries).map(([k, d]) => [k, d.langSuggest])) as Record<
    Locale,
    Dictionary['langSuggest']
  >;
}
