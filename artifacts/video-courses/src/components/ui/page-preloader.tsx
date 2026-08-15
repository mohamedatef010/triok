import { useEffect, useState } from "react";

/**
 * PagePreloader
 * Features an ultra-premium logo assembly & glow reveal animation
 * matching the user's custom brand logo (МБ / Максим Берестнев).
 *
 * Fixes:
 *  - Image flicker: removed animate-ping particles, image is immediately visible
 *  - Text disappearing: all text uses stable opacity-based animation (no flicker)
 *  - Fast open: duration reduced, preloader exits with a gentle fade+scale (not slide-up)
 *  - Smooth transition: soft curtain fade-out before site appears
 */
export function PagePreloader({ duration = 1500 }: { duration?: number }) {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const intervalTime = 25;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep += 1;
      // Ease-out curve: fast at start, slows near 100%
      const ratio = currentStep / steps;
      const eased = 1 - Math.pow(1 - ratio, 2.5);
      const nextProgress = Math.min(100, Math.round(eased * 100));
      setProgress(nextProgress);

      if (currentStep >= steps) {
        clearInterval(timer);
        // Small pause at 100% before hiding
        setTimeout(() => setHidden(true), 120);
        // Remove from DOM after transition completes
        setTimeout(() => setRemoved(true), 850);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration]);

  if (removed) return null;

  return (
    <div
      id="page-preloader"
      className={hidden ? "preloader-hidden" : ""}
      aria-hidden="true"
    >
      {/* Cinematic background */}
      <div className="absolute inset-0 overflow-hidden bg-[#05070b]">

        {/* Large atmospheric glow — static, no flicker */}
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.03] blur-[150px]" />

        {/* Ambient lights — use CSS animation not Tailwind animate-pulse to avoid reflow */}
        <div
          className="absolute -left-40 top-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.055] blur-[150px]"
          style={{ animation: "plrAmbient 5s ease-in-out infinite alternate" }}
        />
        <div
          className="absolute -right-40 bottom-1/4 h-[500px] w-[500px] rounded-full bg-amber-500/[0.045] blur-[150px]"
          style={{ animation: "plrAmbient 6s ease-in-out 1.5s infinite alternate-reverse" }}
        />

        {/* Fine grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "70px 70px",
          }}
        />

        {/* Cinematic horizontal light beams */}
        <div className="absolute left-0 top-[22%] h-px w-full bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent" />
        <div className="absolute left-0 bottom-[22%] h-px w-full bg-gradient-to-r from-transparent via-amber-400/12 to-transparent" />

        {/* Subtle scan line */}
        <div
          className="absolute left-0 h-px w-full bg-gradient-to-r from-transparent via-white/8 to-transparent"
          style={{ animation: "preloaderScan 3s linear infinite" }}
        />

        {/* Corner details */}
        <div className="absolute left-8 top-8 h-12 w-12 border-l border-t border-white/8" />
        <div className="absolute right-8 top-8 h-12 w-12 border-r border-t border-white/8" />
        <div className="absolute bottom-8 left-8 h-12 w-12 border-b border-l border-white/8" />
        <div className="absolute bottom-8 right-8 h-12 w-12 border-b border-r border-white/8" />
      </div>

      <div className="preloader-logo relative z-10 flex min-h-screen flex-col items-center justify-center px-6">

        {/* Small top label */}
        <div
          className="mb-10 flex items-center gap-4"
          style={{ animation: "plrFadeUp 0.6s cubic-bezier(.16,1,.3,1) 0.1s both", opacity: 0 }}
        >
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-400/50" />
          <span className="text-[9px] font-bold uppercase tracking-[0.45em] text-slate-400">
            ФОКУСЫ • ТРЮКИ • СЕКРЕТЫ
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-400/50" />
        </div>

        {/* Main logo stage */}
        <div className="relative" style={{ animation: "plrFadeUp 0.7s cubic-bezier(.16,1,.3,1) both", opacity: 0 }}>

          {/* Backlight */}
          <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.07] blur-[90px]" />

          {/* Rotating light accents */}
          <div
            className="absolute -inset-10 opacity-40"
            style={{ animation: "preloaderRotate 12s linear infinite" }}
          >
            <div className="absolute left-1/2 top-0 h-16 w-px -translate-x-1/2 bg-gradient-to-b from-cyan-300/50 to-transparent" />
            <div className="absolute bottom-0 left-1/2 h-16 w-px -translate-x-1/2 bg-gradient-to-t from-amber-300/40 to-transparent" />
          </div>

          {/* Logo — stable, no flicker */}
          <div className="relative z-10">
            <img
              src="/repload.webp"
              alt="Logo"
              className="preloader-logo-ring"
              style={{
                width: 250,
                height: 250,
                objectFit: "contain",
                willChange: "transform, filter",
                filter:
                  "drop-shadow(0 0 25px rgba(34,211,238,0.22)) drop-shadow(0 0 55px rgba(34,211,238,0.1))",
                animation: "preloaderLogoReveal 1s cubic-bezier(.16,1,.3,1) both",
              }}
            />
          </div>

          {/* Glowing dots — stable opacity (no animate-ping which causes flicker) */}
          <span
            className="absolute -right-4 top-8 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.9)]"
            style={{ animation: "plrDot 2.4s ease-in-out infinite" }}
          />
          <span
            className="absolute -left-6 bottom-12 h-1 w-1 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.9)]"
            style={{ animation: "plrDot 2.4s ease-in-out 0.8s infinite" }}
          />
          <span
            className="absolute right-8 -bottom-2 h-1 w-1 rounded-full bg-white shadow-[0_0_8px_white]"
            style={{ animation: "plrDot 2.4s ease-in-out 1.5s infinite" }}
          />
        </div>

        {/* Brand information */}
        <div
          className="mt-8 text-center"
          style={{ animation: "plrFadeUp 0.7s cubic-bezier(.16,1,.3,1) 0.25s both", opacity: 0 }}
        >
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.5em] text-amber-400/80">
            Максим Берестнев
          </div>

          <div className="preloader-title">
            Удиви друзей <span>трюком!</span>
          </div>
        </div>

        {/* Loading section */}
        <div
          className="mt-12 w-full max-w-[320px]"
          style={{ animation: "plrFadeUp 0.7s cubic-bezier(.16,1,.3,1) 0.4s both", opacity: 0 }}
        >
          <div className="mb-3 flex items-end justify-between">
            <span className="text-[8px] font-bold uppercase tracking-[0.35em] text-slate-500">
              ПОДГОТОВКА
            </span>
            <span className="font-mono text-[10px] font-bold tracking-wider text-cyan-300">
              {String(progress).padStart(3, "0")}%
            </span>
          </div>

          {/* Premium progress line */}
          <div className="relative h-[2px] w-full overflow-hidden bg-white/[0.07]">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-400 via-white to-amber-400 transition-[width] duration-75"
              style={{
                width: `${progress}%`,
                boxShadow: "0 0 10px rgba(34,211,238,0.6), 0 0 22px rgba(34,211,238,0.22)",
              }}
            />
            <div
              className="absolute top-0 h-full w-12 bg-white/40 blur-sm transition-[left] duration-75"
              style={{ left: `${Math.max(0, progress - 6)}%` }}
            />
          </div>

          <div className="mt-3 flex justify-between">
            <span className="text-[7px] uppercase tracking-[0.3em] text-slate-600">
              ВОЙДИ В МИР НЕВОЗМОЖНОГО
            </span>
            <span className="text-[7px] uppercase tracking-[0.3em] text-slate-600">
              2026
            </span>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes plrFadeUp {
          from { opacity: 0; transform: translateY(16px); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0);   }
        }

        @keyframes plrAmbient {
          from { opacity: 0.7; }
          to   { opacity: 1.0; }
        }

        @keyframes plrDot {
          0%,100% { opacity: 0.5; transform: scale(1);   }
          50%      { opacity: 1;   transform: scale(1.35); }
        }

        @keyframes preloaderLogoReveal {
          0% {
            opacity: 0;
            transform: scale(0.78) translateY(14px);
            filter: blur(10px) drop-shadow(0 0 0 transparent);
          }
          65% {
            opacity: 1;
            transform: scale(1.03) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0) drop-shadow(0 0 25px rgba(34,211,238,0.22)) drop-shadow(0 0 55px rgba(34,211,238,0.1));
          }
        }

        @keyframes preloaderRotate {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }

        @keyframes preloaderScan {
          0%   { top: 10%; opacity: 0;   }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.8; }
          100% { top: 90%; opacity: 0;   }
        }
      `}</style>
    </div>
  );
}