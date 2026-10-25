import { useEffect, useRef } from 'react';
import { ICON, NOISE, TORN, type Poster } from './data';

const PAPER = `${NOISE.replace('0 0 0 .55 0', '0 0 0 .5 0')}, radial-gradient(ellipse at 28% 18%, #eadcc0, #d9c6a2 58%, #c6ae86 100%)`;

/** A taped poster beside a torn, aged-paper card. Closes on ✕, Esc or a click outside. */
export function PosterPopup({ poster, onClose }: { poster: Poster; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.({ preventScroll: true }); };
  }, [onClose]);

  const ar = poster.ar.toFixed(3);
  return (
    <div className="rw-pop" role="dialog" aria-modal="true" aria-label={poster.title} onClick={onClose}>
      <div className="rw-pop-inner" onClick={e => e.stopPropagation()}>
        <div className="rw-pop-poster">
          <img className="rw-pop-img" src={poster.src} alt={`${poster.title} poster`} style={{ width: `min(300px, 70vw, calc(60vh * ${ar}))`, aspectRatio: ar }} />
          <span className="rw-tape" />
        </div>
        <div className="rw-card-wrap">
          <div className="rw-card" style={{ clipPath: TORN, background: PAPER }}>
            <button ref={closeBtn} className="rw-close" onClick={onClose} aria-label="Close">✕</button>
            <h2>{poster.title}</h2>
            <span className="year">({poster.year})</span>
            <p>{poster.desc}</p>
            <hr />
            <div className="rw-credit">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2b2118" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICON[poster.kind]} /></svg>
              <div><span>{poster.creditLabel}</span><span>{poster.credit}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
