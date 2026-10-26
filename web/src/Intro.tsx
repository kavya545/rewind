import { useEffect, useRef, useState } from 'react';
import { COUNT, INTRO, clamp, ease } from './data';
import { Grain } from './Grain';

type Props = {
  /** Called every frame with reveal progress 0→1 (the last 600 ms), so the room can fade up behind the intro. */
  onReveal: (r: number) => void;
  onDone: () => void;
};

/** One line per count, typed out in pink: what you can do in the room. */
const LINES = [
  "Tune in · play your own tapes on a '90s TV",
  'Shoot · turn your photos into film strips',
  'Step inside · tap anything in the room',
];

/** Camcorder viewfinder opening: PLAY ▶, battery, corner brackets, and a glitchy 3 · 2 · 1 over black. */
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

  const r = ease(clamp((t - COUNT) / (INTRO - COUNT)));
  useEffect(() => { reveal.current(r); }, [r]);

  const step = Math.min(2, Math.floor(t / 1000)), n = 3 - step, f = (t % 1000) / 1000;
  const line = LINES[step], typed = t >= COUNT ? line.length : Math.round(clamp(f / .45) * line.length);

  return (
    <div className="rw-intro" style={{ opacity: 1 - r, pointerEvents: r > .6 ? 'none' : 'auto' }}>
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

      <div className="rw-vf-center" style={{ opacity: 1 - r }}>
        <p className="rw-vf-line">{line.slice(0, typed)}<span className="rw-vf-caret">_</span></p>
        <span key={n} className="rw-vf-digit">{n}</span>
      </div>
      <Grain opacity={.16} />
      <button className="rw-skip" onClick={() => done.current()}>skip intro</button>
    </div>
  );
}
