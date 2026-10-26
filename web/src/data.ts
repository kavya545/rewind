export const NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`;

/** Intro countdown: STEPS numbers of STEP ms each, then the screen splits open onto the room. */
export const STEPS = 5, STEP = 1200, COUNT = STEPS * STEP, INTRO = COUNT + 1100;
/** Room photo pixel size; poster hit areas are authored in these pixels. */
export const IW = 1585, IH = 992, AR = IH / IW;
/** Focal point of the room photo (kept centred on the TV at any viewport). */
export const FOCUS_X = .46, FOCUS_Y = .55;

/** Golden hour gets a gentle grade so it reads as soft rather than orange. */
export const GOLDEN_GRADE = 'saturate(.78) sepia(.08) brightness(.96) contrast(.97)';

export const ROOMS: { label: string; src: string; grade?: string }[] = [
  { label: 'Golden hour', src: 'assets/room-home.png', grade: GOLDEN_GRADE },
  { label: 'Faded afternoon', src: 'assets/room-afternoon.png' },
  { label: 'Blue dusk', src: 'assets/room-dusk.png' },
];

export type ObjectId = 'tv' | 'cam' | 'tw' | 'deck';

/** Clickable objects in the room. Positions are % of the room photo. */
export const OBJECTS: {
  id: ObjectId; no: string; name: string; verb: string; href: string; aria: string;
  hit: [number, number, number, number]; radius: string;
  glow?: [number, number, number, number]; label: [number, number];
}[] = [
  { id: 'tv', no: '01', name: 'Television', verb: 'tune in →', href: 'TV.dc.html', aria: 'Television — tune in', hit: [36.3, 33.8, 27.7, 34.3], radius: '2%', label: [50.1, 32.5] },
  { id: 'cam', no: '02', name: 'Camera', verb: 'shoot →', href: 'Camera.dc.html', aria: 'Camera — shoot', hit: [31.3, 60, 10.5, 11], radius: '8%', glow: [29, 56, 15, 18], label: [36.5, 59] },
  { id: 'tw', no: '03', name: 'Typewriter', verb: 'type →', href: 'Typewriter.dc.html', aria: 'Typewriter', hit: [65.9, 71.1, 17.4, 16.1], radius: '6%', glow: [64, 66, 21, 25], label: [74.6, 70] },
  { id: 'deck', no: '04', name: 'Cassette deck', verb: 'play →', href: 'Cassette.dc.html', aria: 'Cassette deck', hit: [34.1, 73.1, 16.1, 13.6], radius: '4%', glow: [32, 69, 20, 22], label: [42.2, 72.5] },
];

export const ICON = {
  film: 'M3 10h12v9H3zM15 13l6-3v9l-6-3M6 7a2.5 2.5 0 1 0 0 .01M12 7a2.5 2.5 0 1 0 0 .01',
  band: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3M8 21h8',
  tv: 'M3 8h18v12H3zM8 3l4 5 4-5',
};

export type Poster = {
  title: string; src: string; ar: number; year: string; kind: keyof typeof ICON;
  creditLabel: string; credit: string; desc: string;
  /** Hit area in room-photo pixels: x, y, w, h. */
  px: [number, number, number, number];
};

export const POSTERS: Poster[] = [
  { title: 'Nirvana', src: 'assets/poster-nirvana.png', ar: 670 / 1000, year: '1987 – 1994', kind: 'band', creditLabel: 'Fronted by', credit: 'Kurt Cobain', px: [120, 28, 168, 262], desc: 'The Aberdeen, Washington trio that dragged grunge into the mainstream. Nevermind knocked pop off the top of the charts and made flannel a uniform for a generation.' },
  { title: 'Pulp Fiction', src: 'assets/poster-pulp.png', ar: 250 / 369, year: '1994', kind: 'film', creditLabel: 'Directed by', credit: 'Quentin Tarantino', px: [305, 65, 173, 275], desc: 'Hitmen, a boxer and a mysterious briefcase, told out of order. It won the Palme d\'Or and made sharp, rambling dialogue the new special effect.' },
  { title: 'Back to the Future', src: 'assets/poster-bttf.png', ar: 1200 / 1900, year: '1985', kind: 'film', creditLabel: 'Directed by', credit: 'Robert Zemeckis', px: [500, 15, 188, 305], desc: 'A teenager, a DeLorean and 1.21 gigawatts. Marty McFly\'s accidental trip to 1955 became one of the most rewound VHS tapes of all time — sci-fi, comedy and heart in one.' },
  { title: 'Jurassic Park', src: 'assets/poster-jurassic.png', ar: 240 / 360, year: '1993', kind: 'film', creditLabel: 'Directed by', credit: 'Steven Spielberg', px: [703, 100, 159, 230], desc: 'Dinosaurs cloned from amber, and computer effects that changed blockbusters forever. The T. rex in the rain still holds up.' },
  { title: 'Titanic', src: 'assets/poster-titanic.png', ar: 2015 / 3000, year: '1997', kind: 'film', creditLabel: 'Directed by', credit: 'James Cameron', px: [878, 0, 92, 238], desc: 'A love story aboard the "unsinkable" ship. It swept eleven Oscars and became the highest-grossing film of its era.' },
  { title: 'The Cure', src: 'assets/poster-cure.png', ar: 768 / 1024, year: '1978 –', kind: 'band', creditLabel: 'Fronted by', credit: 'Robert Smith', px: [0, 318, 113, 210], desc: 'Crawley\'s gloomiest export — eyeliner, big hair and songs that swing from heartbreak to pure pop. Disintegration was on repeat in a lot of bedrooms.' },
  { title: 'MTV', src: 'assets/poster-mtv.png', ar: 1568 / 818, year: '1981', kind: 'tv', creditLabel: 'Launched', credit: 'August 1, 1981', px: [205, 333, 117, 115], desc: 'Music Television — the channel that turned songs into short films and VJs into stars. In the \'90s it was the background noise of every teenage bedroom.' },
];

/** Deterministic torn-paper outline for the poster card. */
export const TORN = (() => {
  let s = 7; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; const p: [number, number][] = []; const N = 26;
  for (let i = 0; i <= N; i++) p.push([(i / N) * 100, r() * 1.6]);
  for (let i = 1; i <= N; i++) p.push([100 - r() * 1.4, (i / N) * 100]);
  for (let i = N - 1; i >= 0; i--) p.push([(i / N) * 100, 100 - r() * 1.8]);
  for (let i = N - 1; i > 0; i--) p.push([r() * 1.2, (i / N) * 100]);
  return 'polygon(' + p.map(([x, y]) => x.toFixed(2) + '% ' + y.toFixed(2) + '%').join(',') + ')';
})();

export const DUST = Array.from({ length: 18 }, (_, i) => ({ l: 52 + ((i * 37) % 44), t: 20 + ((i * 53) % 56), s: 1.5 + (i % 3), d: 9 + (i % 5) * 2.3, dl: -(i * 1.7) }));

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const ease = (x: number) => 1 - Math.pow(1 - x, 3);

export const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/** Storage keys are shared with the prototype subpages (liquid.js reads rewind-liquid). */
export const KEY = { intro: 'rewind-intro-v2', room: 'rewind-room', liquid: 'rewind-liquid' };
export const store = {
  get(area: 'local' | 'session', k: string): string | null { try { return (area === 'local' ? localStorage : sessionStorage).getItem(k); } catch { return null; } },
  set(area: 'local' | 'session', k: string, v: string) { try { (area === 'local' ? localStorage : sessionStorage).setItem(k, v); } catch { /* storage blocked */ } },
};
