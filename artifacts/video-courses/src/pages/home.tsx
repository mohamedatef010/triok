import { useState, useRef, Fragment, useEffect, useCallback, useMemo } from "react";
import { useSEO } from "@/hooks/use-seo";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useGetFeaturedVideos, useGetVideoPlayback } from "@workspace/api-client-react";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import {
  Play,
  ArrowRight,
  Star,
  CheckCircle,
  Clock,
  Award,
  Sparkles,
  Video,
  X,
  Flame,
  Zap,
  Quote,
  Youtube,
  MessageSquare,
  BookOpen,
  Users,
  Compass,
  ImageIcon,
  Film,
} from "lucide-react";

import { SOCIAL_PLATFORMS, openSocialLink } from "@/components/ui/social-icons";
import { VideoGridSkeleton, ErrorState } from "@/components/ui/states";
import { Card, CardContent } from "@/components/ui/card";
import { EventsGallerySection } from "@/components/events-gallery-section";
import { InteractiveMagicSurpriseModal } from "@/components/interactive-magic-surprise-modal";

/* ── Visual assets ──
   n1.jpg is served from the public folder as /n1.jpg */
const HERO_IMAGE_SRC = "/n1.jpg";
const heroAvatar = "https://image.qwenlm.ai/public_source/eaa9d9e3-ae37-4110-9836-468770a4b316/12dd3bf23-8156-4de4-8ab4-1848d6d2d24b.png";
const authorAvatar = "/n12.png";

// Updated STATS according to new texts
const STATS = [
  { icon: Award, value: "10+ лет", label: "опыта в иллюзионном искусстве" },
  { icon: CheckCircle, value: "Практика", label: "фокусы, которые можно повторить" },
  { icon: Clock, value: "Пошагово", label: "от простых движений до полноценного трюка" },
];

// Updated marquee items
const MARQUEE_ITEMS = [
  "Фокусы", "Иллюзии", "Секреты магии", "Карточные трюки", "Ментальная магия",
  "Пошаговые уроки", "Мастер-классы", "Удивляй друзей", "Открывай мир иллюзий"
];

const WAVE_HEIGHTS = [10, 18, 12, 22, 16, 8, 20, 14, 24, 12, 18, 10, 22, 16, 8, 14, 24, 18, 12, 20, 10, 16, 22, 14, 8, 18, 12, 24, 16, 10, 20, 14, 18, 8, 22, 12, 16, 24, 10, 18];

/* ── Magic-props floating background layers (playing cards / wand / hat / coin) ──
   Items are PAUSED by default; they drift only while hovered, freeze in
   place when the mouse leaves, and resume from the same frame on re-hover. */
const MAGIC_LAYERS = [
  {
    depth: 16,
    items: [
      { type: "spark", top: "14%", left: "5%", size: 32, rot: -12, op: 0.24, delay: "-1s", dur: "9s" },
      { type: "coin", top: "30%", left: "16%", size: 22, rot: 8, op: 0.22, delay: "-3s", dur: "8s" },
      { type: "hat", top: "68%", left: "7%", size: 40, rot: -6, op: 0.23, delay: "-5s", dur: "10s" },
      { type: "wand", top: "82%", left: "24%", size: 46, rot: 18, op: 0.21, delay: "-2s", dur: "9.5s" },
      { type: "ring", top: "12%", left: "46%", size: 30, rot: 10, op: 0.2, delay: "-4s", dur: "8.5s" },
      { type: "fan", top: "58%", left: "44%", size: 40, rot: -8, op: 0.2, delay: "-6s", dur: "10s" },
      { type: "star", top: "24%", left: "88%", size: 24, rot: 0, op: 0.22, delay: "-2.5s", dur: "9s" },
      { type: "spark", top: "80%", left: "70%", size: 28, rot: 14, op: 0.21, delay: "-7s", dur: "8s" },
      { type: "cardSpade", top: "10%", left: "62%", size: 26, rot: -14, op: 0.22, delay: "-3.5s", dur: "9.5s" },
      { type: "cardHeart", top: "50%", left: "26%", size: 24, rot: 10, op: 0.2, delay: "-6.5s", dur: "8.5s" },
      { type: "cardClub", top: "90%", left: "44%", size: 26, rot: 6, op: 0.21, delay: "-1.5s", dur: "9s" },
    ],
  },
  {
    depth: 34,
    items: [
      { type: "fan", top: "6%", left: "28%", size: 52, rot: 10, op: 0.22, delay: "-2s", dur: "9s" },
      { type: "hat", top: "44%", left: "2%", size: 52, rot: -8, op: 0.24, delay: "-4s", dur: "10s" },
      { type: "ring", top: "62%", left: "36%", size: 38, rot: 16, op: 0.21, delay: "-1s", dur: "8.5s" },
      { type: "wand", top: "8%", left: "74%", size: 56, rot: -14, op: 0.22, delay: "-5s", dur: "9.5s" },
      { type: "coin", top: "86%", left: "50%", size: 26, rot: 0, op: 0.23, delay: "-3s", dur: "8s" },
      { type: "star", top: "36%", left: "92%", size: 32, rot: 8, op: 0.21, delay: "-6s", dur: "9s" },
      { type: "cardFan", top: "28%", left: "12%", size: 44, rot: -12, op: 0.24, delay: "-2.5s", dur: "10s" },
      { type: "cardMagic", top: "66%", left: "66%", size: 42, rot: 9, op: 0.23, delay: "-4.5s", dur: "9s" },
      { type: "cardDiamond", top: "14%", left: "56%", size: 34, rot: 14, op: 0.22, delay: "-7s", dur: "8.5s" },
    ],
  },
  {
    depth: 58,
    items: [
      { type: "spark", top: "20%", left: "40%", size: 44, rot: -10, op: 0.28, delay: "-2s", dur: "8s" },
      { type: "wand", top: "72%", left: "12%", size: 64, rot: 12, op: 0.24, delay: "-4s", dur: "9s" },
      { type: "fan", top: "10%", left: "66%", size: 58, rot: 6, op: 0.24, delay: "-6s", dur: "8.5s" },
      { type: "hat", top: "54%", left: "86%", size: 54, rot: -10, op: 0.24, delay: "-1s", dur: "9.5s" },
      { type: "ring", top: "88%", left: "64%", size: 34, rot: 0, op: 0.26, delay: "-5s", dur: "8s" },
      { type: "cardSpade", top: "40%", left: "56%", size: 48, rot: -16, op: 0.28, delay: "-3s", dur: "9s" },
      { type: "cardFan", top: "82%", left: "34%", size: 52, rot: 12, op: 0.25, delay: "-5.5s", dur: "10s" },
      { type: "cardHeart", top: "6%", left: "88%", size: 44, rot: 8, op: 0.26, delay: "-2s", dur: "8.5s" },
    ],
  },
];



/* ── Magic-prop SVG shapes for the ambient background (hover-to-drift + mouse parallax) ── */
function MagicFloatItem({ type, size }: { type: string; size: number }) {
  if (type === "spark") {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 2l3.5 11.5L35 17l-11.5 3.5L20 32l-3.5-11.5L5 17l11.5-3.5L20 2z" fill="#fbbf24" fillOpacity="0.35" stroke="#f59e0b" strokeOpacity="0.75" strokeWidth="1.5" />
      </svg>
    );
  }
  if (type === "star") {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 4l4.2 12.8H38l-10.5 7.6 4 12.8L20 29.6 8.5 37.2l4-12.8L2 16.8h13.8L20 4z" fill="#f59e0b" fillOpacity="0.28" stroke="#fbbf24" strokeOpacity="0.7" strokeWidth="1.2" />
      </svg>
    );
  }
  if (type === "ring") {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="18" stroke="#f59e0b" strokeOpacity="0.55" strokeWidth="2" strokeDasharray="4 6" />
        <circle cx="24" cy="24" r="10" stroke="#fbbf24" strokeOpacity="0.45" strokeWidth="1.5" />
        <circle cx="24" cy="8" r="3" fill="#fbbf24" fillOpacity="0.85" />
      </svg>
    );
  }
  if (type === "fan") {
    return (
      <svg width={size} height={size * 0.9} viewBox="0 0 90 80" fill="none">
        <rect x="8" y="18" width="34" height="52" rx="5" transform="rotate(-18 25 44)" fill="#101426" stroke="#f59e0b" strokeOpacity="0.45" strokeWidth="2" />
        <rect x="48" y="18" width="34" height="52" rx="5" transform="rotate(18 65 44)" fill="#101426" stroke="#f59e0b" strokeOpacity="0.45" strokeWidth="2" />
        <rect x="28" y="10" width="34" height="52" rx="5" fill="#101426" stroke="#f59e0b" strokeOpacity="0.65" strokeWidth="2" />
        <path d="M45 28c-3 5-8 6-8 11a8 8 0 0 0 16 0c0-5-5-6-8-11z" fill="#f59e0b" fillOpacity="0.55" />
      </svg>
    );
  }
  if (type === "wand") {
    return (
      <svg width={size} height={size * 0.24} viewBox="0 0 120 26" fill="none">
        <rect x="4" y="10" width="92" height="7" rx="3.5" fill="#1c1917" stroke="#f59e0b" strokeOpacity="0.6" strokeWidth="1.5" />
        <rect x="96" y="10" width="20" height="7" rx="3.5" fill="#fbbf24" fillOpacity="0.8" />
        <path d="M112 2l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#fbbf24" fillOpacity="0.9" />
      </svg>
    );
  }
  if (type === "hat") {
    return (
      <svg width={size} height={size * 0.8} viewBox="0 0 80 64" fill="none">
        <rect x="46" y="4" width="16" height="24" rx="3" transform="rotate(14 54 16)" fill="#e2e8f0" fillOpacity="0.9" />
        <path d="M22 52 V22 Q40 10 58 22 V52" fill="#1c1917" stroke="#f59e0b" strokeOpacity="0.6" strokeWidth="2" />
        <rect x="22" y="40" width="36" height="7" fill="#f59e0b" fillOpacity="0.7" />
        <ellipse cx="40" cy="52" rx="36" ry="8" fill="#1c1917" stroke="#f59e0b" strokeOpacity="0.6" strokeWidth="2" />
      </svg>
    );
  }
  /* ── Playing cards (sleight-of-hand / casino style) ── */
  if (
    type === "cardSpade" ||
    type === "cardHeart" ||
    type === "cardDiamond" ||
    type === "cardClub"
  ) {
    const suitMap: Record<string, { suit: string; rank: string }> = {
      cardSpade: { suit: "♠", rank: "A" },
      cardHeart: { suit: "♥", rank: "K" },
      cardDiamond: { suit: "♦", rank: "Q" },
      cardClub: { suit: "♣", rank: "J" },
    };
    const { suit, rank } = suitMap[type];
    return (
      <svg width={size} height={size * 1.45} viewBox="0 0 44 64" fill="none">
        <rect x="2" y="2" width="40" height="60" rx="6" fill="#0f0d13" stroke="#fbbf24" strokeOpacity="0.75" strokeWidth="1.6" />
        <rect x="6.5" y="6.5" width="31" height="51" rx="3.5" fill="none" stroke="#f59e0b" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3 4" />
        <text x="10" y="17" fontSize="10" fontWeight="900" fill="#fbbf24" fillOpacity="0.95">{rank}</text>
        <text x="10" y="28" fontSize="9" fill="#fbbf24" fillOpacity="0.9">{suit}</text>
        <text x="22" y="46" fontSize="20" textAnchor="middle" fill="#fbbf24" fillOpacity="0.9">{suit}</text>
        <text x="34" y="58" fontSize="10" fontWeight="900" textAnchor="end" fill="#fbbf24" fillOpacity="0.95" transform="rotate(180 33 54)">{rank}</text>
      </svg>
    );
  }
  /* ── Fan of three playing cards (sleight-of-hand flourish) ── */
  if (type === "cardFan") {
    return (
      <svg width={size} height={size * 0.95} viewBox="0 0 96 92" fill="none">
        <g transform="translate(12 10) rotate(-22 22 40)">
          <rect x="0" y="0" width="40" height="58" rx="6" fill="#0f0d13" stroke="#f59e0b" strokeOpacity="0.55" strokeWidth="1.6" />
          <text x="20" y="38" fontSize="16" textAnchor="middle" fill="#f59e0b" fillOpacity="0.8">♥</text>
        </g>
        <g transform="translate(42 10) rotate(22 22 40)">
          <rect x="0" y="0" width="40" height="58" rx="6" fill="#0f0d13" stroke="#f59e0b" strokeOpacity="0.55" strokeWidth="1.6" />
          <text x="20" y="38" fontSize="16" textAnchor="middle" fill="#f59e0b" fillOpacity="0.8">♣</text>
        </g>
        <g transform="translate(27 4)">
          <rect x="0" y="0" width="42" height="62" rx="6" fill="#141118" stroke="#fbbf24" strokeOpacity="0.85" strokeWidth="1.8" />
          <text x="21" y="40" fontSize="19" textAnchor="middle" fill="#fbbf24" fillOpacity="0.95">♠</text>
          <path d="M21 8l1.7 4.2 4.2 1.7-4.2 1.7L21 20l-1.7-4.4-4.2-1.7 4.2-1.7L21 8z" fill="#fbbf24" fillOpacity="0.8" />
        </g>
      </svg>
    );
  }
  /* ── Magic trick card (wand + sparkle motif — sleight of hand) ── */
  if (type === "cardMagic") {
    return (
      <svg width={size} height={size * 1.45} viewBox="0 0 44 64" fill="none">
        <rect x="2" y="2" width="40" height="60" rx="6" fill="#141118" stroke="#fbbf24" strokeOpacity="0.8" strokeWidth="1.6" />
        <rect x="6.5" y="6.5" width="31" height="51" rx="3.5" fill="none" stroke="#f59e0b" strokeOpacity="0.25" strokeWidth="1" />
        <rect x="10" y="32" width="24" height="4.6" rx="2.3" transform="rotate(-32 22 34)" fill="#1c1917" stroke="#fbbf24" strokeOpacity="0.9" strokeWidth="1.2" />
        <rect x="28.5" y="21" width="7" height="4.6" rx="2.3" transform="rotate(-32 32 23)" fill="#fbbf24" fillOpacity="0.95" />
        <path d="M14 12l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6 1.6-4z" fill="#fbbf24" fillOpacity="0.85" />
        <path d="M32 44l1.3 3.2 3.2 1.3-3.2 1.3-1.3 3.2-1.3-3.2-3.2-1.3 3.2-1.3 1.3-3.2z" fill="#fbbf24" fillOpacity="0.75" />
      </svg>
    );
  }
  /* coin */
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="16" fill="#f59e0b" fillOpacity="0.25" stroke="#fbbf24" strokeOpacity="0.8" strokeWidth="2" />
      <circle cx="20" cy="20" r="10" fill="none" stroke="#fbbf24" strokeOpacity="0.5" strokeWidth="1.5" />
      <path d="M20 12l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="#fbbf24" fillOpacity="0.8" />
    </svg>
  );
}

