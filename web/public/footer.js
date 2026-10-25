(function () {
  if (window.__rwFooter) return; window.__rwFooter = true;
  const M = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  function mount() {
    const wrap = document.createElement('div');
    wrap.setAttribute('aria-label', 'Current time and copyright');
    wrap.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:60;pointer-events:none;font-family:'VT323',monospace;color:#f6efe4;text-shadow:0 0 8px rgba(0,0,0,.6)";
    const clock = document.createElement('div');
    clock.style.cssText = 'position:absolute;left:calc(clamp(12px,2.6vw,30px) + clamp(14px,2vw,28px));bottom:calc(clamp(12px,2.6vw,30px) + clamp(12px,2.2vh,24px));display:flex;flex-direction:column;font-size:clamp(20px,1.9vw,28px);line-height:1.1;letter-spacing:.06em;text-shadow:0 0 8px rgba(0,0,0,.5);opacity:.75';
    const t = document.createElement('time'), d = document.createElement('span');
    clock.append(t, d);
    const cr = document.createElement('div');
    cr.style.cssText = 'position:absolute;left:50%;bottom:clamp(8px,1.4vh,14px);transform:translateX(-50%);font-size:clamp(13px,1vw,16px);letter-spacing:.18em;color:rgba(246,239,228,.72);white-space:nowrap';
    wrap.append(clock, cr);
    document.body.appendChild(wrap);
    const tick = () => { const n = new Date(), h = n.getHours();
      t.textContent = `${h < 12 ? 'AM' : 'PM'} ${String(((h + 11) % 12) + 1).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
      t.dateTime = n.toISOString(); d.textContent = `${M[n.getMonth()]} ${n.getDate()} ${n.getFullYear()}`;
      cr.textContent = `© ${n.getFullYear()} KAVYA · ALL RIGHTS RESERVED`; };
    tick(); setInterval(tick, 1000);
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
