import { getDictionary } from '@/lib/i18n/dictionaries';
import { locales } from '@/lib/i18n/config';
import { NotFoundContent } from '@/components/not-found-content';

export default function NotFound() {
  const texts = Object.fromEntries(locales.map((l) => [l, getDictionary(l).notFound]));
  return <NotFoundContent texts={texts} />;
}
