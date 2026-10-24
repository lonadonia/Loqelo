import Image from 'next/image';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { Icon } from '../icon';
import type { IconName } from '../icon-paths';

const placeMeta: Record<string, { image: string; icon: IconName; position: string }> = {
  home: { image: '/photos/home.webp', icon: 'house', position: '50% 55%' },
  garden: { image: '/photos/garden.webp', icon: 'sprout', position: '50% 50%' },
  office: { image: '/photos/office.webp', icon: 'briefcase', position: '50% 30%' },
};

const categoryIcons: IconName[] = ['house', 'sprout', 'helmet', 'wrench', 'paw', 'car', 'handheart', 'boxtruck'];

export function Intro({ t }: { t: Dictionary['intro'] }) {
  return (
    <section id="what" aria-labelledby="what-title" className="py-20 sm:py-28">
      <div className="container-page">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end" data-reveal>
          <div className="lg:col-span-7">
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 id="what-title" className="mt-3 text-[clamp(2.2rem,4.6vw,3.75rem)] leading-[1.04]">
              {t.title}
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-ink-2 lg:col-span-5 lg:pb-2">{t.body}</p>
        </div>

        <ul
          tabIndex={0}
          aria-label={t.places.map((place) => place.title).join(', ')}
          className="-mx-5 mt-12 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {t.places.map((place, i) => {
            const meta = placeMeta[place.key];
            return (
              <li
                key={place.key}
                data-reveal
                style={{ ['--reveal-delay' as string]: `${i * 90}ms` }}
                className="group w-[80%] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-[28px] bg-white shadow-1 ring-1 ring-line/70 md:w-auto md:max-w-none"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={meta.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    style={{ objectPosition: meta.position }}
                  />
                </div>
                <div className="flex gap-4 p-6">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-teal text-white">
                    <Icon name={meta.icon} size={21} />
                  </span>
                  <div>
                    <h3 className="text-2xl">{place.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{place.text}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center" data-reveal>
          <p className="shrink-0 text-[14px] font-semibold text-subtle">{t.moreLabel}</p>
          <ul className="flex flex-wrap gap-2">
            {t.categories.map((category, i) => (
              <li
                key={category}
                className="inline-flex items-center gap-2 rounded-full bg-white py-2 pl-2 pr-4 text-[14px] font-semibold text-ink ring-1 ring-line"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-teal-50 text-teal">
                  <Icon name={categoryIcons[i] ?? 'check'} size={15} />
                </span>
                {category}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
