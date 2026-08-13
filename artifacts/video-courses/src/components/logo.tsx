/**
 * Premium Magic Logo component — خفة اليد والسحر
 * Features a magic wand with sparkles, a top hat silhouette, and golden amber accents.
 */
export function Logo({ size = 50, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo2.png"
      alt="Классный Фокус — Обучение фокусам и трюкам"
      width={size}
      height={size}
      className={`transition-transform duration-300 hover:scale-105 object-contain ${className}`}
    />
  );
}

/** Full Wordmark Logo: Magic SVG Icon + brand text */
export function LogoWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center select-none group cursor-pointer ${className}`}>
      <Logo size={180} />
    </div>
  );
}
