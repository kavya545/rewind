import { useEffect, useRef, type RefObject } from 'react';

/** Mutable flags the effects read on every event, so they never need re-binding. */
export type FxGate = { liquid: boolean; blocked: boolean };
/** Shared between tilt and ripple: tilt pushes a "look" offset that the ripple shader uses for fake parallax. */
export type LookBus = { set?: (x: number, y: number) => void };

const N = 10;
const VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
// Near parts of the room (edges, floor) shift more than the back wall when dragging; ripples bend the photo under the cursor.
const FS = 'precision mediump float;varying vec2 uv;uniform sampler2D img;uniform vec4 rp[' + N + '];uniform float asp;uniform vec2 look;' +
  'void main(){vec2 q=uv;float dz=pow(clamp(max(abs(uv.x-.5)*1.15,abs(uv.y-.5)*1.6)*2.,0.,1.),1.6)+smoothstep(.55,1.,uv.y)*.6;q-=look*vec2(.045,.03)*dz;vec2 disp=vec2(0.);float hi=0.;for(int i=0;i<' + N + ';i++){vec4 r=rp[i];if(r.w<=0.)continue;vec2 d=q-r.xy;d.x*=asp;float l=length(d)+1e-4;' +
  'float f=r.z*.22;float env=exp(-pow((l-f)*14.,2.))*exp(-r.z*1.6)*r.w;float wv=sin((l-f)*95.);disp+=d/l*wv*env;hi+=wv*env;}' +
  'disp.x/=asp;vec4 c=texture2D(img,q-disp*.003);c.rgb+=vec3(1.,.86,.66)*hi*.018;c.rgb*=1.-length(look)*dz*.12;gl_FragColor=vec4(c.rgb,1.);}';

/** WebGL water ripple drawn over the room photo; the canvas stays transparent (opacity 0) while idle. */
export function useRipple(canvas: RefObject<HTMLCanvasElement>, src: string, gate: RefObject<FxGate>, bus: LookBus, disabled: boolean) {
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
    const uRp = gl.getUniformLocation(pg, 'rp'), uAsp = gl.getUniformLocation(pg, 'asp'), uLook = gl.getUniformLocation(pg, 'look');

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
    const look = { x: 0, y: 0, tx: 0, ty: 0 };
    const arr = new Float32Array(N * 4);
    let last: { x: number; y: number } | null = null, raf = 0;

    const draw = () => {
      const now = performance.now(); let live = 0; arr.fill(0);
      look.x += (look.tx - look.x) * .1; look.y += (look.ty - look.y) * .1;
      if (Math.abs(look.x) + Math.abs(look.y) + Math.abs(look.tx) + Math.abs(look.ty) > .002) live++; else look.x = look.y = 0;
      rips.forEach((r, i) => { const age = (now - r.t) / 1000; if (age < 2.6) { live++; arr.set([r.u, r.v, age, r.s], i * 4); } });
      gl.uniform4fv(uRp, arr); gl.uniform1f(uAsp, cv.width / cv.height); gl.uniform2f(uLook, look.x, look.y); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (live) raf = requestAnimationFrame(draw); else { raf = 0; rips.length = 0; cv.style.opacity = '0'; }
    };
    const wake = () => { cv.style.opacity = '1'; if (!raf) raf = requestAnimationFrame(draw); };
    bus.set = (x, y) => { look.tx = x; look.ty = y; if (ready) wake(); };

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
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); bus.set = undefined; loadTex.current = undefined; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  useEffect(() => { loadTex.current?.(src); }, [src]);
}

/** Hold-and-drag leans the room a few degrees, then eases back. A drag never counts as a click. */
export function useTilt(room: RefObject<HTMLDivElement>, tilt: RefObject<HTMLDivElement>, gate: RefObject<FxGate>, bus: LookBus, disabled: boolean) {
  useEffect(() => {
    const rm = room.current, tl = tilt.current; if (!rm || !tl || disabled) return;
    let down: { x: number; y: number } | null = null, moved = false;
    const set = (rx: number, ry: number, fast: boolean) => {
      tl.style.transition = fast ? 'transform .12s ease-out' : 'transform .9s cubic-bezier(.2,.8,.2,1)';
      tl.style.transform = (rx || ry) ? `perspective(1400px) scale(1.06) rotateX(${rx}deg) rotateY(${ry}deg)` : 'scale(1.06)';
    };
    const onDown = (e: PointerEvent) => { if (gate.current?.blocked || e.button > 0) return; down = { x: e.clientX, y: e.clientY }; moved = false; };
    const onMove = (e: PointerEvent) => {
      if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!moved && Math.hypot(dx, dy) > 6) { moved = true; rm.style.cursor = 'grabbing'; }
      if (moved) { const c = (v: number) => Math.max(-1, Math.min(1, v)), lx = c(dx / 400), ly = c(dy / 300); set(-ly * 1.6, lx * 2.2, true); bus.set?.(lx, ly); }
    };
    const onUp = () => { if (!down) return; down = null; rm.style.cursor = ''; set(0, 0, false); bus.set?.(0, 0); if (moved) setTimeout(() => (moved = false), 0); };
    const onClick = (e: MouseEvent) => { if (moved) { e.stopPropagation(); e.preventDefault(); } };
    rm.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp); rm.addEventListener('click', onClick, true);
    return () => { rm.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); rm.removeEventListener('click', onClick, true); };
  }, [room, tilt, gate, bus, disabled]);
}
