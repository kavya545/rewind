import { useEffect, useRef, useState } from 'react';
import { COUNT, INTRO, clamp, ease } from './data';
import { Grain } from './Grain';

type Props = {
  roomSrc: string;
  /** Called every frame with reveal progress 0→1 (the last 600 ms), so the room can fade up behind the intro. */
  onReveal: (r: number) => void;
  onDone: () => void;
};

/** Camcorder-framed opening: a floating cassette rewinds while 03 · 02 · 01 counts down, then a flare reveals the room. */
export function Intro({ roomSrc, onReveal, onDone }: Props) {
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

  const fl = Math.sin(t / 900) * 10;
  const rotY = -20 + (t / INTRO) * 12, rotX = 12 + Math.sin(t / 1300) * 2, rotZ = -4 + Math.sin(t / 1700) * 1.5;
  // Reels spin up from rest, then turn at a steady rate.
  const ang = -(0.42 * t - 0.42 * 600 * (1 - Math.exp(-t / 600)));
  // Tape winds from the right reel onto the left; the right hub turns faster as its pack shrinks.
  const w = clamp(t / COUNT), dL = 17 + 8 * w, dR = 25 - 8 * w;
  const n = Math.min(3, Math.max(1, 3 - Math.floor(t / 1000))), f = (t % 1000) / 1000;
  const dOp = t >= COUNT ? 1 - r : clamp(f / .14) * clamp((1 - f) / .14 + (n === 1 ? 1 : 0));
  const flare = Math.sin(Math.PI * clamp((t - 2600) / 1000));

  return (
    <div className="rw-intro" style={{ opacity: 1 - r, pointerEvents: r > .6 ? 'none' : 'auto' }}>
      <img src={roomSrc} alt="" className="rw-intro-bg" style={{ filter: `blur(${22 - 8 * r}px) brightness(${.5 + .3 * r}) saturate(1.1)`, transform: `scale(${1.08 - .04 * (t / INTRO)})` }} />
      <div className="rw-intro-shade" />
      <div className="rw-blinds" style={{ transform: `rotate(-14deg) translateY(${(t / INTRO) * 40}px)` }} />
      <div className="rw-frame" />
      <span className="rw-hud mode">{Math.floor(t / 500) % 2 ? '◀◀ REW' : '◀◀ REW ●'}</span>
      <span className="rw-battery" aria-hidden="true"><i /><i /><i /></span>
      <span className="rw-hud time">{'PM 05:47\nOCT 26 1997'}</span>

      <div className="rw-floor" style={{ transform: `translate(-50%,-50%) scale(${1 - fl * .012})` }} />
      <div className="rw-cassette" style={{
        transform: `translate(-50%,-50%) translateY(${fl}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${1 + .22 * r})`,
        filter: r > 0 ? `blur(${r * 10}px)` : 'none',
      }}>
        <div className="rw-shell">
          <div className="rw-sticker">
            <span className="t">Rewind</span>
            <span className="side">SIDE A</span>
            <div className="s1" /><div className="s2" />
            <span className="fine" style={{ left: '4%' }}>C-60 · TYPE I · NORMAL BIAS</span>
            <span className="fine" style={{ right: '4%' }}>60 MIN</span>
          </div>
          <div className="rw-window">
            <div className="rw-pack" style={{ left: '12%', width: dL + 'cqw', height: dL + 'cqw' }} />
            <div className="rw-pack" style={{ left: '88%', width: dR + 'cqw', height: dR + 'cqw' }} />
            <div className="rw-hub" style={{ left: '12%', transform: `translate(-50%,-50%) rotate(${ang}deg)` }} />
            <div className="rw-hub" style={{ left: '88%', transform: `translate(-50%,-50%) rotate(${ang * dL / dR}deg)` }} />
            <div className="rw-window-sheen" />
          </div>
          <div className="rw-lip" />
          <div className="rw-coolcast" />
          <div className="rw-sweep" style={{ backgroundPosition: `${110 - w * 120}% 0` }} />
        </div>
      </div>

      <div className="rw-flare" style={{ opacity: .25 + flare * .75 }} />
      <div className="rw-count" style={{ opacity: 1 - r }}>
        <span className="cap">rewinding</span>
        <span className="rw-digit" style={{ opacity: dOp, transform: `translateY(${(1 - clamp(f / .2)) * 8}px)` }}>{String(n).padStart(2, '0')}</span>
      </div>
      <Grain opacity={.14} />
      <button className="rw-skip" onClick={() => done.current()}>skip intro</button>
    </div>
  );
}
