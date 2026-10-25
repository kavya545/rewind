import { useEffect, useState } from 'react';

const M = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** Live camcorder clock (bottom-left) and copyright line — same as footer.js on the subpages. */
export function Footer() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const h = now.getHours();
  return (
    <div className="rw-footer" aria-label="Current time and copyright">
      <div className="rw-clock">
        <time dateTime={now.toISOString()}>{`${h < 12 ? 'AM' : 'PM'} ${String(((h + 11) % 12) + 1).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`}</time>
        <span>{`${M[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}`}</span>
      </div>
      <div className="rw-copy">{`© ${now.getFullYear()} KAVYA · ALL RIGHTS RESERVED`}</div>
    </div>
  );
}