/* ── Stable dust particles (fixed seed so they never re-generate on re-render/scroll) ── */
const DUST_PARTICLES_DESKTOP = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: `${((i * 37 + 13) % 100)}%`,
  top: `${((i * 53 + 7) % 100)}%`,
  size: 1 + (i % 3) * 0.7,
  duration: 8 + (i % 8) * 2,
  delay: (i % 8),
  opacity: 0.15 + (i % 4) * 0.06,
}));
const DUST_PARTICLES_MOBILE = DUST_PARTICLES_DESKTOP.slice(0, 0); // none on mobile — saves GPU

/* ── Ambient Dust Particle Component ── */
function DustParticles() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const particles = isMobile ? DUST_PARTICLES_MOBILE : DUST_PARTICLES_DESKTOP;

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-amber-200 dust-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Sequentially drawn connector line (film ribbon between videos) ── */
function SpiralConnector({ active = false }: { active?: boolean }) {
  return (
    <div className="relative w-7 shrink-0 flex items-center justify-center">
      <svg className="w-full h-3 overflow-visible" viewBox="0 0 28 12" preserveAspectRatio="none">
        <line
          x1="2"
          y1="6"
          x2="26"
          y2="6"
          stroke="#f59e0b"
          strokeOpacity="0.65"
          strokeWidth="2"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100"
          style={{ strokeDashoffset: active ? 0 : 100, transition: "stroke-dashoffset .55s ease-out" }}
        />
      </svg>
      <span
        className={`absolute right-0 h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)] transition-opacity duration-500 ${active ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

function formatDuration(seconds?: number | null): string | null {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}ч ${m}мин`;
  }
  return `${m}мин`;
}

/** Minimal line-art top hat for the hero CTA */
function CtaTrickIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="17.25" rx="7.25" ry="2.1" />
      <path d="M8.25 16.75V10a3.75 3.75 0 0 1 7.5 0v6.75" />
      <path d="M9.25 12.75h5.5" />
    </svg>
  );
}

/** Authentic Magician Top Hat & Magic Wand icon (not AI-like sparkle) */
function MagicianHatWandIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Top Hat Brim */}
      <path d="M4 18h16" />
      {/* Top Hat Crown */}
      <path d="M7 18V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v9" />
      {/* Hat Ribbon */}
      <path d="M7 14h10" />
      {/* Magic Wand with tip glow */}
      <path d="m17 3-4 4" />
      <path d="M19 1.5v1.5" />
      <path d="M21.5 4h-1.5" />
    </svg>
  );
}

