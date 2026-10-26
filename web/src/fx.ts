import { useEffect, useRef, type RefObject } from 'react';

/** Mutable flags the effects read on every event, so they never need re-binding. */
export type FxGate = { liquid: boolean; blocked: boolean };

const N = 10;
const VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
// Ripples bend the photo under the cursor with a faint warm shimmer.
const FS = 'precision mediump float;varying vec2 uv;uniform sampler2D img;uniform vec4 rp[' + N + '];uniform float asp;' +
  'void main(){vec2 q=uv;vec2 disp=vec2(0.);float hi=0.;for(int i=0;i<' + N + ';i++){vec4 r=rp[i];if(r.w<=0.)continue;vec2 d=q-r.xy;d.x*=asp;float l=length(d)+1e-4;' +
  'float f=r.z*.22;float env=exp(-pow((l-f)*14.,2.))*exp(-r.z*1.6)*r.w;float wv=sin((l-f)*95.);disp+=d/l*wv*env;hi+=wv*env;}' +
  'disp.x/=asp;vec4 c=texture2D(img,q-disp*.003);c.rgb+=vec3(1.,.86,.66)*hi*.018;gl_FragColor=vec4(c.rgb,1.);}';

/** WebGL water ripple drawn over the room photo; the canvas stays transparent (opacity 0) while idle. */
export function useRipple(canvas: RefObject<HTMLCanvasElement>, src: string, gate: RefObject<FxGate>, disabled: boolean) {
  const loadTex = useRef<(url: string) => void>();

  useEffect(() => {
    const cv = canvas.current; if (!cv || disabled) return;
    const gl = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false }); if (!gl) return;
    const sh = (t: number, s: string) => { const o = gl.createShader(t)!; gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pg = gl.createProgram()!;
    gl.attachShader(pg, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pg, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pg); gl.useProgram(pg);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pg, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRp = gl.getUniformLocation(pg, 'rp'), uAsp = gl.getUniformLocation(pg, 'asp');

    const tex = gl.createTexture(); let ready = false;
    const im = new Image();
    im.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      ready = true;
    };
    loadTex.current = url => { ready = false; im.src = url; };
    im.src = src;

    const rips: { u: number; v: number; t: number; s: number }[] = [];
    const arr = new Float32Array(N * 4);
    let last: { x: number; y: number } | null = null, raf = 0;

    const draw = () => {
      const now = performance.now(); let live = 0; arr.fill(0);
      rips.forEach((r, i) => { const age = (now - r.t) / 1000; if (age < 2.6) { live++; arr.set([r.u, r.v, age, r.s], i * 4); } });
      gl.uniform4fv(uRp, arr); gl.uniform1f(uAsp, cv.width / cv.height); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (live) raf = requestAnimationFrame(draw); else { raf = 0; rips.length = 0; cv.style.opacity = '0'; }
    };
    const wake = () => { cv.style.opacity = '1'; if (!raf) raf = requestAnimationFrame(draw); };

    const size = () => { const d = Math.min(1.5, window.devicePixelRatio || 1); cv.width = Math.round(cv.clientWidth * d); cv.height = Math.round(cv.clientHeight * d); gl.viewport(0, 0, cv.width, cv.height); };
    size();
    const onMove = (e: PointerEvent) => {
      const g = gate.current; if (!ready || !g || !g.liquid || g.blocked) return;
      const r = cv.getBoundingClientRect(); if (!r.width) return;
      const u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
      if (u < 0 || u > 1 || v < 0 || v > 1) return;
      if (!last || Math.hypot(e.clientX - last.x, e.clientY - last.y) > 48) {
        last = { x: e.clientX, y: e.clientY };
        rips.push({ u, v, t: performance.now(), s: .7 + Math.random() * .3 }); if (rips.length > N) rips.shift();
      }
      wake();
    };
    // The stage resizes with the viewport after React re-renders, so measure on the next frame.
    const onResize = () => requestAnimationFrame(size);
    window.addEventListener('pointermove', onMove); window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); loadTex.current = undefined; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  useEffect(() => { loadTex.current?.(src); }, [src]);
}

/**
 * Hold-and-drag to look around: the whole room turns a little, as if you moved your eyes.
 * The room sits slightly zoomed in (--tilt-scale) so a turn reveals a sliver more of it at the edge you look toward;
 * the slight perspective swing brings that edge closer while the far edge recedes. A drag never counts as a click.
 */
export function useTilt(room: RefObject<HTMLDivElement>, tilt: RefObject<HTMLDivElement>, gate: RefObject<FxGate>, disabled: boolean) {
  useEffect(() => {
    const rm = room.current, tl = tilt.current; if (!rm || !tl || disabled) return;
    const S = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tilt-scale')) || 1.1;
    let down: { x: number; y: number } | null = null, moved = false;
    // How far the room can slide toward one side before its edge would show: whatever of the (zoomed) photo is
    // hidden past the opposite viewport edge. Kept to 70% so the perspective swing never reveals an edge, and capped
    // so a turn stays small even where lots of the photo is off-screen (phones in portrait).
    const reach = (hidden: number, view: number, cap: number) => Math.min(Math.max(0, hidden) * .7, view * cap);
    const set = (lx: number, ly: number, fast: boolean) => {
      const st = tl.firstElementChild as HTMLElement | null, vw = window.innerWidth, vh = window.innerHeight;
      const L = st ? vw / 2 + (st.offsetLeft - vw / 2) * S : -vw * (S - 1) / 2, R = st ? L + st.offsetWidth * S : vw + vw * (S - 1) / 2;
      const T = st ? vh / 2 + (st.offsetTop - vh / 2) * S : -vh * (S - 1) / 2, B = st ? T + st.offsetHeight * S : vh + vh * (S - 1) / 2;
      const tx = lx > 0 ? lx * reach(-L, vw, .16) : lx * reach(R - vw, vw, .16);
      const ty = ly > 0 ? ly * reach(-T, vh, .08) : ly * reach(B - vh, vh, .08);
      tl.style.transition = fast ? 'transform .12s ease-out' : 'transform .9s cubic-bezier(.2,.8,.2,1)';
      tl.style.transform = (lx || ly)
        ? `perspective(1800px) translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) rotateY(${(lx * 2.4).toFixed(2)}deg) rotateX(${(-ly * 1.6).toFixed(2)}deg) scale(${S})`
        : `scale(${S})`;
    };
    const onDown = (e: PointerEvent) => { if (gate.current?.blocked || e.button > 0) return; down = { x: e.clientX, y: e.clientY }; moved = false; };
    const onMove = (e: PointerEvent) => {
      if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!moved && Math.hypot(dx, dy) > 6) { moved = true; rm.style.cursor = 'grabbing'; }
      if (moved) { const c = (v: number) => Math.max(-1, Math.min(1, v)); set(c(dx / 420), c(dy / 320), true); }
    };
    const onUp = () => { if (!down) return; down = null; rm.style.cursor = ''; set(0, 0, false); if (moved) setTimeout(() => (moved = false), 0); };
    const onClick = (e: MouseEvent) => { if (moved) { e.stopPropagation(); e.preventDefault(); } };
    rm.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp); rm.addEventListener('click', onClick, true);
    return () => { rm.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); rm.removeEventListener('click', onClick, true); };
  }, [room, tilt, gate, disabled]);
}
