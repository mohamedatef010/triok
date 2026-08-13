import { useEffect, useState } from "react";

/**
 * PagePreloader
 * Features an ultra-premium logo assembly & glow reveal animation
 * matching the user's custom brand logo (МБ / Максим Берестнев).
 */
export function PagePreloader({ duration = 2200 }: { duration?: number }) {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    // Smooth progress counter from 0% to 100%
    const intervalTime = 30;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep += 1;
      const nextProgress = Math.min(100, Math.round((currentStep / steps) * 100));
      setProgress(nextProgress);

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => setHidden(true), 150);
        setTimeout(() => setRemoved(true), 900);
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

        {/* Large atmospheric glow */}
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.035] blur-[150px]" />

        {/* Moving ambient lights */}
        <div
          className="absolute -left-40 top-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.06] blur-[150px] animate-pulse"
          style={{ animationDuration: "4s" }}
        />

        <div
          className="absolute -right-40 bottom-1/4 h-[500px] w-[500px] rounded-full bg-amber-500/[0.05] blur-[150px] animate-pulse"
          style={{ animationDuration: "5s" }}
        />

        {/* Fine grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "70px 70px",
          }}
        />

        {/* Cinematic horizontal light beams */}
        <div className="absolute left-0 top-[22%] h-px w-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
        <div className="absolute left-0 bottom-[22%] h-px w-full bg-gradient-to-r from-transparent via-amber-400/15 to-transparent" />

        {/* Subtle scan line */}
        <div
          className="absolute left-0 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{
            animation: "preloaderScan 3s linear infinite",
          }}
        />

        {/* Corner details */}
        <div className="absolute left-8 top-8 h-12 w-12 border-l border-t border-white/10" />
        <div className="absolute right-8 top-8 h-12 w-12 border-r border-t border-white/10" />
        <div className="absolute bottom-8 left-8 h-12 w-12 border-b border-l border-white/10" />
        <div className="absolute bottom-8 right-8 h-12 w-12 border-b border-r border-white/10" />
      </div>

      <div className="preloader-logo relative z-10 flex min-h-screen flex-col items-center justify-center px-6">

        {/* Small top label */}
        <div className="mb-10 flex items-center gap-4 opacity-70">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-400/60" />
          <span className="text-[9px] font-bold uppercase tracking-[0.45em] text-slate-400">
            ФОКУСЫ • ТРЮКИ • СЕКРЕТЫ
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-400/60" />
        </div>

        {/* Main logo stage */}
        <div className="relative">

          {/* Backlight */}
          <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.08] blur-[90px]" />

          {/* Rotating light accents - NOT a circle/container */}
          <div
            className="absolute -inset-10 opacity-50"
            style={{
              animation: "preloaderRotate 12s linear infinite",
            }}
          >
            <div className="absolute left-1/2 top-0 h-16 w-px -translate-x-1/2 bg-gradient-to-b from-cyan-300/60 to-transparent" />
            <div className="absolute bottom-0 left-1/2 h-16 w-px -translate-x-1/2 bg-gradient-to-t from-amber-300/50 to-transparent" />
          </div>

          {/* Logo */}
          <div className="relative z-10">
            <img
              src="/repload.webp"
              alt="Logo"
              className="preloader-logo-ring"
              style={{
                width: 250,
                height: 250,
                objectFit: "contain",
                filter:
                  "drop-shadow(0 0 25px rgba(34,211,238,0.25)) drop-shadow(0 0 55px rgba(34,211,238,0.12))",
                animation: "preloaderLogoReveal 1.4s cubic-bezier(.16,1,.3,1) both",
              }}
            />
          </div>

          {/* Floating particles */}
          <span
            className="absolute -right-4 top-8 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_15px_rgba(34,211,238,1)] animate-ping"
          />

          <span
            className="absolute -left-6 bottom-12 h-1 w-1 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,1)] animate-ping"
            style={{ animationDelay: "0.7s" }}
          />

          <span
            className="absolute right-8 -bottom-2 h-1 w-1 rounded-full bg-white shadow-[0_0_10px_white] animate-ping"
            style={{ animationDelay: "1.2s" }}
          />
        </div>

        {/* Brand information */}
        <div className="mt-8 text-center">

          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.5em] text-amber-400/80">
            Максим Берестнев
          </div>

          <div className="preloader-title">
            Удиви друзей <span>трюком!</span>
          </div>

        </div>

        {/* Loading section */}
        <div className="mt-12 w-full max-w-[320px]">

          <div className="mb-3 flex items-end justify-between">
            <span className="text-[8px] font-bold uppercase tracking-[0.35em] text-slate-500">
              ПОДГОТОВКА
            </span>

            <span className="font-mono text-[10px] font-bold tracking-wider text-cyan-300">
              {String(progress).padStart(3, "0")}%
            </span>
          </div>

          {/* Premium progress line */}
          <div className="relative h-[2px] w-full overflow-hidden bg-white/[0.08]">

            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-400 via-white to-amber-400 transition-[width] duration-100"
              style={{
                width: `${progress}%`,
                boxShadow:
                  "0 0 12px rgba(34,211,238,0.7), 0 0 25px rgba(34,211,238,0.25)",
              }}
            />

            <div
              className="absolute top-0 h-full w-16 bg-white/50 blur-sm"
              style={{
                left: `${Math.max(0, progress - 8)}%`,
              }}
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
        @keyframes preloaderLogoReveal {
          0% {
            opacity: 0;
            transform: scale(0.72) translateY(18px);
            filter:
              blur(12px)
              drop-shadow(0 0 0 transparent);
          }

          60% {
            opacity: 1;
            transform: scale(1.04) translateY(0);
          }

          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter:
              blur(0)
              drop-shadow(0 0 25px rgba(34,211,238,0.25))
              drop-shadow(0 0 55px rgba(34,211,238,0.12));
          }
        }

        @keyframes preloaderRotate {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes preloaderScan {
          0% {
            top: 10%;
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          90% {
            opacity: 1;
          }

          100% {
            top: 90%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}