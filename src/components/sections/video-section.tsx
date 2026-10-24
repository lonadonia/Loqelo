import type { Dictionary } from '@/lib/i18n/dictionaries';
import { VideoPlayer } from '../video-player';

export function VideoSection({ t }: { t: Dictionary['video'] }) {
  return (
    <section id="video" aria-labelledby="video-title" className="on-dark relative overflow-hidden bg-deep py-20 text-white sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(7,126,136,0.45),transparent)]" />
      </div>
      <div className="container-page relative">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <p className="eyebrow !text-mint">{t.eyebrow}</p>
          <h2 id="video-title" className="mt-3 text-[clamp(2.2rem,4.6vw,3.75rem)] leading-[1.04]">
            {t.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">{t.text}</p>
        </div>
        <div className="mx-auto mt-12 max-w-[1160px]" data-reveal>
          <VideoPlayer playLabel={t.play} videoLabel={t.label} duration={t.duration} unmuteLabel={t.unmute} />
        </div>
      </div>
    </section>
  );
}
