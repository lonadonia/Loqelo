import localFont from 'next/font/local';

// Supplied brand fonts (OFL, see licenses/), subset to Latin + Latin Extended-A
// so Polish, German, Dutch, French and Spanish characters are all covered.
export const outfit = localFont({
  src: '../fonts/Outfit-Variable.woff2',
  variable: '--font-outfit',
  weight: '100 900',
  display: 'swap',
  preload: true,
});

export const dmSans = localFont({
  src: '../fonts/DMSans-Variable.woff2',
  variable: '--font-dm-sans',
  weight: '100 1000',
  display: 'swap',
  preload: true,
});
