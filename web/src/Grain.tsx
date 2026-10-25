/** Animated film grain; the noise texture lives in the --noise custom property (set in main.tsx). */
export function Grain({ opacity }: { opacity: number }) {
  return <div className="rw-grain" style={{ opacity }} aria-hidden="true" />;
}