export function HomePage() {
  useSEO({
    description: "Удивительные фокусы и секретные трюки, которые помогут впечатлить друзей. Пошаговые объяснения, полезные материалы и уникальные секреты для начинающих и опытных фокусников.",
    canonical: "/",
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Классный Фокус",
        "url": "https://xn----7sb1acdcpkxafxk9g.xn--p1ai",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://xn----7sb1acdcpkxafxk9g.xn--p1ai/catalog?search={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Классный Фокус",
        "url": "https://xn----7sb1acdcpkxafxk9g.xn--p1ai",
        "logo": "https://xn----7sb1acdcpkxafxk9g.xn--p1ai/logo2.png"
      }
    ]
  });

  const { data: rawFeaturedVideos, isLoading, error } = useGetFeaturedVideos();
  const apiVideos = Array.isArray(rawFeaturedVideos) ? rawFeaturedVideos : [];

  // Hero Section Settings (managed by admin in /admm/hero-section)
  const { data: heroSettings } = useQuery<any>({
    queryKey: ["site-settings", "hero_section"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings/hero_section", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.value;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const hero = {
    badge1: heroSettings?.badge1 || "Искусство удивлять",
    badge2: heroSettings?.badge2 || "С трудоустройством",
    heading: heroSettings?.heading || "Научись фокусам, которые действительно хочется показать друзьям",
    subheading: heroSettings?.subheading || "Научись эффектным фокусам, раскрывай секреты иллюзионного искусства и удивляй друзей и близких. Понятные пошаговые уроки от профессионального фокусника.",
    ctaPrimaryText: heroSettings?.ctaPrimaryText || "Смотри секрет трюка",
    ctaPrimaryLink: heroSettings?.ctaPrimaryLink || "/catalog",
    ctaSecondaryText: heroSettings?.ctaSecondaryText || "Хочешь удивить друзей?",
    orbit1Value: heroSettings?.orbit1Value || "10+",
    orbit1Label: heroSettings?.orbit1Label || "лет в мире иллюзий",
    orbit2Title: heroSettings?.orbit2Title || "Видеоуроки",
    orbit2Subtitle: heroSettings?.orbit2Subtitle || "понятно и пошагово",
    orbit2Desc: heroSettings?.orbit2Desc || "Практический опыт выступлений и обучения",
    orbit3Title: heroSettings?.orbit3Title || "Первый фокус",
    orbit3Desc: heroSettings?.orbit3Desc || "Научись своему первому эффектному фокусу",
    orbit4Title: heroSettings?.orbit4Title || "Бесплатно",
    orbit4Subtitle: heroSettings?.orbit4Subtitle || "Попробуй первый урок",
    orbit5Title: heroSettings?.orbit5Title || "Для всех",
    orbit5Desc: heroSettings?.orbit5Desc || "от новичков до увлечённых магией",
    authorName: heroSettings?.authorName || "Максим Берестнев",
    authorRole: heroSettings?.authorRole || "профессиональный фокусник и преподаватель",
    stat1Value: heroSettings?.stat1Value || "10+ лет",
    stat1Label: heroSettings?.stat1Label || "опыта в иллюзионном искусстве",
    stat2Value: heroSettings?.stat2Value || "Практика",
    stat2Label: heroSettings?.stat2Label || "фокусы, которые можно повторить",
    stat3Value: heroSettings?.stat3Value || "Пошагово",
    stat3Label: heroSettings?.stat3Label || "от простых движений до полноценного трюка",
  };

  const dynamicMarquee = (heroSettings?.marqueeItemsText
    ? heroSettings.marqueeItemsText.split(",").map((s: string) => s.trim()).filter(Boolean)
    : null) || MARQUEE_ITEMS;

  const dynamicStats = [
    { icon: Award, value: hero.stat1Value, label: hero.stat1Label },
    { icon: CheckCircle, value: hero.stat2Value, label: hero.stat2Label },
    { icon: Clock, value: hero.stat3Value, label: hero.stat3Label },
  ];

  // Only show real videos added by admin via API
  const displayVideos = apiVideos;

  // Active Video Modal State
  const [activePreviewVideo, setActivePreviewVideo] = useState<any | null>(null);
  const [showMagicSurprise, setShowMagicSurprise] = useState(false);

  /* ── Hero poster image: n1.jpg from public folder ── */
  const heroImgSrc = HERO_IMAGE_SRC;

  /* ── CTA section: mouse-follow spotlight & orbit rings ── */
  const ctaCardRef = useRef<HTMLDivElement | null>(null);
  const [ctaPointer, setCtaPointer] = useState({ x: 50, y: 50 });

  const handleCtaPointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ctaCardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCtaPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  /* ── Hero: Enhanced smooth mouse-parallax (professional & eye-comfortable) ── */
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const bgLayersRef = useRef<(HTMLDivElement | null)[]>([]);
  const heroImageRef = useRef<HTMLDivElement | null>(null);
  const lightBeamRef = useRef<HTMLDivElement | null>(null);
  const parallaxTarget = useRef({ x: 0, y: 0 });
  const parallaxCurrent = useRef({ x: 0, y: 0 });
  const parallaxVelocity = useRef({ x: 0, y: 0 });

  const handleHeroMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (typeof window !== "undefined" && !window.matchMedia("(pointer: fine)").matches) return;
    const rect = heroSectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Smoother normalized coordinates with reduced sensitivity
    parallaxTarget.current = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 1.2, // Reduced range for comfort
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 0.8, // Even less vertical movement
    };
  }, []);

  const handleHeroMouseLeave = useCallback(() => {
    parallaxTarget.current = { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    // Only run continuous parallax loop on desktop devices with fine pointer
    if (typeof window !== "undefined" && !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    let raf = 0;
    const depths = [10, 22, 40]; // Reduced depths for subtler movement
    const smoothingFactor = 0.035; // Very smooth interpolation

    const tick = () => {
      // Calculate velocity for momentum effect
      const targetX = parallaxTarget.current.x;
      const targetY = parallaxTarget.current.y;

      parallaxVelocity.current.x = (targetX - parallaxCurrent.current.x) * smoothingFactor;
      parallaxVelocity.current.y = (targetY - parallaxCurrent.current.y) * smoothingFactor;

      parallaxCurrent.current.x += parallaxVelocity.current.x;
      parallaxCurrent.current.y += parallaxVelocity.current.y;

      // Apply to background layers with natural-feeling depth
      bgLayersRef.current.forEach((layerEl, layerIndex) => {
        if (!layerEl) return;
        const layerDepth = depths[layerIndex] ?? 15;
        const layerRot = parallaxCurrent.current.x * (layerIndex + 1) * 0.25; // Less rotation
        const tx = parallaxCurrent.current.x * layerDepth;
        const ty = parallaxCurrent.current.y * layerDepth;
        layerEl.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${layerRot}deg)`;
      });

      // Apply subtle movement to hero image container (creates parallax against background)
      if (heroImageRef.current) {
        const imgTx = parallaxCurrent.current.x * -6;
        const imgTy = parallaxCurrent.current.y * -4;
        const imgRot = parallaxCurrent.current.x * -0.3;
        heroImageRef.current.style.transform = `translate3d(${imgTx}px, ${imgTy}px, 0) rotate(${imgRot}deg)`;
      }

      // Move the light beam with the mouse for realistic lighting
      if (lightBeamRef.current && heroSectionRef.current) {
        const lightX = 50 + parallaxCurrent.current.x * 15;
        const lightY = 50 + parallaxCurrent.current.y * 10;
        lightBeamRef.current.style.background = `radial-gradient(ellipse 50% 70% at ${lightX}% ${lightY}%, rgba(251,191,36,0.08) 0%, transparent 70%)`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── Courses spiral: sequential reveal — video appears, then a line grows to the next one ── */
  const spiralRef = useRef<HTMLDivElement | null>(null);
  const [spiralStep, setSpiralStep] = useState(-1);

  useEffect(() => {
    // On mobile devices, reveal all course cards immediately without delay
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSpiralStep(99);
      return;
    }

    const el = spiralRef.current;
    if (!el) return;
    let spiralInterval: ReturnType<typeof setInterval> | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && spiralInterval === null) {
            let stepCounter = 0;
            setSpiralStep(0);
            spiralInterval = setInterval(() => {
              stepCounter += 1;
              setSpiralStep(stepCounter);
              if (stepCounter >= 14 && spiralInterval) {
                clearInterval(spiralInterval);
              }
            }, 320);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (spiralInterval) clearInterval(spiralInterval);
    };
  }, []);

  // Card i appears at step i*2, the line leading to it at step i*2 - 1
  const isCardVisible = (spiralIdx: number) => spiralStep >= 90 || spiralStep >= spiralIdx * 2;
  const isLinkVisible = (spiralIdx: number) => spiralStep >= 90 || spiralStep >= spiralIdx * 2 - 1;

  /* ── Course card renderer (shared between mobile grid & desktop spiral flow) ── */
  const renderCourseCard = (video: any) => {
    const durationText = video.duration || formatDuration(video.durationSeconds);
    return (
      <>
        {/* Thumbnail / Video Preview Overlay */}
        <div className="relative aspect-video overflow-hidden bg-slate-950">
          <img
            src={video.thumbnailUrl || "https://image.qwenlm.ai/public_source/2d826fc3-d8ca-4fdd-afe7-1a198c300694/19903dcea-c171-465f-b4af-c85e8b69b3a5.png"}
            alt={video.title}
            className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-108"
          />

          {/* Dark Vignette Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300" />

          {/* Play Button Overlay - now navigates directly to video detail page */}
          <Link
            href={`/video/${video.id}`}
            className="absolute inset-0 flex items-center justify-center group/btn focus:outline-none"
            title="Смотреть курс"
          >
            <div className="h-14 w-14 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-400/40 group-hover/btn:scale-115 transition-transform duration-300">
              <Play className="h-6 w-6 fill-current ml-1" />
            </div>
          </Link>

          {/* Discount Badge */}
          {video.discountPrice && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-amber-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-lg border border-white/20">
              -{Math.round((1 - video.discountPrice / video.price) * 100)}%
            </div>
          )}

          {/* Category Pill */}
          {video.categoryName && (
            <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-amber-400 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border border-amber-400/30">
              {video.categoryName}
            </div>
          )}

          {/* Duration badge */}
          {durationText && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-semibold text-white/90 bg-slate-950/70 backdrop-blur-md px-2 py-0.5 rounded-md">
              <Clock className="h-3 w-3 text-amber-400" /> {durationText}
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-5 flex flex-col justify-between flex-grow">
          <div>
            <Link href={`/video/${video.id}`}>
              <h3 className="font-bold text-base line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200 mb-2 cursor-pointer">
                {video.title}
              </h3>
            </Link>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <div className="flex items-center text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                <Star className="h-3.5 w-3.5 fill-current mr-1 text-amber-400" />
                <span>{video.averageRating ? Number(video.averageRating).toFixed(1) : "0.0"}</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span>{video.reviewCount ?? 0} отзывов</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-between mt-auto">
            <div className="flex items-baseline gap-2">
              {video.discountPrice ? (
                <>
                  <span className="font-black text-lg text-primary">{video.discountPrice} ₽</span>
                  <span className="text-xs text-muted-foreground line-through">{video.price} ₽</span>
                </>
              ) : (
                <span className="font-black text-lg text-primary">{video.price} ₽</span>
              )}
            </div>

            <Link href={`/video/${video.id}`}>
              <Button size="sm" variant="ghost" className="text-xs font-bold text-amber-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-full">
                Подробнее &rarr;
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">

      {/* ── Global decorative keyframes (Enhanced) ── */}
      <style>{`
        @keyframes heroFadeUp {
          0% { opacity: 0; transform: translate3d(0, 36px, 0) scale(0.97); filter: blur(8px); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0px); }
        }
        @keyframes heroFadeLeft {
          0% { opacity: 0; transform: translate3d(-48px, 0, 0) scale(0.98); filter: blur(8px); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0px); }
        }
        @keyframes heroFadeRight {
          0% { opacity: 0; transform: translate3d(48px, 0, 0) scale(0.98); filter: blur(8px); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0px); }
        }
        @keyframes heroFadeDown {
          0% { opacity: 0; transform: translate3d(0, -32px, 0) scale(0.97); filter: blur(8px); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0px); }
        }
        @keyframes heroZoomIn {
          0% { opacity: 0; transform: translate3d(0, 24px, 0) scale(0.94); filter: blur(12px); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0px); }
        }
        @keyframes heroChipEntrance {
          0% { opacity: 0; transform: translate3d(32px, 16px, 0) scale(0.88); filter: blur(8px); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0px); }
        }
        @keyframes marqueeScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes waveBarAnim { 0%,100% { transform: scaleY(0.25); } 50% { transform: scaleY(1); } }
        @keyframes floatYAnim { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes cardFlyAnimV2 {
          0%,100% { transform: translateY(0) rotate(var(--fly-rot, 0deg)); }
          25% { transform: translateY(-8px) rotate(calc(var(--fly-rot, 0deg) + 2deg)); }
          50% { transform: translateY(-14px) rotate(var(--fly-rot, 0deg)); }
          75% { transform: translateY(-6px) rotate(calc(var(--fly-rot, 0deg) - 2deg)); }
        }
        @keyframes magicDrift {
          0%,100% { transform: translateY(0) rotate(var(--rot, 0deg)); }
          50% { transform: translateY(-16px) rotate(calc(var(--rot, 0deg) + 8deg)); }
        }
        @keyframes playheadAnim { 0% { left: 3%; } 100% { left: 94%; } }
        @keyframes shineSweep { 0% { transform: translateX(-160%) skewX(-18deg); } 55%,100% { transform: translateX(280%) skewX(-18deg); } }
        @keyframes gradientFlow { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes slowSpinAnim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slowSpinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes dashMove { from { stroke-dashoffset: 120; } to { stroke-dashoffset: 0; } }
        @keyframes dustDrift {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          15% { opacity: var(--dust-op, 0.3); }
          50% { transform: translate(calc(var(--dx, 20px)), calc(var(--dy, -40px))) scale(1.1); }
          85% { opacity: var(--dust-op, 0.3); }
          100% { transform: translate(calc(var(--dx, 20px) * 2), calc(var(--dy, -40px) * 2)) scale(0.8); opacity: 0; }
        }
        @keyframes heroImgBreath {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.01); }
        }
        @keyframes lightPulse {
          0%,100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }
        @keyframes beamFlicker {
          0%,100% { opacity: 0.55; }
          45% { opacity: 0.85; }
          60% { opacity: 0.7; }
        }
        @keyframes filmGrainShift {
          0% { transform: translate(0, 0); }
          10% { transform: translate(-1px, 1px); }
          20% { transform: translate(1px, -1px); }
          30% { transform: translate(-1px, 0); }
          40% { transform: translate(1px, 1px); }
          50% { transform: translate(0, -1px); }
          60% { transform: translate(-1px, 1px); }
          70% { transform: translate(1px, 0); }
          80% { transform: translate(0, 1px); }
          90% { transform: translate(-1px, -1px); }
          100% { transform: translate(0, 0); }
        }
        .hero-anim { opacity: 0; animation: heroFadeUp 1s cubic-bezier(.16,1,.3,1) forwards; will-change: opacity, transform, filter; }
        .hero-anim-up { opacity: 0; animation: heroFadeUp 1s cubic-bezier(.16,1,.3,1) forwards; will-change: opacity, transform, filter; }
        .hero-anim-left { opacity: 0; animation: heroFadeLeft 1s cubic-bezier(.16,1,.3,1) forwards; will-change: opacity, transform, filter; }
        .hero-anim-right { opacity: 0; animation: heroFadeRight 1.05s cubic-bezier(.16,1,.3,1) forwards; will-change: opacity, transform, filter; }
        .hero-anim-down { opacity: 0; animation: heroFadeDown 0.9s cubic-bezier(.16,1,.3,1) forwards; will-change: opacity, transform, filter; }
        .hero-anim-zoom { opacity: 0; animation: heroZoomIn 1.1s cubic-bezier(.16,1,.3,1) forwards; will-change: opacity, transform, filter; }
        /* Chip entrance: slides in + blur away, then float loop kicks in */
        .hero-chip-entry {
          opacity: 0;
          animation: heroChipEntrance 0.95s cubic-bezier(.16,1,.3,1) forwards;
          will-change: opacity, transform, filter;
        }
        /* When float-chip is combined with hero-chip-entry, override to sequence both animations:
           first the entrance (0.95s), then the float loop starts after that */
        .float-chip.hero-chip-entry {
          animation: heroChipEntrance 0.95s cubic-bezier(.16,1,.3,1) forwards,
                     floatYAnim 5s ease-in-out 1.5s infinite;
        }
        .marquee-track { animation: marqueeScroll 32s linear infinite; }
        .wave-bar { animation: waveBarAnim 1.1s ease-in-out infinite; transform-origin: bottom; }
        .float-chip { animation: floatYAnim 5s ease-in-out infinite; }
        .fly-card-v2 { animation: cardFlyAnimV2 7s ease-in-out infinite; }
        /* Magic props: paused by default → drift only while hovered,
           freeze in place on leave, resume from same frame on re-hover */
        .magic-float {
          display: inline-block;
          animation: magicDrift var(--dur, 10s) ease-in-out infinite;
          animation-play-state: paused;
          transition: opacity .35s ease, filter .35s ease, transform .35s ease;
          cursor: pointer;
          will-change: transform;
        }
        .magic-float:hover {
          animation-play-state: running;
          opacity: calc(var(--base-op, 0.18) + 0.25);
          filter: drop-shadow(0 0 18px rgba(251,191,36,0.6));
          transform: scale(1.15);
        }
        .playhead-line { animation: playheadAnim 9s linear infinite alternate; }
        .slow-spin { animation: slowSpinAnim 30s linear infinite; }
        .slow-spin-reverse { animation: slowSpinReverse 22s linear infinite; }
        .dash-anim { stroke-dasharray: 6 6; animation: dashMove 3s linear infinite; }
        .btn-shine { position: relative; overflow: hidden; }
        .btn-shine::after { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 38%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
          transform: translateX(-160%) skewX(-18deg); animation: shineSweep 3.4s ease-in-out infinite; }
        .text-flow-gradient { background-size: 200% 200%; animation: gradientFlow 5s ease infinite; }
        .dust-particle { animation: dustDrift var(--dur, 12s) ease-in-out infinite; }
        .hero-img-breath { animation: heroImgBreath 6s ease-in-out infinite; }
        .light-pulse { animation: lightPulse 4s ease-in-out infinite; }
        .stage-beam { animation: beamFlicker 5.5s ease-in-out infinite; }
        .film-grain { animation: filmGrainShift 0.4s steps(2) infinite; }

        /* Smooth cursor tracking for hero */
        .hero-section {
          perspective: 1200px;
          perspective-origin: center;
        }
        .hero-img-container {
          transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: transform;
          transform-style: preserve-3d;
        }
        .parallax-layer {
          will-change: transform;
          transition: transform 0.1s linear;
          backface-visibility: hidden;
        }
        @media (max-width: 768px) {
          /* ── Mobile Performance: disable all heavy GPU effects ── */
          .film-grain { display: none !important; }
          .magic-float { display: none !important; }
          .dust-particle { display: none !important; }
          .stage-beam { display: none !important; }
          .light-pulse { animation: none !important; }
          .slow-spin { animation: none !important; }
          .slow-spin-reverse { animation: none !important; }
          .btn-shine::after { display: none !important; }
          .hero-img-breath { animation: none !important; }
          .hero-img-container {
            will-change: auto !important;
            transform: none !important;
            transition: none !important;
          }
          .parallax-layer {
            will-change: auto !important;
            transform: none !important;
            transition: none !important;
          }
          .hero-section { perspective: none !important; }
          /* Keep entrance animations but remove filter:blur on mobile (very expensive) */
          .hero-anim, .hero-anim-up, .hero-anim-left, .hero-anim-right, .hero-anim-down, .hero-anim-zoom {
            animation-duration: 0.4s !important;
          }
          .hero-anim { animation-name: heroFadeUpMobile !important; }
          .hero-anim-up { animation-name: heroFadeUpMobile !important; }
          .hero-anim-left { animation-name: heroFadeUpMobile !important; }
          .hero-anim-right { animation-name: heroFadeUpMobile !important; }
          .hero-anim-down { animation-name: heroFadeUpMobile !important; }
          .hero-anim-zoom { animation-name: heroFadeUpMobile !important; }
          .hero-chip-entry { animation-duration: 0.35s !important; }
          .float-chip.hero-chip-entry {
            animation: heroFadeUpMobile 0.35s cubic-bezier(.16,1,.3,1) forwards,
                       floatYAnim 6s ease-in-out 0.5s infinite !important;
          }
        }
        /* Lightweight mobile entrance (no blur filter) */
        @keyframes heroFadeUpMobile {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 1023px) {
          .mobile-hero-img-mask {
            -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,0.5) 78%, rgba(0,0,0,0) 98%);
            mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,0.5) 78%, rgba(0,0,0,0) 98%);
          }
        }
      `}</style>

      {/* ── Hero Section (Enhanced Realistic Dark Magic-Show) ── */}
      <section
        ref={heroSectionRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="hero-section relative min-h-[94vh] lg:min-h-[860px] flex items-center overflow-hidden pt-24 pb-24 bg-gradient-to-b from-amber-50/90 via-stone-100 to-amber-50/70 dark:from-[#0d0b14] dark:via-[#0a0908] dark:to-[#0f0a08] text-slate-900 dark:text-white border-b border-amber-500/20 dark:border-amber-500/10"
      >

        {/* Realistic layered background with depth (dark mode extra layer) */}
        <div className="absolute inset-0 hidden dark:block bg-gradient-to-b from-[#0d0b14] via-[#0a0908] to-[#0f0a08]" />

        {/* ── EXTRA STAGE ATMOSPHERE: spotlight cones, golden halo & stage-floor glow ── */}
        <div
          className="absolute -top-44 left-1/2 -translate-x-1/2 w-[1500px] h-[720px] pointer-events-none light-pulse"
          style={{ background: "radial-gradient(ellipse 55% 45% at 50% 0%, rgba(245,158,11,0.13), transparent 70%)" }}
        />
        <div
          className="stage-beam absolute -top-28 left-[10%] w-[380px] h-[840px] pointer-events-none"
          style={{
            background: "linear-gradient(195deg, rgba(251,191,36,0.16), rgba(251,191,36,0.05) 55%, transparent 75%)",
            clipPath: "polygon(44% 0, 56% 0, 100% 100%, 0% 100%)",
            filter: "blur(20px)",
            transform: "rotate(16deg)",
          }}
        />
        <div
          className="stage-beam absolute -top-28 right-[10%] w-[380px] h-[840px] pointer-events-none"
          style={{
            background: "linear-gradient(165deg, rgba(251,191,36,0.16), rgba(251,191,36,0.05) 55%, transparent 75%)",
            clipPath: "polygon(44% 0, 56% 0, 100% 100%, 0% 100%)",
            filter: "blur(20px)",
            transform: "rotate(-16deg)",
            animationDelay: "2.2s",
          }}
        />
        {/* Rich golden halo behind the poster side */}
        <div className="absolute top-1/4 right-[-180px] w-[560px] h-[560px] bg-amber-400/10 rounded-full blur-[150px] pointer-events-none light-pulse" style={{ animationDelay: "1.2s" }} />
        {/* Stage-floor glow rising behind the stats bar */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1100px] h-[260px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse 50% 65% at 50% 100%, rgba(245,158,11,0.12), transparent 72%)" }}
        />

        {/* Cinematic film grain overlay for realism */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none film-grain mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.9 0 0 0 0 0.7 0 0 0 0 0.3 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Faint static suit texture — subtle */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cg fill='%23f59e0b' font-family='serif' font-size='30'%3E%3Ctext x='18' y='46'%3E%E2%99%A0%3C/text%3E%3Ctext x='112' y='86'%3E%E2%99%A5%3C/text%3E%3Ctext x='40' y='140'%3E%E2%99%A3%3C/text%3E%3Ctext x='132' y='166'%3E%E2%99%A6%3C/text%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "180px 180px"
          }}
        />

        {/* Mouse-parallax floating MAGIC PROPS (playing cards / wand / hat / coin).
            Each prop drifts only while hovered; on mouse-leave it freezes in
            place and resumes from the same frame on the next hover. */}
        {MAGIC_LAYERS.map((layer, layerIndex) => (
          <div
            key={layerIndex}
            ref={(el) => { bgLayersRef.current[layerIndex] = el; }}
            className="parallax-layer absolute -inset-16 pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {layer.items.map((item, itemIndex) => (
              <span
                key={itemIndex}
                className="magic-float absolute leading-none select-none pointer-events-auto"
                style={{
                  top: item.top,
                  left: item.left,
                  opacity: item.op,
                  animationDelay: item.delay,
                  ["--dur" as any]: item.dur,
                  ["--rot" as any]: `${item.rot}deg`,
                  ["--base-op" as any]: item.op,
                }}
                title="✦"
              >
                <MagicFloatItem type={item.type} size={item.size} />
              </span>
            ))}
          </div>
        ))}

        {/* Ambient gold glows — softer, more realistic */}
        <div className="absolute top-[-140px] right-[-120px] w-[620px] h-[620px] bg-amber-500/8 rounded-full blur-[180px] pointer-events-none light-pulse" />
        <div className="absolute bottom-[-160px] left-[-120px] w-[520px] h-[520px] bg-amber-600/5 rounded-full blur-[180px] pointer-events-none light-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/3 left-[-200px] w-[400px] h-[400px] bg-indigo-900/20 rounded-full blur-[160px] pointer-events-none" />

        {/* Dynamic mouse-following light beam */}
        <div
          ref={lightBeamRef}
          className="absolute inset-0 pointer-events-none z-[2] transition-all duration-300 ease-out"
          style={{ background: `radial-gradient(ellipse 50% 70% at 50% 50%, rgba(251,191,36,0.06) 0%, transparent 70%)` }}
        />

        {/* Floating dust particles for atmosphere */}
        <DustParticles />

        {/* Professional cinematic vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(255,255,255,0.35)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)] pointer-events-none z-[2]" />

        {/* Top and bottom edge gradients for natural blend */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/70 dark:from-black/60 to-transparent pointer-events-none z-[2]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-stone-100/90 dark:from-black/80 to-transparent pointer-events-none z-[2]" />

        <div className="container relative z-30 px-4 mx-auto w-full">
          {/* items-start: верх постера n1.jpg ровно совпадает с верхом левой колонки («Профессия…») */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

            {/* ── Left Column: value proposition (bottom margin = safe zone for the stats bar) ── */}
            <div className="lg:col-span-6 xl:col-span-5 text-left flex flex-col items-start lg:mb-28">

              {/* Category badges - updated texts */}
              <div className="flex flex-wrap items-center gap-2 mb-7 hero-anim-down" style={{ animationDelay: "0.05s" }}>
                {hero.badge1 && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-lg shadow-lg shadow-amber-500/20"
                    style={{
                      fontFamily: heroSettings?.styles?.badge1?.fontFamily || undefined,
                      color: heroSettings?.styles?.badge1?.color || undefined,
                      background: heroSettings?.styles?.badge1?.bgColor || undefined,
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> {hero.badge1}
                  </span>
                )}
                {hero.badge2 && (
                  <span
                    className="px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider bg-white/80 border border-slate-200/80 text-slate-700 dark:bg-white/5 dark:border-white/15 dark:text-slate-200 rounded-lg shadow-sm backdrop-blur-sm"
                    style={{
                      fontFamily: heroSettings?.styles?.badge2?.fontFamily || undefined,
                      color: heroSettings?.styles?.badge2?.color || undefined,
                      background: heroSettings?.styles?.badge2?.bgColor || undefined,
                    }}
                  >
                    {hero.badge2}
                  </span>
                )}
              </div>

              {/* Massive, High-Impact Typography - dynamic heading */}
              <h1
                className="text-4xl md:text-5xl lg:text-[58px] xl:text-[64px] font-black text-slate-900 dark:text-white tracking-tight leading-[1.08] mb-6 hero-anim-left"
                style={{
                  animationDelay: "0.15s",
                  fontFamily: heroSettings?.styles?.heading?.fontFamily || undefined,
                  color: heroSettings?.styles?.heading?.color || undefined,
                }}
              >
                {hero.heading}
              </h1>

              {/* Benefit subtext - dynamic */}
              <p
                className="text-lg md:text-xl text-slate-600 dark:text-slate-300/90 mb-9 max-w-xl leading-relaxed font-medium hero-anim-left"
                style={{
                  animationDelay: "0.25s",
                  fontFamily: heroSettings?.styles?.subheading?.fontFamily || undefined,
                  color: heroSettings?.styles?.subheading?.color || undefined,
                }}
              >
                {hero.subheading}
              </p>

              {/* Bold CTAs - dynamic button text */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-10 hero-anim-up" style={{ animationDelay: "0.35s" }}>
                <Button
                  size="lg"
                  className="btn-shine h-14 px-8 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:opacity-90 shadow-xl shadow-amber-500/25 transition-all text-base border-none"
                  style={{
                    fontFamily: heroSettings?.styles?.ctaPrimary?.fontFamily || undefined,
                    color: heroSettings?.styles?.ctaPrimary?.color || undefined,
                    background: heroSettings?.styles?.ctaPrimary?.bgColor || undefined,
                  }}
                  asChild
                >
                  <Link href={hero.ctaPrimaryLink || "/catalog"} className="inline-flex items-center gap-2">
                    <CtaTrickIcon className="h-4 w-4 shrink-0" />
                    {hero.ctaPrimaryText}
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-70" />
                  </Link>
                </Button>
                <Button
                  size="lg" variant="outline"
                  className="h-14 px-8 rounded-xl bg-white/60 text-slate-900 border-slate-300/80 hover:bg-amber-400/15 hover:border-amber-500/50 dark:bg-transparent dark:text-white dark:border-white/25 dark:hover:bg-amber-400/10 dark:hover:border-amber-400/60 shadow-sm transition-all text-base font-bold backdrop-blur-sm cursor-pointer"
                  style={{
                    fontFamily: heroSettings?.styles?.ctaSecondary?.fontFamily || undefined,
                    color: heroSettings?.styles?.ctaSecondary?.color || undefined,
                    background: heroSettings?.styles?.ctaSecondary?.bgColor || undefined,
                  }}
                  onClick={() => setShowMagicSurprise(true)}
                >
                  <Play className="h-4 w-4 mr-2 text-amber-400 fill-current" /> {hero.ctaSecondaryText}
                </Button>
              </div>

            </div>

            {/* ── Right Column: poster + floating UI cards (clean non-overlapping slots) ──
                Верх постера совпадает с верхом левого текста, а низ доходит до панели
                статистики («~10 лет…») и аккуратно уходит за неё. */}
            <div className="lg:col-span-6 xl:col-span-7 relative hero-anim-right lg:-ml-6 xl:-ml-10" style={{ animationDelay: "0.3s" }}>
              <div
                ref={heroImageRef}
                className="hero-img-container relative mx-auto max-w-[900px] h-[420px] sm:h-[520px] lg:h-[720px] xl:h-[780px]"
              >

                {/* Soft golden aura behind image */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] sm:w-[500px] sm:h-[500px] bg-amber-500/12 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] bg-amber-400/8 rounded-full blur-[80px] pointer-events-none" />

                {/* Main poster image */}
                <div className="absolute inset-0 w-full h-full hero-img-breath flex items-start justify-center -top-16 sm:-top-24 lg:-top-32">
                  {/* Natural size background image behind person's head */}
                  <img
                    src="/n13.webp"
                    alt="Background text"
                    className="absolute z-0 -top-8 sm:-top-12 left-1/2 -translate-x-1/2 -rotate-6 max-w-full h-auto object-contain pointer-events-none"
                    loading="eager"
                    decoding="async"
                  />
                  <img
                    src={HERO_IMAGE_SRC}
                    alt={hero.authorName}
                    className="relative z-10 max-h-[110%] w-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] mobile-hero-img-mask"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>

                {/* ── Outer Orbit Ring Line ── */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[290px] xs:w-[340px] sm:w-[540px] md:w-[640px] lg:w-[700px] h-[280px] xs:h-[320px] sm:h-[500px] md:h-[580px] lg:h-[620px] rounded-full border border-dashed border-amber-400/20 pointer-events-none slow-spin" />

                {/* ── 5 BALANCED FLOATING ORBIT CARDS (dynamic texts) ── */}

                {/* 1. Bottom-Center on mobile / Top-Right on desktop: "10+" */}
                <div
                  className="float-chip hero-chip-entry absolute bottom-4 left-1/2 -translate-x-1/2 z-30 rounded-xl sm:rounded-2xl bg-[#151310]/95 backdrop-blur-xl border border-amber-500/30 shadow-xl px-2.5 py-1.5 xs:px-4 xs:py-3 flex items-center gap-1.5 xs:gap-2.5 rotate-2 md:bottom-auto md:top-10 lg:top-12 md:left-auto md:-translate-x-0 md:right-0 lg:right-6"
                  style={{
                    animation: `heroChipEntrance 0.95s 0.5s cubic-bezier(.16,1,.3,1) forwards, floatYAnim 5s 2s ease-in-out infinite`,
                    fontFamily: heroSettings?.styles?.orbitCards?.fontFamily || undefined,
                  }}
                >
                  <Star className="h-3.5 w-3.5 xs:h-5 w-5 text-amber-400 fill-current" />
                  <div className="leading-tight">
                    <div
                      className="text-xs xs:text-sm font-black text-white"
                      style={{ color: heroSettings?.styles?.orbitCards?.color || undefined }}
                    >
                      {hero.orbit1Value}
                    </div>
                    <div
                      className="text-[8px] xs:text-[10px] font-semibold text-slate-400"
                      style={{ color: heroSettings?.styles?.orbitCards?.secondaryColor || undefined }}
                    >
                      {hero.orbit1Label}
                    </div>
                  </div>
                </div>

                {/* 2. Mid-Right: Experience → Video lessons */}
                <div
                  className="float-chip hero-chip-entry absolute top-[100px] right-0 xs:right-2 z-30 w-28 xs:w-32 sm:w-44 rounded-xl sm:rounded-2xl bg-[#151310]/95 backdrop-blur-xl border border-amber-500/30 shadow-xl p-2.5 xs:p-3 sm:p-3.5 -rotate-1 md:top-[210px] lg:top-[230px] md:right-0 lg:right-6"
                  style={{
                    animation: `heroChipEntrance 0.95s 0.8s cubic-bezier(.16,1,.3,1) forwards, floatYAnim 5s 2.4s ease-in-out infinite`,
                    fontFamily: heroSettings?.styles?.orbitCards?.fontFamily || undefined,
                  }}
                >
                  <div
                    className="text-xs xs:text-sm sm:text-base font-black text-amber-400 leading-none mb-0.5 xs:mb-1"
                    style={{ color: heroSettings?.styles?.orbitCards?.color || undefined }}
                  >
                    {hero.orbit2Title}
                  </div>
                  <div
                    className="text-[10px] xs:text-xs font-black text-white leading-tight"
                    style={{ color: heroSettings?.styles?.orbitCards?.color || undefined }}
                  >
                    {hero.orbit2Subtitle}
                  </div>
                  {hero.orbit2Desc && (
                    <div
                      className="text-[8px] xs:text-[9px] sm:text-[10px] text-slate-400 leading-tight mt-0.5 xs:mt-1"
                      style={{ color: heroSettings?.styles?.orbitCards?.secondaryColor || undefined }}
                    >
                      {hero.orbit2Desc}
                    </div>
                  )}
                </div>

                {/* 3. Bottom-Right: Quick Start */}
                <div
                  className="float-chip hero-chip-entry absolute top-[260px] right-0 xs:right-2 z-30 w-32 xs:w-38 sm:w-52 rounded-xl sm:rounded-2xl bg-[#151310]/95 backdrop-blur-xl border border-amber-500/30 shadow-xl p-2.5 xs:p-3 sm:p-3.5 rotate-2 md:top-[400px] lg:top-[440px] sm:right-[50px]"
                  style={{
                    animation: `heroChipEntrance 0.95s 1.05s cubic-bezier(.16,1,.3,1) forwards, floatYAnim 5s 2.7s ease-in-out infinite`,
                    fontFamily: heroSettings?.styles?.orbitCards?.fontFamily || undefined,
                  }}
                >
                  <div className="text-xs xs:text-sm mb-0.5 xs:mb-1">✨</div>
                  <div
                    className="text-[10px] xs:text-xs font-black text-white leading-tight"
                    style={{ color: heroSettings?.styles?.orbitCards?.color || undefined }}
                  >
                    {hero.orbit3Title}
                  </div>
                  {hero.orbit3Desc && (
                    <div
                      className="text-[8px] xs:text-[9px] sm:text-[10px] text-slate-400 leading-tight mt-0.5 xs:mt-1"
                      style={{ color: heroSettings?.styles?.orbitCards?.secondaryColor || undefined }}
                    >
                      {hero.orbit3Desc}
                    </div>
                  )}
                </div>

                {/* 4. Bottom-Left: Free Trial */}
                <div
                  className="float-chip hero-chip-entry absolute top-[270px] left-0 xs:left-2 z-30 w-32 xs:w-36 sm:w-48 rounded-xl sm:rounded-2xl bg-[#151310]/95 backdrop-blur-xl border border-amber-500/30 shadow-xl p-2.5 xs:p-3 sm:p-3.5 -rotate-3 md:top-[440px] lg:top-[480px] sm:left-[-20px]"
                  style={{
                    animation: `heroChipEntrance 0.95s 1.35s cubic-bezier(.16,1,.3,1) forwards, floatYAnim 5s 3s ease-in-out infinite`,
                    fontFamily: heroSettings?.styles?.orbitCards?.fontFamily || undefined,
                  }}
                >
                  <div
                    className="text-xs xs:text-sm sm:text-base font-black text-emerald-400 leading-none mb-0.5 xs:mb-1"
                    style={{ color: heroSettings?.styles?.orbitCards?.color || undefined }}
                  >
                    {hero.orbit4Title}
                  </div>
                  <div
                    className="text-[10px] xs:text-xs font-black text-white leading-tight"
                    style={{ color: heroSettings?.styles?.orbitCards?.secondaryColor || undefined }}
                  >
                    {hero.orbit4Subtitle}
                  </div>
                </div>

                {/* 5. Mid-Left: Community */}
                <div
                  className="float-chip hero-chip-entry absolute top-[110px] left-0 xs:left-2 z-30 w-28 xs:w-32 sm:w-40 rounded-xl sm:rounded-2xl bg-[#151310]/95 backdrop-blur-xl border border-amber-500/30 shadow-xl p-2.5 xs:p-3 sm:p-3.5 rotate-2 md:top-[210px] lg:top-[240px] sm:left-[-20px] lg:left-[20px] xl:left-[40px]"
                  style={{
                    animation: `heroChipEntrance 0.95s 1.2s cubic-bezier(.16,1,.3,1) forwards, floatYAnim 5s 2.85s ease-in-out infinite`,
                    fontFamily: heroSettings?.styles?.orbitCards?.fontFamily || undefined,
                  }}
                >
                  <div className="h-6 w-6 xs:h-7 w-7 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mb-1 xs:mb-2 shrink-0">
                    <Users className="h-3.5 w-3.5 xs:h-4 w-4" />
                  </div>
                  <div
                    className="text-[10px] xs:text-xs font-black text-white leading-tight"
                    style={{ color: heroSettings?.styles?.orbitCards?.color || undefined }}
                  >
                    {hero.orbit5Title}
                  </div>
                  {hero.orbit5Desc && (
                    <div
                      className="text-[8px] xs:text-[9px] sm:text-[10px] text-slate-400 leading-tight mt-0.5"
                      style={{ color: heroSettings?.styles?.orbitCards?.secondaryColor || undefined }}
                    >
                      {hero.orbit5Desc}
                    </div>
                  )}
                </div>

              </div>

              {/* Author short info footer - Desktop only - Positioned at the bottom of the image to hide sharp edge */}
              <div
                className="absolute bottom-8 lg:bottom-12 xl:bottom-16 left-1/2 -translate-x-1/2 z-40 hidden lg:flex w-max items-center gap-3 py-2.5 pl-2.5 pr-5 bg-white/80 border border-slate-200/80 dark:bg-[#151310]/90 dark:border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl shadow-black/20 hero-anim-up"
                style={{
                  animationDelay: "0.45s",
                  fontFamily: heroSettings?.styles?.authorTagline?.fontFamily || undefined,
                }}
              >
                <img src={heroAvatar} alt={hero.authorName} className="h-10 w-10 rounded-xl object-cover border border-slate-200/80 dark:border-white/15 shadow-md" />
                <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span
                    className="font-extrabold text-slate-900 dark:text-white"
                    style={{ color: heroSettings?.styles?.authorTagline?.color || undefined }}
                  >
                    {hero.authorName}
                  </span>{" "}
                  <span style={{ color: heroSettings?.styles?.authorTagline?.secondaryColor || undefined }}>
                    — {hero.authorRole}
                  </span>
                </p>
              </div>

            </div>

            {/* Author card — mobile only, dynamic text */}
            <div
              className="flex lg:hidden items-center gap-3 py-2.5 pl-2.5 pr-5 mt-4 mx-auto bg-white/75 border border-slate-200/80 dark:bg-white/5 dark:border-white/10 rounded-2xl backdrop-blur-xl shadow-lg shadow-slate-200/50 dark:shadow-black/30 w-fit"
              style={{ fontFamily: heroSettings?.styles?.authorTagline?.fontFamily || undefined }}
            >
              <img src={heroAvatar} alt={hero.authorName} className="h-10 w-10 rounded-xl object-cover border border-slate-200/80 dark:border-white/15 shadow-md" />
              <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span
                  className="font-extrabold text-slate-900 dark:text-white"
                  style={{ color: heroSettings?.styles?.authorTagline?.color || undefined }}
                >
                  {hero.authorName}
                </span>{" "}
                <span style={{ color: heroSettings?.styles?.authorTagline?.secondaryColor || undefined }}>
                  — {hero.authorRole}
                </span>
              </p>
            </div>

          </div>

          {/* Core Stats bar - dynamic stats */}
          <div
            className="relative z-30 mt-6 lg:-mt-24 grid grid-cols-1 md:grid-cols-3 border border-white/10 rounded-3xl bg-[#141210]/90 backdrop-blur-xl overflow-hidden shadow-xl shadow-black/40 hero-anim-zoom"
            style={{
              animationDelay: "0.55s",
              fontFamily: heroSettings?.styles?.stats?.fontFamily || undefined,
            }}
          >
            {dynamicStats.map(({ icon: Icon, value, label }, index) => (
              <div
                key={label + index}
                className={`flex items-center gap-4 px-8 py-6 text-left transition-colors hover:bg-white/5
                  ${index < 2 ? "border-b md:border-b-0 md:border-r border-white/10" : ""}
                `}
              >
                <div className="h-12 w-12 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div
                    className="text-xl font-black text-white leading-tight"
                    style={{ color: heroSettings?.styles?.stats?.color || undefined }}
                  >
                    {value}
                  </div>
                  <div
                    className="text-xs font-semibold text-slate-400 mt-1"
                    style={{ color: heroSettings?.styles?.stats?.secondaryColor || undefined }}
                  >
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Dark blend zone: hides any poster overflow below the stats bar */}
        <div className="absolute inset-x-0 bottom-12 h-44 bg-gradient-to-t from-[#08070a] via-[#08070a]/80 to-transparent pointer-events-none z-20" />

        {/* Marquee ticker (dark) - dynamic items */}
        <div
          className="absolute bottom-0 inset-x-0 z-10 border-t border-white/10 bg-black/70 backdrop-blur-md py-3.5 overflow-hidden"
          style={{ fontFamily: heroSettings?.styles?.marquee?.fontFamily || undefined }}
        >
          <div className="marquee-track flex whitespace-nowrap items-center gap-10 w-max">
            {[...dynamicMarquee, ...dynamicMarquee].map((marqueeItem, marqueeIdx) => (
              <span
                key={marqueeIdx}
                className="flex items-center gap-10 text-[11px] font-extrabold uppercase tracking-[0.25em] text-slate-400"
                style={{ color: heroSettings?.styles?.marquee?.color || undefined }}
              >
                {marqueeItem}
                <span className="text-amber-500/80 text-sm">✦</span>
              </span>
            ))}
          </div>
        </div>

      </section>

      {/* ── Featured Video Courses Grid (Sequential spiral storytelling on desktop) ── */}
      <section className="py-24 bg-background relative">
        <div className="container px-4 mx-auto">

          <div className="sr sr-fade-up flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-14">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/10 text-amber-500 font-bold text-xs uppercase tracking-widest mb-3 border border-amber-400/20">
                <Flame className="h-3.5 w-3.5 text-amber-400" /> Видеоуроки & Мастер-классы
              </div>
              {/* Updated heading */}
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Открой для себя мир настоящих фокусов</h2>
              {/* Updated subheading */}
              <p className="text-muted-foreground text-base">Карточные трюки, иллюзии, секретные техники и мастер-классы от профессионального фокусника. Выбирай то, что тебе интересно, и начинай удивлять окружающих.</p>
            </div>
            <Button variant="outline" className="hidden sm:flex group items-center gap-2 rounded-full border-primary/20 hover:border-primary hover:text-primary transition-all duration-300 font-bold px-6" asChild>
              <Link href="/catalog">
                Все курсы
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <VideoGridSkeleton />
          ) : displayVideos.length === 0 ? (
            <div className="text-center py-24 rounded-3xl border border-dashed border-amber-400/20 bg-amber-400/5">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-500 mb-4 border border-amber-400/20">
                <Film className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Курсы скоро появятся</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">Новые видеокурсы уже готовятся — следите за обновлениями!</p>
            </div>
          ) : (
            <>
              {/* ── Mobile / Tablet: comfortable classic grid ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-7">
                {displayVideos.slice(0, 8).map((video: any, videoIdx: number) => (
                  <div
                    key={video.id}
                    data-sr-delay={String([0, 80, 160, 260, 80, 160, 260, 320][videoIdx] ?? 0)}
                    className="sr sr-fade-up group flex flex-col glass-card-hover rounded-3xl bg-card border shadow-md overflow-hidden relative transition-all duration-400 hover:shadow-2xl hover:border-amber-400/40 hover:-translate-y-1.5"
                  >
                    {renderCourseCard(video)}
                  </div>
                ))}
              </div>

              {/* ── Desktop: standard grid layout with fixed columns ── */}
              <div ref={spiralRef} className="hidden lg:block">

                {/* Spiral start marker */}
                <div className="flex items-center gap-2 mb-4 sr sr-fade-in">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)] animate-pulse" />
                  <span className="h-px w-10 bg-gradient-to-r from-amber-400/70 to-transparent" />
                </div>

                {/* Desktop Grid — fixed 4 columns, natural card sizes */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {displayVideos.map((video: any, videoIdx: number) => (
                    <div
                      key={video.id}
                      data-sr-delay={String([0, 100, 200, 300][videoIdx % 4] ?? 0)}
                      className="sr sr-fade-up group flex flex-col glass-card-hover rounded-3xl bg-card border shadow-md overflow-hidden relative transition-all duration-400 hover:shadow-2xl hover:border-amber-400/40 hover:-translate-y-1.5"
                    >
                      {renderCourseCard(video)}
                    </div>
                  ))}
                </div>

                {/* Spiral end marker */}
                <div className="flex items-center justify-end gap-2 mt-4">
                  <span className="h-px w-10 bg-gradient-to-l from-amber-400/70 to-transparent" />
                  <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60" />
                  <span className="h-1 w-1 rounded-full bg-amber-400/40" />
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Storytelling "About Author" Section (Light, Personal Conversation) ── */}
      <AboutSection />

      {/* ── NEW SECTION: Social Media Videos ── */}
      <SocialVideosSection />

      {/* ── NEW SECTION: Event Photos Gallery ── */}
      <EventsGallerySection />

      {/* ── Free Trial CTA Banner (Light, mouse-follow interactive) ── */}
      <ReviewsSection />

      {/* ── Interactive Demo Video Modal ── */}
      {activePreviewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl bg-card border rounded-3xl shadow-2xl overflow-hidden flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-bold text-lg leading-tight line-clamp-1">{activePreviewVideo.title}</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setActivePreviewVideo(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video bg-black">
              <PreviewVideoPlayer video={activePreviewVideo} />
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-card flex flex-col sm:flex-row items-center justify-between gap-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground line-clamp-2">{activePreviewVideo.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Button variant="outline" className="rounded-full" onClick={() => setActivePreviewVideo(null)}>
                  Закрыть
                </Button>
                <Button className="btn-glow font-bold rounded-full" asChild>
                  <Link href={`/video/${activePreviewVideo.id}`}>
                    Перейти к курсу ({activePreviewVideo.discountPrice || activePreviewVideo.price} ₽)
                  </Link>
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Interactive Magic Surprise Modal (Mind reading & surprise discount) ── */}
      <InteractiveMagicSurpriseModal
        isOpen={showMagicSurprise}
        onClose={() => setShowMagicSurprise(false)}
      />

    </div>
  );
}

// --- NEW COMPONENTS FOR ABOUT & CTA (Added for Dark Mode & Admin Editing) ---

function PreviewVideoPlayer({ video }: { video: any }) {
  const { data: playbackData, isLoading } = useGetVideoPlayback(video.id);
  const FALLBACK_VIDEO = "https://media.w3.org/2010/05/sintel/trailer.mp4";

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  const url = video.previewVideoUrl || playbackData?.manifestUrl || video.videoUrl || FALLBACK_VIDEO;

  return (
    <ReactPlayer
      url={url}
      playing={true}
      controls
      width="100%"
      height="100%"
      className="bg-black object-contain absolute top-0 left-0"
      config={{ file: { forceHLS: url.includes(".m3u8") } }}
      onContextMenu={(e: any) => e.preventDefault()}
    />
  );
}

function isAuthorVideoMedia(url: string, mediaType?: string): boolean {
  if (mediaType === "video") return true;
  if (mediaType === "image") return false;
  return /^data:video\//.test(url) || /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
}

function resolveAuthorMediaUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("/api/author-media/")) return url;
  const match = url.match(/\/author-media\/([^/?#]+)$/);
  if (match) return `/api/author-media/${match[1]}`;
  return url;
}

function LazyAutoplayVideo({ src, className }: { src: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;

        if (entry.isIntersecting) {
          if (!video.src) {
            video.src = src;
            video.load();
          }
          video.play().catch(() => { });
        } else {
          video.pause();
        }
      },
      { rootMargin: "0px", threshold: 0.1 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [src]);

  return (
    <div ref={containerRef} className="relative z-10 w-full h-full">
      <video
        ref={videoRef}
        className={className}
        muted
        loop
        playsInline
        preload="metadata"
      />
    </div>
  );
}

function AboutSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['site-settings', 'author_section'],
    queryFn: async () => {
      const res = await fetch('/api/site-settings/author_section');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.value;
    },
    retry: false,
  });

  // true only when data was successfully loaded from the server
  const hasData = !isLoading && !isError && data != null;
  const content = data ?? {};

  const NO_INFO = 'Информация не заполнена';

  if (isLoading) {
    return (
      <section id="about" className="py-28 bg-[#faf8f3] dark:bg-[#0c0a12] text-slate-900 dark:text-white relative overflow-hidden border-y border-amber-100/80 dark:border-amber-500/10">
        <div className="container px-4 mx-auto text-center">Загрузка...</div>
      </section>
    );
  }

  return (
    <section id="about" className="py-28 bg-[#faf8f3] dark:bg-[#0c0a12] text-slate-900 dark:text-white relative overflow-hidden border-y border-amber-100/80 dark:border-amber-500/10 transition-colors duration-500">
      {/* Warm ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-200/40 dark:bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-200/40 dark:bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 left-0 w-[420px] h-[420px] bg-rose-100/60 dark:bg-rose-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Soft paper grain */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-10 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* Decorative dashed arc top-right */}
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full border-2 border-dashed border-amber-200/80 dark:border-amber-500/20 pointer-events-none" />
      <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full border-2 border-dashed border-indigo-200/70 dark:border-indigo-500/20 pointer-events-none" />

      <div className="container px-4 mx-auto relative z-10">
        {/* Section Header Badge */}
        <div className="sr sr-fade-up text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-xs uppercase tracking-widest mb-4 border border-amber-200 dark:border-amber-500/20 shadow-sm"
            style={{
              fontFamily: content.textStyles?.badgeText?.fontFamily,
              color: content.textStyles?.badgeText?.color
            }}>
            <Compass className="h-4 w-4 text-amber-500" />
            {hasData && content.badgeText ? content.badgeText : 'История мастера'}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4"
            style={{
              fontFamily: content.textStyles?.heading?.fontFamily,
              color: content.textStyles?.heading?.color
            }}>
            {hasData && content.heading ? content.heading : <span className="text-slate-400 italic font-normal text-2xl">{NO_INFO}</span>}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg"
            style={{
              fontFamily: content.textStyles?.subheading?.fontFamily,
              color: content.textStyles?.subheading?.color
            }}>
            {hasData && content.subheading ? content.subheading : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-4">
          {/* Author Profile Frame — layered creative stack */}
          <div className="sr sr-fade-right lg:col-span-5 relative flex flex-col items-center lg:sticky lg:top-24">
            {/* Orbit ring behind photo */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="slow-spin h-[280px] w-[280px] sm:h-[420px] sm:w-[420px] rounded-full border border-dashed border-amber-300/60 dark:border-amber-500/20" />
            </div>

            {/* Layered photo composition */}
            <div className="relative w-full max-w-xs xs:max-w-sm sm:max-w-md mx-auto group/stack">
              <div className="absolute -inset-2.5 rotate-[9deg] rounded-[2.4rem] bg-gradient-to-br from-indigo-200/80 to-cyan-100/80 dark:from-indigo-500/20 dark:to-cyan-500/20 shadow-lg shadow-indigo-900/10 transition-transform duration-500 ease-out group-hover/stack:rotate-[11deg]" />
              <div className="absolute -inset-2.5 -rotate-[5deg] rounded-[2.4rem] bg-gradient-to-br from-amber-300/90 via-amber-200 to-amber-100 dark:from-amber-500/30 dark:via-amber-500/20 dark:to-amber-500/10 shadow-lg shadow-amber-900/15 transition-transform duration-500 ease-out group-hover/stack:-rotate-[7deg]" />
              <div className="absolute -inset-2.5 rotate-[2.5deg] rounded-[2.4rem] border-2 border-dashed border-amber-400/60 dark:border-amber-500/30 transition-transform duration-500 ease-out group-hover/stack:rotate-[4deg]" />

              <div className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl shadow-amber-900/20 border-[4px] sm:border-[6px] border-white dark:border-slate-800 group z-10 transition-transform duration-500 ease-out group-hover/stack:-translate-y-1.5">
                {hasData && content.photoUrl ? (
                  isAuthorVideoMedia(content.photoUrl, content.photoMediaType) ? (
                    <LazyAutoplayVideo
                      src={resolveAuthorMediaUrl(content.photoUrl)}
                      className="relative z-10 w-full h-full object-cover filter saturate-[1.05] group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <img
                      src={content.photoUrl}
                      alt={content.authorName || 'Автор'}
                      className="relative z-10 w-full h-full object-cover filter saturate-[1.05] group-hover:scale-105 transition-transform duration-700"
                    />
                  )
                ) : (
                  <div className="relative z-10 w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                    <div className="text-slate-400 dark:text-slate-600 text-center">
                      <ImageIcon className="h-16 w-16 mx-auto mb-2 opacity-40" />
                      <span className="text-sm opacity-60">Нет фото</span>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

                <div className="absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5 p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-[#15131a]/95 backdrop-blur-xl border border-slate-200/80 dark:border-amber-500/20 text-slate-900 dark:text-white shadow-2xl">
                  <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                    <span className="text-base xs:text-lg sm:text-2xl font-black text-amber-600 truncate mr-2"
                      style={{
                        fontFamily: content.textStyles?.authorName?.fontFamily,
                        color: content.textStyles?.authorName?.color
                      }}>
                      {hasData && content.authorName ? content.authorName : <span className="text-slate-400 text-lg font-normal italic">{NO_INFO}</span>}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] sm:text-[11px] font-extrabold border border-emerald-200 dark:border-emerald-500/20 shrink-0">PRO</span>
                  </div>
                  <div className="text-[10px] xs:text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2"
                    style={{
                      fontFamily: content.textStyles?.authorTitle?.fontFamily,
                      color: content.textStyles?.authorTitle?.color
                    }}>
                    {hasData && content.authorTitle ? content.authorTitle : <span className="italic">{NO_INFO}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Links Bar — dynamic, all platforms */}
            {hasData && content.socialLinks && Object.values(content.socialLinks).some(Boolean) && (
              <div className="w-full max-w-2xl mt-8 p-4 rounded-2xl bg-white/85 dark:bg-[#15131a]/85 border border-slate-200/80 dark:border-amber-500/20 backdrop-blur-md shadow-lg shadow-slate-900/5">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {SOCIAL_PLATFORMS.map(({ key, label, Icon, color, bg, border, hoverBg }) => {
                    const url = (content.socialLinks as Record<string, string>)[key];
                    if (!url) return null;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openSocialLink(url, key); }}
                        title={label}
                        aria-label={label}
                        className={`flex flex-col items-center gap-1 group p-2 rounded-xl ${hoverBg} transition-all duration-200`}
                      >
                        <div className={`h-11 w-11 rounded-2xl ${bg} ${color} border ${border} flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-200`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={`text-[9px] font-semibold ${color} opacity-70 group-hover:opacity-100 transition-opacity duration-200 leading-none`}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Story — personal conversation with the visitor */}
          <div className="sr sr-fade-left lg:col-span-7 flex flex-col justify-center space-y-10">
            {/* Speech-bubble Quote */}
            <div className="sr sr-blur relative" data-sr-delay="100">
              <div className="relative bg-white dark:bg-[#15131a] rounded-3xl border border-slate-200/80 dark:border-amber-500/25 shadow-xl shadow-amber-900/5 p-7 sm:p-8">
                <div className="hidden lg:block absolute -left-2.5 top-12 h-5 w-5 bg-white dark:bg-[#15131a] border-l border-b border-slate-200/80 dark:border-amber-500/25 rotate-45" />
                <div className="absolute -top-5 left-8 h-10 w-10 rounded-full bg-amber-100 dark:bg-[#15131a] border border-amber-200 dark:border-amber-500/50 shadow-md flex items-center justify-center">
                  <Quote className="h-5 w-5 text-amber-500" />
                </div>
                {hasData && content.quote ? (
                  <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 italic leading-relaxed font-serif pt-2"
                    style={{
                      fontFamily: content.textStyles?.quote?.fontFamily,
                      color: content.textStyles?.quote?.color
                    }}>
                    {content.quote}
                  </p>
                ) : (
                  <p className="text-base text-slate-400 dark:text-slate-600 italic pt-2">
                    {NO_INFO}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                  {hasData && content.backgroundPhotoUrl ? (
                    <img src={content.backgroundPhotoUrl} alt={content.authorName || 'Автор'} className="h-10 w-10 rounded-full object-cover border-2 border-amber-300 dark:border-amber-500 shadow-md" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-amber-300 dark:border-amber-500 shadow-md flex items-center justify-center">
                      <span className="text-slate-400 text-xs">?</span>
                    </div>
                  )}
                  <span className="text-sm font-black text-slate-900 dark:text-white"
                    style={{
                      fontFamily: content.textStyles?.authorName?.fontFamily,
                      color: content.textStyles?.authorName?.color
                    }}>
                    {hasData && content.authorName ? content.authorName : <span className="italic font-normal text-slate-400">{NO_INFO}</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Story Chapters Timeline */}
            <div className="relative pl-9">
              <div className="absolute left-[13px] top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-amber-400 via-amber-300 to-transparent" />
              <div className="space-y-6">
                {hasData && content.chapters && content.chapters.length > 0 ? (
                  content.chapters.map((ch: any, idx: number) => (
                    <div key={idx} className="sr sr-fade-up relative group" data-sr-delay={150 + idx * 100}>
                      <div className="absolute -left-[33px] top-6 h-5 w-5 rounded-full bg-white dark:bg-[#15131a] border-[3px] border-amber-400 shadow-[0_0_0_5px_rgba(251,191,36,0.15)] group-hover:scale-125 transition-transform z-10">
                        <span className="absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-amber-400" />
                      </div>
                      <div className="bg-white dark:bg-[#15131a] rounded-2xl border border-slate-200/70 dark:border-amber-500/20 shadow-md p-6 transition-all duration-300 group-hover:-translate-y-1">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-black uppercase tracking-wider mb-3"
                          style={{
                            fontFamily: content.textStyles?.[`chapter_${idx}_label`]?.fontFamily,
                            color: content.textStyles?.[`chapter_${idx}_label`]?.color
                          }}>
                          {ch.label}
                        </div>
                        <h4 className="text-lg font-black text-amber-600 mb-1.5"
                          style={{
                            fontFamily: content.textStyles?.[`chapter_${idx}_heading`]?.fontFamily,
                            color: content.textStyles?.[`chapter_${idx}_heading`]?.color
                          }}>{ch.heading}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed"
                          style={{
                            fontFamily: content.textStyles?.[`chapter_${idx}_text`]?.fontFamily,
                            color: content.textStyles?.[`chapter_${idx}_text`]?.color
                          }}>{ch.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="relative group">
                    <div className="absolute -left-[33px] top-6 h-5 w-5 rounded-full bg-white dark:bg-[#15131a] border-[3px] border-slate-300 dark:border-slate-600 z-10" />
                    <div className="bg-white dark:bg-[#15131a] rounded-2xl border border-slate-200/70 dark:border-amber-500/20 shadow-md p-6">
                      <p className="text-slate-400 dark:text-slate-600 text-sm italic">Главы истории не заполнены</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Skill pills */}
            <div className="pt-1">
              <div className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-3">Технологический стек:</div>
              <div className="flex flex-wrap gap-2.5">
                {hasData && content.skills && content.skills.length > 0 ? (
                  content.skills.map((skill: string) => (
                    <span key={skill} className="px-4 py-2 rounded-xl bg-white dark:bg-[#15131a] border border-slate-200 dark:border-amber-500/20 text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:border-amber-400/70 shadow-sm cursor-default">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-[#15131a] border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400 italic">
                    Навыки не указаны
                  </span>
                )}
              </div>
            </div>

          </div>



        </div>
      </div>
    </section>
  );
}

// --- SECTION: Social Media Videos (YouTube & TikTok) ---
function SocialVideosSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['site-settings', 'author_section'],
    queryFn: async () => {
      const res = await fetch('/api/site-settings/author_section');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.value;
    },
    retry: false,
  });

  const videos: { url: string; platform: 'youtube' | 'tiktok'; title: string }[] =
    (!isLoading && !isError && data?.entertainmentVideos?.length) ? data.entertainmentVideos : [];

  // Even if no videos are configured, we render the section to show it exists (empty state handled inside)
  // if (!isLoading && videos.length === 0) return null;
  return (
    <section className="py-24 bg-[#f6f7fb] dark:bg-[#0a0908] text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-500">
      {/* Ambient glows matching site style */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-amber-200/40 dark:bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-200/30 dark:bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container px-4 mx-auto relative z-10">
        {/* Section Header */}
        <div className="sr sr-fade-up text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-xs uppercase tracking-widest mb-4 border border-amber-200 dark:border-amber-500/20 shadow-sm">
            <Play className="h-4 w-4 text-amber-500 fill-amber-500" />
            Мой контент
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Смотрите на YouTube&nbsp;&amp;&nbsp;TikTok
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
            Развлекательные и обучающие ролики — нажмите на карточку, чтобы перейти на платформу.
          </p>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-amber-500/10 bg-white dark:bg-[#15131a] shadow-md animate-pulse">
                <div className="aspect-video bg-slate-200 dark:bg-slate-800" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Cards Grid */}
        {!isLoading && videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {videos.map((video, idx) => {
              // Extract YouTube video ID from various URL formats
              let youtubeId = '';
              if (video.platform === 'youtube') {
                const ytMatch = video.url.match(
                  /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
                );
                youtubeId = ytMatch ? ytMatch[1] : '';
              }
              const thumbUrl = youtubeId
                ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
                : '';

              return (
                <a
                  key={idx}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-sr-delay={String([0, 100, 200, 300][idx % 4])}
                  className="sr sr-fade-up group relative flex flex-col rounded-2xl overflow-hidden border border-slate-200/80 dark:border-amber-500/10 bg-white dark:bg-[#15131a] shadow-md hover:-translate-y-2 hover:shadow-xl hover:shadow-amber-900/10 transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950 shrink-0">
                    {video.platform === 'tiktok' ? (
                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 flex flex-col items-center justify-center gap-2">
                        <div className="h-14 w-14 rounded-full bg-slate-900/60 border border-white/20 flex items-center justify-center shadow-lg">
                          <svg className="h-7 w-7 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.63 4.18 1.05 1.15 2.5 1.83 4.02 2.05v3.83c-1.39-.08-2.74-.6-3.86-1.47-.84-.66-1.5-1.52-1.92-2.51-.07-.15-.12-.31-.22-.59v8.46c-.03 1.3-.39 2.62-1.07 3.73-.83 1.34-2.13 2.37-3.64 2.87-1.46.49-3.08.52-4.57.12-1.56-.41-2.99-1.36-3.95-2.69C1.94 16.27 1.48 14.54 1.6 12.8c.07-1.74.75-3.46 1.93-4.73 1.19-1.28 2.87-2.09 4.63-2.26v3.91c-.81.1-1.58.48-2.15 1.07-.63.66-.96 1.56-.93 2.47.01.8.31 1.6.86 2.19.53.59 1.28.94 2.07.99 1.08.05 2.13-.53 2.59-1.5.21-.49.27-1.03.26-1.56.02-2.82.01-5.64.01-8.46l.03-.93z" />
                          </svg>
                        </div>
                        <span className="text-[11px] uppercase tracking-widest font-black text-rose-400">TikTok</span>
                      </div>
                    ) : thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <Play className="h-10 w-10 text-slate-600" />
                      </div>
                    )}

                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-slate-900/25 group-hover:bg-slate-900/10 transition-colors duration-300" />

                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-13 w-13 h-12 w-12 rounded-full bg-amber-400/90 dark:bg-amber-500/90 text-slate-950 border-2 border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl">
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Platform badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-[10px] font-extrabold uppercase tracking-wider text-white">
                      {video.platform === 'youtube' ? (
                        <svg className="h-3 w-3 fill-red-500" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                      ) : (
                        <svg className="h-3 w-3 fill-cyan-400" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.63 4.18 1.05 1.15 2.5 1.83 4.02 2.05v3.83c-1.39-.08-2.74-.6-3.86-1.47-.84-.66-1.5-1.52-1.92-2.51-.07-.15-.12-.31-.22-.59v8.46c-.03 1.3-.39 2.62-1.07 3.73-.83 1.34-2.13 2.37-3.64 2.87-1.46.49-3.08.52-4.57.12-1.56-.41-2.99-1.36-3.95-2.69C1.94 16.27 1.48 14.54 1.6 12.8c.07-1.74.75-3.46 1.93-4.73 1.19-1.28 2.87-2.09 4.63-2.26v3.91c-.81.1-1.58.48-2.15 1.07-.63.66-.96 1.56-.93 2.47.01.8.31 1.6.86 2.19.53.59 1.28.94 2.07.99 1.08.05 2.13-.53 2.59-1.5.21-.49.27-1.03.26-1.56.02-2.82.01-5.64.01-8.46l.03-.93z" /></svg>
                      )}
                      {video.platform === 'youtube' ? 'YouTube' : 'TikTok'}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors duration-300">
                      {video.title || 'Смотреть видео'}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      Открыть на {video.platform === 'youtube' ? 'YouTube' : 'TikTok'} →
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        ) : !isLoading && (
          <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Video className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
            <h4 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-2">Видео пока не добавлены</h4>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Администратор может добавить ссылки на YouTube и TikTok в панели управления.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewsSection() {
  const [ctaPointer, setCtaPointer] = useState({ x: 0, y: 0 });
  const ctaCardRef = useRef<HTMLDivElement>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const { data: reviewsData, isLoading, isError } = useQuery({
    queryKey: ['site-settings', 'reviews_section'],
    queryFn: async () => {
      const res = await fetch('/api/site-settings/reviews_section');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.value;
    },
    retry: false,
  });

  const hasData = !isLoading && !isError && reviewsData != null;
  const sectionData = reviewsData ?? {};

  const NO_INFO = 'Информация не заполнена';

  const handleCtaPointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ctaCardRef.current) return;
    const rect = ctaCardRef.current.getBoundingClientRect();
    setCtaPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <section className="py-20 bg-[#f6f7fb] dark:bg-[#08070a] text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-amber-200/50 dark:bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-200/50 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container px-4 mx-auto relative z-10">
        <div
          ref={ctaCardRef}
          onMouseMove={handleCtaPointerMove}
          className="sr sr-blur relative rounded-3xl bg-[#fbfbfd] dark:bg-[#121017] p-10 md:p-16 border border-amber-200/90 dark:border-amber-500/20 shadow-2xl overflow-hidden transition-shadow duration-300"
        >
          <div
            className="pointer-events-none absolute inset-0 z-[1] opacity-90 transition-opacity duration-300"
            style={{ background: `radial-gradient(circle 260px at ${ctaPointer.x}px ${ctaPointer.y}px, rgba(251,191,36,0.28), rgba(251,191,36,0.08) 45%, transparent 70%)` }}
          />
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-300/30 dark:bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-300/30 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Section header - updated texts */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-xs uppercase tracking-widest mb-4 border border-amber-200 dark:border-amber-500/20 shadow-sm">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                {hasData && sectionData.badgeText ? sectionData.badgeText : 'Отзывы'}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3 leading-tight">
                {hasData && sectionData.heading ? sectionData.heading : <span className="text-slate-400 italic font-normal text-2xl">{NO_INFO}</span>}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl mx-auto">
                {hasData && sectionData.subheading ? sectionData.subheading : 'Впечатления от уроков, фокусов и первых попыток удивить друзей.'}
              </p>
            </div>

            {/* Reviews grid */}
            {isLoading ? (
              <div className="text-center py-8 text-slate-400">Загрузка отзывов...</div>
            ) : hasData && sectionData.reviews && sectionData.reviews.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {sectionData.reviews.map((review: any, rIdx: number) => (
                  <div
                    key={review.id || rIdx}
                    data-sr-delay={String([0, 100, 200, 100, 200, 300][rIdx % 6])}
                    className="sr sr-fade-up group relative bg-white dark:bg-[#0d0b14] rounded-2xl border border-slate-200/80 dark:border-amber-500/15 shadow-md hover:shadow-xl hover:shadow-amber-900/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  >
                    {review.imageUrl ? (
                      <div
                        className="w-full bg-slate-50 dark:bg-slate-900/60 overflow-hidden cursor-zoom-in relative"
                        onClick={() => setLightboxImg(review.imageUrl)}
                        title="Нажмите для просмотра"
                      >
                        <img
                          src={review.imageUrl}
                          alt={`Отзыв от ${review.authorName}`}
                          className="w-full h-auto object-contain max-h-[480px] group-hover:scale-[1.02] transition-transform duration-500"
                        />
                        {/* Zoom hint */}
                        <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zm-6-3v6m-3-3h6" />
                          </svg>
                        </div>
                      </div>
                    ) : null}

                    {/* Text content */}
                    <div className="p-5">
                      {/* Stars */}
                      <div className="flex items-center gap-0.5 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`}
                          />
                        ))}
                      </div>

                      {review.text && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-4">
                          {review.text}
                        </p>
                      )}

                      {/* Author */}
                      <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-sm shrink-0">
                          {review.authorName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-bold text-sm text-slate-800 dark:text-white">{review.authorName || 'Аноним'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Star className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm italic">{NO_INFO}</p>
              </div>
            )}

            {/* Marketing CTA Box at the bottom — Original rich golden banner design */}
            <div className="mt-14 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 p-6 sm:p-8 lg:p-12 shadow-2xl shadow-amber-500/25 relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-white/15 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
                <div className="space-y-3 max-w-xl w-full">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/15 text-slate-950 text-[10px] xs:text-xs font-black uppercase tracking-wider max-w-full">
                    <MagicianHatWandIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="leading-tight">Эксклюзивное шоу для вашего праздника</span>
                  </div>
                  <h3 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-slate-950">
                    Хотите удивить гостей на своём мероприятии?
                  </h3>
                  <p className="text-xs xs:text-sm sm:text-base font-semibold text-slate-900/85 leading-relaxed">
                    Интерактивная магия, чтение мыслей, микромагия и сценическое шоу. Сделайте ваше событие незабываемым!
                  </p>
                </div>

                <Button
                  size="lg"
                  className="bg-slate-950 hover:bg-slate-900 text-white font-black px-5 sm:px-8 py-4 sm:py-6 rounded-2xl shadow-xl hover:scale-105 transition-all text-xs xs:text-sm sm:text-base shrink-0 border border-white/10 w-full lg:w-auto whitespace-normal text-center leading-snug min-h-[52px]"
                  asChild
                >
                  <Link href="/catalog" className="flex items-center justify-center gap-2 flex-wrap">
                    <span>Заказать выступление на праздник</span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  </Link>
                </Button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxImg(null); }}
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxImg}
            alt="Просмотр отзыва"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
