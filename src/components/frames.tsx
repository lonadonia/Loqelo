import Image from 'next/image';

type FrameProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  className?: string;
  priority?: boolean;
  dark?: boolean;
  /** Show the top of the screen in a fixed 16:10 window so grid items line up. */
  fixedAspect?: boolean;
};

/** Desktop screenshot in a minimal browser window. */
export function BrowserFrame({ src, alt, width, height, sizes, className = '', priority, dark, fixedAspect }: FrameProps) {
  return (
    <figure className={`overflow-hidden rounded-[16px] shadow-3 ring-1 sm:rounded-[20px] ${dark ? 'bg-[#0b2a35] ring-white/10' : 'bg-white ring-line'} ${className}`}>
      <div className={`flex items-center gap-1.5 px-4 py-3 ${dark ? 'border-b border-white/10' : 'border-b border-line'}`} aria-hidden="true">
        <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
        <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
        <span className="size-2.5 rounded-full bg-[#28c840]/80" />
        <span className={`ml-3 h-5 flex-1 max-w-[220px] rounded-full ${dark ? 'bg-white/10' : 'bg-bg'}`} />
      </div>
      {fixedAspect ? (
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover object-top" />
        </div>
      ) : (
        <Image src={src} alt={alt} width={width} height={height} sizes={sizes} priority={priority} className="block h-auto w-full" />
      )}
    </figure>
  );
}

/** Cropped detail of a screen, shown as a floating UI card. */
export function ScreenCard({ src, alt, width, height, sizes, className = '', priority }: FrameProps) {
  return (
    <figure className={`overflow-hidden rounded-[18px] bg-white shadow-3 ring-1 ring-line sm:rounded-[22px] ${className}`}>
      <Image src={src} alt={alt} width={width} height={height} sizes={sizes} priority={priority} className="block h-auto w-full" />
    </figure>
  );
}

/** Mobile screenshot in a simple phone shell. */
export function PhoneFrame({ src, alt, width, height, sizes, className = '', priority }: FrameProps) {
  return (
    <figure className={`rounded-[38px] bg-deep p-2.5 shadow-3 ring-1 ring-black/10 ${className}`}>
      <div className="relative overflow-hidden rounded-[30px] bg-white">
        <Image src={src} alt={alt} width={width} height={height} sizes={sizes} priority={priority} className="block h-auto w-full" />
      </div>
    </figure>
  );
}

export const screens = {
  home: { src: '/screens/home.webp', width: 2000, height: 1250 },
  postJob: { src: '/screens/post-job.webp', width: 2000, height: 1250 },
  offers: { src: '/screens/offers.webp', width: 2000, height: 1250 },
  clientPanel: { src: '/screens/client-panel.webp', width: 2000, height: 1422 },
  providerJobs: { src: '/screens/provider-jobs.webp', width: 2000, height: 1422 },
  providerOffer: { src: '/screens/provider-offer.webp', width: 2000, height: 1250 },
  stepDescribe: { src: '/screens/step-describe.webp', width: 1400, height: 593 },
  stepMatch: { src: '/screens/step-match.webp', width: 1400, height: 896 },
  stepOffers: { src: '/screens/step-offers.webp', width: 1400, height: 891 },
  mobileHome: { src: '/screens/mobile-home.webp', width: 780, height: 1688 },
  mobileOffers: { src: '/screens/mobile-offers.webp', width: 780, height: 1688 },
  mobileMap: { src: '/screens/mobile-map.webp', width: 780, height: 1688 },
} as const;

export type ScreenKey = keyof typeof screens;
