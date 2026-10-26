import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { AR, DUST, FOCUS_X, FOCUS_Y, IH, IW, KEY, OBJECTS, POSTERS, ROOMS, clamp, reducedMotion, store, type ObjectId } from './data';
import { useRipple, useTilt, type FxGate } from './fx';
import { Intro } from './Intro';
import { PosterPopup } from './PosterPopup';
import { Footer } from './Footer';
import { Grain } from './Grain';

type Props = {
  /** Play the cassette intro at all. */
  showIntro?: boolean;
  /** Only play it on the first homepage visit of a browser session. */
  oncePerSession?: boolean;
};

/**
 * Switch-off transition stage.
 * 0 open · 1 bars close + line · 2 line shrinks to a dot · 3 dot fades (navigate) · 4 closed (bars about to open).
 */
type Off = 0 | 1 | 2 | 3 | 4;
type Hover = ObjectId | `p${number}` | null;

export function Home({ showIntro = true, oncePerSession = true }: Props) {
  const reduce = useMemo(reducedMotion, []);
  const seen = useMemo(() => store.get('session', KEY.intro) === '1', []);

  const [intro, setIntro] = useState(() => showIntro && !reduce && !(oncePerSession && seen));
  // Returning visitors land with the screen "off" and get the switch-on bars instead of the intro.
  const [off, setOff] = useState<Off>(() => (seen ? 4 : 0));
  const [room, setRoom] = useState(() => { const i = +(store.get('local', KEY.room) || 0) || 0; return i >= 0 && i < ROOMS.length ? i : 0; });
  const [liquid, setLiquid] = useState(() => store.get('local', KEY.liquid) !== '0');
  const [hover, setHover] = useState<Hover>(null);
  const [poster, setPoster] = useState<number | null>(null);
  const [leaving, setLeaving] = useState<ObjectId | null>(null);
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));

  const roomEl = useRef<HTMLDivElement>(null), tiltEl = useRef<HTMLDivElement>(null);
  const stageEl = useRef<HTMLDivElement>(null), rippleEl = useRef<HTMLCanvasElement>(null);
  const gate = useRef<FxGate>({ liquid, blocked: false });
  gate.current.liquid = liquid;
  gate.current.blocked = intro || !!leaving || poster != null;
  const navT = useRef<number[]>([]);

  useRipple(rippleEl, ROOMS[room].src, gate, reduce);
  useTilt(roomEl, tiltEl, gate, reduce);

  useEffect(() => {
    if (off === 4) { const id = requestAnimationFrame(() => requestAnimationFrame(() => setOff(0))); return () => cancelAnimationFrame(id); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    // Coming back via the browser's back button restores this page from bfcache mid-transition; reset it.
    const onShow = () => { navT.current.forEach(clearTimeout); setLeaving(null); setOff(0); };
    window.addEventListener('resize', onResize); window.addEventListener('pageshow', onShow);
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('pageshow', onShow); navT.current.forEach(clearTimeout); };
  }, []);

  const endIntro = useCallback(() => {
    store.set('session', KEY.intro, '1');
    setIntro(false);
    if (stageEl.current) stageEl.current.style.opacity = '';
  }, []);
  const onReveal = useCallback((r: number) => { if (stageEl.current) stageEl.current.style.opacity = String(.3 + .7 * r); }, []);

  const go = (which: ObjectId, href: string, e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let the browser open a new tab
    e.preventDefault();
    if (leaving) return;
    if (reduce) { window.location.href = href; return; }
    setLeaving(which); setHover(null); setOff(1);
    const at = (ms: number, fn: () => void) => navT.current.push(window.setTimeout(fn, ms));
    at(400, () => setOff(2));
    at(630, () => setOff(3));
    at(830, () => { window.location.href = href; });
  };

  const enter = (h: Hover) => () => { if (!leaving) setHover(h); };
  const unhover = () => { if (!leaving) setHover(null); };
  const closePoster = useCallback(() => setPoster(null), []);

  // Cover the viewport with the photo while keeping the TV area as close to centre as the edges allow.
  const W = Math.max(vp.w, vp.h / AR), H = W * AR;
  const L = clamp(vp.w / 2 - FOCUS_X * W, vp.w - W, 0), T = clamp(vp.h / 2 - FOCUS_Y * H, vp.h - H, 0);
  const labelFont = Math.max(9, Math.min(11, W / 130));
  const pct = (v: number) => v + '%';
  const grade = ROOMS[room].grade;

  return (
    <div ref={roomEl} className="rw-room">
      <div ref={tiltEl} className="rw-tilt">
        <div ref={stageEl} className={'rw-stage' + (poster != null ? ' is-blurred' : '')} style={{ left: L, top: T, width: W, height: H }}>
          {ROOMS.map((r, i) => (
            <img key={r.src} src={r.src} alt={i === room ? 'A sunlit 1997 bedroom with a TV and a film camera — ' + r.label : ''}
              draggable={false} decoding="async" className="rw-layer" style={{ opacity: i === room ? 1 : 0, filter: r.grade || 'none' }} />
          ))}
          <canvas ref={rippleEl} className="rw-ripple" aria-hidden="true" style={{ filter: grade || 'none' }} />
          <div className="rw-sun" />

          <div className={'rw-tvglow' + (hover === 'tv' ? ' is-on' : '')}><i /><i /><i /></div>
          {OBJECTS.map(o => o.glow && (
            <div key={o.id} className={'rw-glow' + (o.id === 'cam' ? ' is-cam' : '') + (hover === o.id ? ' is-on' : '')}
              style={{ left: pct(o.glow[0]), top: pct(o.glow[1]), width: pct(o.glow[2]), height: pct(o.glow[3]) }} />
          ))}

          {OBJECTS.map(o => (
            <a key={o.id} href={o.href} aria-label={o.aria} className="rw-hit" draggable={false}
              onClick={e => go(o.id, o.href, e)} onMouseEnter={enter(o.id)} onMouseLeave={unhover} onFocus={enter(o.id)} onBlur={unhover}
              style={{ left: pct(o.hit[0]), top: pct(o.hit[1]), width: pct(o.hit[2]), height: pct(o.hit[3]), borderRadius: o.radius }} />
          ))}
          {POSTERS.map((p, i) => {
            const [x, y, w, h] = p.px;
            return (
              <button key={p.title} aria-label={p.title + ' poster — open details'} className={'rw-hit rw-poster-hit' + (hover === 'p' + i ? ' is-on' : '')}
                onClick={() => { if (!leaving) { setPoster(i); setHover(null); } }} onMouseEnter={enter(`p${i}`)} onMouseLeave={unhover} onFocus={enter(`p${i}`)} onBlur={unhover}
                style={{ left: pct(x / IW * 100), top: pct(y / IH * 100), width: pct(w / IW * 100), height: pct(h / IH * 100) }} />
            );
          })}

          {POSTERS.map((p, i) => {
            const [x, y, w, h] = p.px, l = x / IW * 100, tp = y / IH * 100, wd = w / IW * 100, hh = h / IH * 100;
            const below = tp < 12; // posters at the very top get their label underneath, clear of the header
            return (
              <div key={p.title} aria-hidden="true" className={'rw-label' + (below ? ' is-below' : '') + (hover === 'p' + i && !leaving ? ' is-on' : '')}
                style={{ left: pct(l + wd / 2), top: pct(below ? tp + hh + 1.2 : tp - .8), fontSize: labelFont }}>
                <span className="no">{String(i + 5).padStart(2, '0')}</span><span className="name">{p.title}</span><span>view</span>
              </div>
            );
          })}
          {OBJECTS.map(o => (
            <div key={o.id} aria-hidden="true" className={'rw-label' + (hover === o.id && !leaving ? ' is-on' : '')}
              style={{ left: pct(o.label[0]), top: pct(o.label[1]), fontSize: labelFont }}>
              <span className="no">{o.no}</span><span className="name">{o.name}</span><span>{o.verb}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={'rw-ambient' + (leaving ? ' is-gone' : '')} aria-hidden="true">
        {DUST.map((d, i) => (
          <span key={i} className="rw-dust" style={{ left: d.l + '%', top: d.t + '%', width: d.s, height: d.s, animation: `rw-dust ${d.d}s linear ${d.dl}s infinite` }} />
        ))}
        <div className="rw-vignette" />
        <Grain opacity={.1} />
      </div>

      <header className="rw-header">
        <span className="rw-logo">Rewind</span>
        <span className="rw-side">side a — 1994</span>
      </header>
      <div className="rw-controls" onPointerDown={e => e.stopPropagation()}>
        <span className={'rw-hint' + (hover || leaving || intro ? ' is-hidden' : '')}>tap anything in the room</span>
        <div role="tablist" aria-label="Room lighting" className="rw-tabs rw-glass">
          {ROOMS.map((r, i) => {
            const on = room === i;
            return (
              <button key={r.src} role="tab" aria-selected={on} className="rw-tab"
                onClick={() => { if (on) return; store.set('local', KEY.room, String(i)); setRoom(i); }}>
                <span className="mark">{on ? '▶' : String(i + 1).padStart(2, '0')}</span><span>{r.label}</span>
              </button>
            );
          })}
        </div>
        <button className="rw-liquid rw-glass" aria-pressed={liquid}
          onClick={() => { const v = !liquid; store.set('local', KEY.liquid, v ? '1' : '0'); setLiquid(v); }}>
          <span>Liquid light</span>
          <span className="rw-track"><span className="rw-dot" /></span>
        </button>
      </div>

      {poster != null && <PosterPopup poster={POSTERS[poster]} onClose={closePoster} />}

      <div className="rw-off" data-stage={off} aria-hidden="true">
        <div className="rw-bar top" /><div className="rw-bar bot" /><div className="rw-line" />
      </div>
      {intro && <Intro roomSrc={ROOMS[room].src} onReveal={onReveal} onDone={endIntro} />}
      <Footer />
    </div>
  );
}
