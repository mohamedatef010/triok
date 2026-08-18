import { Mail, MapPin, Star, Wand2, Users, GraduationCap } from "lucide-react";
import { SOCIAL_PLATFORMS, openSocialLink } from "@/components/ui/social-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useSEO } from "@/hooks/use-seo";

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
          video.play().catch(() => {});
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
    <div ref={containerRef} className="w-full h-full">
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

export function ContactsPage() {
  useSEO({
    title: "Контакты",
    description: "Свяжитесь с нами по любым вопросам — обучение, курсы, сотрудничество. Мы всегда на связи.",
    canonical: "/contacts",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Контакты — Классный Фокус",
      "url": "https://xn----7sb1acdcpkxafxk9g.xn--p1ai/contacts"
    }
  });

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

  const { data: requisitesData } = useQuery({
    queryKey: ['site-settings', 'site_requisites'],
    queryFn: async () => {
      const res = await fetch('/api/site-settings/site_requisites');
      if (!res.ok) return null;
      const json = await res.json();
      return json?.value;
    },
    retry: false,
  });

  const contactPhone = requisitesData?.phone || (!isLoading && data?.phone) ? (requisitesData?.phone || data?.phone) : "Не указан";
  const contactPhoneHref = contactPhone && contactPhone !== "Не указан" ? `tel:${contactPhone.replace(/\s+/g, '')}` : undefined;

  const contactEmail = requisitesData?.email || (!isLoading && data?.email) ? (requisitesData?.email || data?.email) : "Не указан";
  const contactEmailHref = contactEmail && contactEmail !== "Не указан" ? `mailto:${contactEmail}` : undefined;

  const hasData = !isLoading && !isError && data != null;
  const content = data ?? {};

  // Build social links list dynamically from all supported platforms
  const socialLinks = SOCIAL_PLATFORMS
    .map(({ key, label, Icon, color, bg, border, hoverBg }) => {
      const raw = (content.socialLinks as Record<string, string> | undefined)?.[key];
      if (!raw) return null;
      return { key, label, Icon, color, bg, border, hoverBg, raw };
    })
    .filter(Boolean) as { key: string; label: string; Icon: any; color: string; bg: string; border: string; hoverBg: string; raw: string }[];

  return (
    <div className="min-h-screen bg-[#faf8f3] dark:bg-[#0d0b14] text-slate-900 dark:text-white py-12 lg:py-20">
      
      {/* ── Subtle Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] right-[-100px] w-[700px] h-[500px] bg-amber-200/20 dark:bg-amber-500/5 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-150px] left-[-100px] w-[500px] h-[500px] bg-indigo-200/15 dark:bg-indigo-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="container relative z-10 px-4 mx-auto max-w-6xl">
        
        {/* ── Page Header ── */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-4 border border-amber-200 dark:border-amber-500/20">
            <Wand2 className="h-3.5 w-3.5" />
            Контакты
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4">
            Свяжитесь со мной
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Пишите по любым вопросам — курсы, обучение, сотрудничество
          </p>
        </div>

        {/* ── Main Content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* ── Right Side: Author Image with Layers (Mobile order-1, Desktop lg:order-2) ── */}
          <div className="order-1 lg:order-2 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md group">
              
              {/* Background decorative layers */}
              <div className="absolute -inset-4 rotate-6 rounded-3xl bg-gradient-to-br from-amber-200/60 to-orange-200/60 dark:from-amber-500/10 dark:to-orange-500/10 transition-transform duration-500 group-hover:rotate-8" />
              <div className="absolute -inset-4 -rotate-3 rounded-3xl bg-gradient-to-br from-indigo-200/40 to-purple-200/40 dark:from-indigo-500/10 dark:to-purple-500/10 transition-transform duration-500 group-hover:-rotate-5" />
              <div className="absolute -inset-4 rounded-3xl border-2 border-dashed border-amber-300/50 dark:border-amber-500/20 transition-transform duration-500 group-hover:rotate-2" />

              {/* Main image container */}
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-amber-900/20 dark:shadow-black/50 transition-transform duration-500 group-hover:-translate-y-2">
                {hasData && content.photoUrl ? (
                  isAuthorVideoMedia(content.photoUrl, content.photoMediaType) ? (
                    <LazyAutoplayVideo
                      src={resolveAuthorMediaUrl(content.photoUrl)}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src={content.photoUrl}
                      alt={content.authorName || 'Автор'}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/20 dark:to-amber-800/20 flex items-center justify-center">
                    <div className="text-center text-slate-400 dark:text-slate-600">
                      <div className="text-7xl mb-3">🎩</div>
                      <p className="text-sm">Фото не загружено</p>
                    </div>
                  </div>
                )}
                
                {/* Subtle gradient overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 px-5 py-3 rounded-2xl bg-white dark:bg-[#15131a] border border-amber-200 dark:border-amber-500/30 shadow-xl flex items-center gap-3 transition-transform duration-500 group-hover:-translate-y-1">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-slate-900 shadow-md">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">10+ лет</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">в магии</div>
                </div>
              </div>

              {/* Decorative playing card symbol (sleight of hand) */}
              <div className="absolute -top-3 -right-3 h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold leading-none select-none">♠</span>
              </div>
            </div>
          </div>

          {/* ── Left Side: Contact Details (Mobile order-2, Desktop lg:order-1) ── */}
          <div className="order-2 lg:order-1 space-y-8">
            
            {/* Social Media Cards — all platforms */}
            {socialLinks.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-amber-500" />
                  Социальные сети и профили
                </h2>
                <div className="space-y-3">
                  {socialLinks.map((social) => (
                    <button
                      key={social.key}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openSocialLink(social.raw, social.key); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border ${social.bg} ${social.border} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg group text-left`}
                    >
                      <div className={`h-12 w-12 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center ${social.color} shadow-sm group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                        <social.Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white">{social.label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{social.raw}</div>
                      </div>
                      <svg className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:translate-x-1 transition-transform duration-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactPhoneHref ? (
                <a
                  href={contactPhoneHref}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-all"
                >
                  <div className="h-12 w-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-lg shrink-0">
                    📞
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">Телефон</div>
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400">{contactPhone}</div>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15">
                  <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg shrink-0">
                    📞
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">Телефон</div>
                    <div className="text-xs font-bold text-muted-foreground">{contactPhone}</div>
                  </div>
                </div>
              )}

              {contactEmailHref ? (
                <a
                  href={contactEmailHref}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/15 transition-all"
                >
                  <div className="h-12 w-12 rounded-xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center font-bold text-lg shrink-0">
                    ✉️
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">Email</div>
                    <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400">{contactEmail}</div>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/15">
                  <div className="h-12 w-12 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold text-lg shrink-0">
                    ✉️
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">Email</div>
                    <div className="text-xs font-bold text-muted-foreground">{contactEmail}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 dark:text-white">Локация</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Россия (онлайн по всему миру)</div>
              </div>
              <Link href="/requisites" className="text-xs font-bold text-primary hover:underline">
                Реквизиты &rarr;
              </Link>
            </div>

            
            
          </div>
        </div>
      </div>
    </div>
  );
}