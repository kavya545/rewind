import { useEffect, useRef, useState } from 'react';
import { COUNT, INTRO, STEP, STEPS, clamp, ease } from './data';
import { Grain } from './Grain';

type Props = {
  /** Called every frame with reveal progress 0→1 while the screen opens, so the room can brighten behind it. */
  onReveal: (r: number) => void;
  onDone: () => void;
};

/** What you can do in the room, typed out in pink one part at a time across the countdown. */
const PARTS = ['Play your tapes', 'Shoot film strips', 'Step into the room'];
const PART_MS = COUNT / PARTS.length, TYPE_START = 180, FADE_MS = 220;
/** Typewriter rhythm: a slightly uneven gap before each key, a longer one before a space. Cumulative ms per character. */
const KEY_AT = PARTS.map(p => { let at = TYPE_START; return [...p].map((ch, i) => (at += 62 + ((i * 37) % 5) * 11 + (ch === ' ' ? 45 : 0))); });

const easeInOut = (x: number) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

/**
 * Camcorder viewfinder opening: PLAY ▶, battery, corner brackets and a glitchy 5 · 4 · 3 · 2 · 1 over black.
 * At the end a bright seam flashes across the middle and the black splits, top half up and bottom half down, onto the room.
 */
export function Intro({ onReveal, onDone }: Props) {
  const [t, setT] = useState(0);
  const done = useRef(onDone); done.current = onDone;
  const reveal = useRef(onReveal); reveal.current = onReveal;

  useEffect(() => {
    const t0 = performance.now(); let raf = 0;
    const tick = (now: number) => {
      const el = now - t0;
      if (el >= INTRO) return done.current();
      setT(el); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Failsafe: never block the homepage, even if rAF is throttled (background tab).
    const safety = setTimeout(() => done.current(), INTRO + 1500);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); done.current(); } };
    window.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(raf); clearTimeout(safety); window.removeEventListener('keydown', onKey); };
  }, []);

  // Opening: HUD fades (0–20%), seam flashes (10–45%), halves part (25–100%).
  const p = clamp((t - COUNT) / (INTRO - COUNT));
  const hud = 1 - clamp(p / .2), seamW = ease(clamp((p - .08) / .15)), seamOp = p < .3 ? clamp((p - .08) / .06) : 1 - clamp((p - .3) / .15);
  const open = easeInOut(clamp((p - .25) / .75)), r = ease(clamp((p - .2) / .55));
  useEffect(() => { reveal.current(r); }, [r]);

  const n = STEPS - Math.min(STEPS - 1, Math.floor(t / STEP));
  const part = Math.min(PARTS.length - 1, Math.floor(t / PART_MS)), local = t - part * PART_MS;
  const typed = KEY_AT[part].filter(at => at <= local).length, finished = typed === PARTS[part].length;
  const lineOp = part < PARTS.length - 1 && local > PART_MS - FADE_MS ? (PART_MS - local) / FADE_MS : 1;

  return (
    <div className="rw-intro" style={{ pointerEvents: p > .25 ? 'none' : 'auto' }}>
      <div className="rw-vf-half top" style={{ transform: `translateY(${-open * 100}%)` }} />
      <div className="rw-vf-half bot" style={{ transform: `translateY(${open * 100}%)` }} />
      <div className="rw-vf-seam" style={{ opacity: seamOp, transform: `translateY(-50%) scaleX(${seamW})` }} />

      <div className="rw-vf-screen" style={{ opacity: hud }}>
        <div className="rw-vf-scan" aria-hidden="true" />
        <div className="rw-vf-track" aria-hidden="true" />
        <div className="rw-vf-vignette" aria-hidden="true" />
        <i className="rw-vf-corner tl" /><i className="rw-vf-corner tr" /><i className="rw-vf-corner bl" /><i className="rw-vf-corner br" />
        <span className="rw-vf-mode">PLAY <svg className="rw-vf-play" viewBox="0 0 18 20" aria-hidden="true"><path d="M1 1l16 9-16 9z" fill="currentColor" /></svg></span>
        <svg className="rw-vf-battery" viewBox="0 0 46 22" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="40" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
          <rect x="42" y="7" width="3" height="8" fill="currentColor" />
          <rect x="5" y="5" width="8" height="12" fill="currentColor" /><rect x="15" y="5" width="8" height="12" fill="currentColor" /><rect x="25" y="5" width="8" height="12" fill="currentColor" />
        </svg>

        <div className="rw-vf-center">
          <p className="rw-vf-line" style={{ opacity: lineOp }}>{PARTS[part].slice(0, typed)}<span className={'rw-vf-caret' + (finished ? ' is-idle' : '')}>_</span></p>
          <span key={n} className="rw-vf-digit">{n}</span>
        </div>
        <Grain opacity={.16} />
        <button className="rw-skip" onClick={() => done.current()}>skip intro</button>
      </div>
    </div>
  );
}
