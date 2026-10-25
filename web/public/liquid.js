(function () {
  if (window.__liquid) return; window.__liquid = true;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const enabled = () => { try { return localStorage.getItem('rewind-liquid') !== '0'; } catch (e) { return true; } };
  const N = 10, items = [];
  const VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
  const FS = 'precision mediump float;varying vec2 uv;uniform sampler2D img;uniform vec4 rp[' + N + '];uniform float asp;' +
    'void main(){vec2 disp=vec2(0.);float hi=0.;for(int i=0;i<' + N + ';i++){vec4 r=rp[i];if(r.w<=0.)continue;vec2 d=uv-r.xy;d.x*=asp;float l=length(d)+1e-4;' +
    'float f=r.z*.22;float env=exp(-pow((l-f)*14.,2.))*exp(-r.z*1.6)*r.w;float wv=sin((l-f)*95.);disp+=d/l*wv*env;hi+=wv*env;}' +
    'disp.x/=asp;vec4 c=texture2D(img,uv-disp*.003);c.rgb+=vec3(1.,.86,.66)*hi*.018;gl_FragColor=vec4(c.rgb,1.);}';
  function attach(img) {
    if (img.__liq) return; img.__liq = true;
    const go = () => {
      const cv = document.createElement('canvas'), gl = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false }); if (!gl) return;
      const s = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)); cv.width = Math.round(img.naturalWidth * s); cv.height = Math.round(img.naturalHeight * s);
      cv.setAttribute('aria-hidden', 'true');
      const sync = () => { cv.style.cssText = img.style.cssText; cv.style.pointerEvents = 'none'; cv.style.transition = (cv.style.transition ? cv.style.transition + ', ' : '') + 'opacity .4s'; };
      sync(); cv.style.opacity = '0'; img.after(cv);
      const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; };
      const pg = gl.createProgram(); gl.attachShader(pg, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pg, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pg); gl.useProgram(pg);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pg, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
      [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
      gl.viewport(0, 0, cv.width, cv.height);
      items.push({ img, cv, gl, uRp: gl.getUniformLocation(pg, 'rp'), uAsp: gl.getUniformLocation(pg, 'asp'), rips: [], last: null, raf: 0, arr: new Float32Array(N * 4), sync });
    };
    if (img.complete && img.naturalWidth) go(); else img.addEventListener('load', go, { once: true });
  }
  function toUV(it, e) {
    const r = it.cv.getBoundingClientRect(); if (!r.width) return null;
    const cs = getComputedStyle(it.img), fit = cs.objectFit, iw = it.cv.width, ih = it.cv.height;
    let cw = r.width, ch = r.height, ox = 0, oy = 0;
    if (fit === 'cover' || fit === 'contain') { const k = fit === 'cover' ? Math.max(r.width / iw, r.height / ih) : Math.min(r.width / iw, r.height / ih); cw = iw * k; ch = ih * k;
      const pos = (cs.objectPosition || '50% 50%').split(' ').map(v => parseFloat(v) / 100); ox = (r.width - cw) * (isNaN(pos[0]) ? .5 : pos[0]); oy = (r.height - ch) * (isNaN(pos[1]) ? .5 : pos[1]); }
    const u = (e.clientX - r.left - ox) / cw, v = (e.clientY - r.top - oy) / ch;
    return u < 0 || u > 1 || v < 0 || v > 1 ? null : [u, v];
  }
  function draw(it) {
    const now = performance.now(); let live = 0; it.arr.fill(0);
    it.rips.forEach((r, i) => { const age = (now - r.t) / 1000; if (age < 2.6) { live++; it.arr.set([r.u, r.v, age, r.s], i * 4); } });
    const gl = it.gl; gl.uniform4fv(it.uRp, it.arr); gl.uniform1f(it.uAsp, it.cv.width / it.cv.height); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (live) it.raf = requestAnimationFrame(() => draw(it)); else { it.raf = 0; it.rips.length = 0; it.cv.style.opacity = '0'; }
  }
  window.addEventListener('pointermove', e => {
    if (!enabled()) return;
    items.forEach(it => { const uv = toUV(it, e); if (!uv) return;
      if (!it.last || Math.hypot(e.clientX - it.last.x, e.clientY - it.last.y) > 48) { it.last = { x: e.clientX, y: e.clientY }; it.rips.push({ u: uv[0], v: uv[1], t: performance.now(), s: .7 + Math.random() * .3 }); if (it.rips.length > N) it.rips.shift(); }
      if (!it.raf) { it.sync(); it.cv.style.opacity = '1'; it.raf = requestAnimationFrame(() => draw(it)); } });
  }, { passive: true });
  const scan = () => document.querySelectorAll('img[data-liquid]').forEach(attach);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState !== 'loading') scan(); else document.addEventListener('DOMContentLoaded', scan);
})();
