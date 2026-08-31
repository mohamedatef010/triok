import { useState, useRef, useEffect } from "react";
import { useSEO } from "@/hooks/use-seo";
import { useRoute, Link, useLocation } from "wouter";
import { 
  useGetVideo, 
  useCreateOrder,
  useGetVideoPlayback,
  useGetRelatedVideos,
  useGetSimilarVideos,
  useGetFeaturedVideos,
  useListReviews,
  useGetMyPurchasedVideos,
  useRecordVideoView,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { useCompareStore } from "@/hooks/use-compare";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  Info, 
  PlayCircle, 
  Scale, 
  Lock, 
  ShieldCheck, 
  Play, 
  Package, 
  Layers, 
  Clock, 
  ArrowRight, 
  MessageSquare,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { LoadingSpinner, ErrorState } from "@/components/ui/states";
import { useToast } from "@/hooks/use-toast";
import { VideoReviewModal } from "@/components/video-review-modal";
import { useQueryClient } from "@tanstack/react-query";
import ReactPlayer from "react-player";

import { formatDuration } from "@/lib/utils";
import { TrickDifficultyBadge } from "@/components/ui/trick-difficulty";

export function VideoDetailPage() {
  const [, params] = useRoute("/video/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const { data: apiVideo, isLoading, error } = useGetVideo(id, {
    query: { enabled: !!id } as any
  });

  const { data: playbackData } = useGetVideoPlayback(id, {
    query: { enabled: !!id, retry: false } as any
  });

  const { data: relatedVideos } = useGetRelatedVideos(id, {
    query: { enabled: !!id } as any
  });
  
  const { data: similarVideos } = useGetSimilarVideos(id, {
    query: { enabled: !!id } as any
  });

  const { data: featuredVideos } = useGetFeaturedVideos();

  // Exclude current video from fallback lists
  const allRealVideos = (featuredVideos || []).filter((v: any) => v.id !== id);

  const relatedList = (relatedVideos && relatedVideos.length > 0) 
    ? relatedVideos 
    : allRealVideos;

  const similarList = (similarVideos && similarVideos.length > 0)
    ? similarVideos
    : allRealVideos;

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: realReviews, refetch: refetchReviews } = useListReviews(id, {
    query: { enabled: !!id } as any
  });
  const reviewsList = Array.isArray(realReviews) ? realReviews : [];

  const { data: myPurchasedVideos } = useGetMyPurchasedVideos({
    query: { enabled: isAuthenticated } as any
  });

  const isPurchasedByUser = Array.isArray(myPurchasedVideos) 
    ? myPurchasedVideos.some((v: any) => v.id === id) 
    : false;

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const myExistingReview = reviewsList.find((r: any) => r.userId === user?.id);

  const video = apiVideo;

  // Dynamic rating calculated from real reviews if available
  const avgRatingNumber = reviewsList.length > 0
    ? (reviewsList.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewsList.length)
    : (video?.averageRating ? Number(video.averageRating) : 0);
  const reviewCountNumber = reviewsList.length > 0 ? reviewsList.length : (video?.reviewCount ?? 0);

  // Use real ratings only from API data
  const displayVideo = video ? { ...video, averageRating: avgRatingNumber, reviewCount: reviewCountNumber } : null;

  // Dynamic SEO based on loaded video data
  const seoTitle = video?.title || "Курс по фокусам";
  const seoDescription = video?.description
    ? video.description.slice(0, 160)
    : "Пошаговый курс по фокусам и трюкам. Освойте секреты иллюзионного искусства шаг за шагом.";
  const seoImage = video?.thumbnailUrl || undefined;
  const seoCanonical = id ? `/video/${id}` : undefined;

  // Build Course schema only from real available data
  const courseSchema = video ? {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": video.title,
    ...(video.description ? { "description": video.description } : {}),
    ...(video.thumbnailUrl ? { "image": video.thumbnailUrl } : {}),
    "provider": {
      "@type": "Organization",
      "name": "Классный Фокус",
      "sameAs": "https://xn----7sb1acdcpkxafxk9g.xn--p1ai"
    },
    ...(video.price ? {
      "offers": {
        "@type": "Offer",
        "price": video.discountPrice ?? video.price,
        "priceCurrency": "RUB",
        "availability": "https://schema.org/InStock"
      }
    } : {}),
    ...(displayVideo && displayVideo.averageRating && displayVideo.reviewCount ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": displayVideo.averageRating,
        "reviewCount": displayVideo.reviewCount,
        "bestRating": 5,
        "worstRating": 1
      }
    } : {})
  } : undefined;

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonical: seoCanonical,
    ogImage: seoImage,
    structuredData: courseSchema,
  });

  const cart = useCart();
  const favs = useFavorites();
  const compare = useCompareStore();
  const createOrder = useCreateOrder();

  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  const viewRecordedRef = useRef(false);
  const recordView = useRecordVideoView();
  // Locks the URL at the moment Play is pressed to prevent HLS double-playback.
  // Without this, playbackData arriving async changes playerUrl, the `key` on
  // ReactPlayer changes, a new player mounts but the old HLS instance + <video>
  // element keeps playing audio in the background.
  const lockedPlayerUrlRef = useRef<string | null>(null);

  const handleStartPlaying = () => {
    // Pause every media element in the page before starting a new one
    if (typeof document !== "undefined") {
      document.querySelectorAll<HTMLMediaElement>("video, audio").forEach((el) => {
        try { el.pause(); } catch {}
      });
    }
    // Lock the URL now so that any subsequent async update to playbackData
    // does NOT change playerUrl (and therefore never triggers a remount).
    const resolvedUrl = (isPurchasedByUser || video?.isPurchased)
      ? (playbackData?.manifestUrl || video?.videoUrl || FALLBACK_VIDEO)
      : (playbackData?.manifestUrl || video?.previewVideoUrl || video?.videoUrl || FALLBACK_VIDEO);
    lockedPlayerUrlRef.current = resolvedUrl || FALLBACK_VIDEO;
    if (!viewRecordedRef.current && id) {
      viewRecordedRef.current = true;
      recordView.mutate({ id });
    }
    setIsPlaying(true);
  };
  const [playerDuration, setPlayerDuration] = useState<number | null>(null);
  const [showPurchaseOverlay, setShowPurchaseOverlay] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const mainBuyButtonRef = useRef<HTMLDivElement>(null);

  const effectiveDurationSeconds = (video?.durationSeconds && video.durationSeconds > 0)
    ? video.durationSeconds
    : playerDuration;
  const displayDuration = formatDuration(effectiveDurationSeconds) || formatDuration((video as any)?.duration);

  // Reliable fallback video URLs (hosted on W3C)
  const FALLBACK_VIDEO = "https://media.w3.org/2010/05/sintel/trailer.mp4";

  // Reset everything when the video id changes or the component unmounts
  useEffect(() => {
    return () => {
      setIsPlaying(false);
      setShowPurchaseOverlay(false);
      setVideoError(false);
      viewRecordedRef.current = false;
      lockedPlayerUrlRef.current = null;
      // Force-stop any lingering media elements left by ReactPlayer/HLS.js
      if (typeof document !== "undefined") {
        document.querySelectorAll<HTMLMediaElement>("video, audio").forEach((el) => {
          try {
            el.pause();
            el.removeAttribute("src");
            el.load();
          } catch {}
        });
      }
    };
  }, [id]);

  // On MOUNT: stop any media that was left playing by the previous page (e.g. the
  // home-page preview modal on iOS/mobile where native <video> persists across navigation)
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.querySelectorAll<HTMLMediaElement>("video, audio").forEach((el) => {
        try { el.pause(); el.removeAttribute("src"); el.load(); } catch {}
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track scroll to show mobile floating sticky purchase bar
  useEffect(() => {
    const handleScroll = () => {
      if (!mainBuyButtonRef.current) return;
      const rect = mainBuyButtonRef.current.getBoundingClientRect();
      // If the main buy button is scrolled off top of viewport, show sticky bar
      if (rect.bottom < 0) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget;
    if (target.src !== FALLBACK_VIDEO) {
      target.src = FALLBACK_VIDEO;
      target.load();
    } else {
      setVideoError(true);
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = (progress: { playedSeconds: number; played: number; loadedSeconds: number; loaded: number }) => {
    if (!video || !playerRef.current) return;
    
    if (playbackData?.type === "full") return;
    if (playbackData?.type === "preview") return;

    if (video.previewVideoUrl) return;

    if (video.isPurchased) return;
    const duration = playerRef.current.getDuration();
    if (duration > 0 && progress.playedSeconds > duration * 0.2) {
      setIsPlaying(false);
      setShowPurchaseOverlay(true);
    }
  };
  
  const handleEnded = () => {
    setIsPlaying(false);
    if (playbackData?.type === "preview") {
      setShowPurchaseOverlay(true);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      if (video) {
        const localCart = (() => {
          try { return JSON.parse(localStorage.getItem("local_cart") || "[]"); } catch { return []; }
        })();
        if (!localCart.find((i: any) => i.videoId === video.id)) {
          localCart.push({
            videoId: video.id,
            title: video.title,
            price: video.price,
            discountPrice: video.discountPrice ?? null,
            thumbnailUrl: video.thumbnailUrl ?? null,
          });
          localStorage.setItem("local_cart", JSON.stringify(localCart));
        }
      }
      setLocation(`/auth/login?redirect=/checkout`);
      return;
    }
    try {
      let promoCode: string | undefined = undefined;
      try {
        const stored = localStorage.getItem("applied_promocode");
        if (stored) {
          const parsed = JSON.parse(stored);
          promoCode = parsed?.code;
        }
      } catch {}

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          videoId: id,
          fromCart: false,
          promoCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Не удалось создать заказ");
      }

      const order = await res.json();
      setLocation(`/payment/${order.id}`);
    } catch (err: any) {
      toast({
        title: "Ошибка оформления",
        description: err.message || "Переходим в корзину...",
        variant: "destructive"
      });
      setLocation(`/cart`);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video?.title || "Курс по фокусам",
          url: window.location.href,
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        toast({ title: "Ссылка скопирована в буфер обмена!" });
        setTimeout(() => setCopiedLink(false), 2000);
      } catch {}
    }
  };

  const scrollToReviews = () => {
    const el = document.getElementById("reviews-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isLoading && !video) return <LoadingSpinner />;
  if (error && !video) return <ErrorState error={error} />;
  if (!video) return <NotFound />;

  const isFav = favs.isFavorite(video.id);
  const inCart = cart.isInCart(video.id);
  const inCompare = !!compare.videos.find(v => v.id === video.id);
  // Use the locked URL when playing (prevents remount on async playbackData arrival).
  // Fall back to the live-computed URL only while the thumbnail/play-button is showing.
  const livePlayerUrl = (isPurchasedByUser || video.isPurchased)
    ? (playbackData?.manifestUrl || video.videoUrl || FALLBACK_VIDEO)
    : (playbackData?.manifestUrl || video.previewVideoUrl || video.videoUrl || FALLBACK_VIDEO);
  const playerUrl = (isPlaying && lockedPlayerUrlRef.current) ? lockedPlayerUrlRef.current : livePlayerUrl;

  // Discount percentage calculation
  const discountPercent = (video.discountPrice && video.price && video.price > video.discountPrice)
    ? Math.round(((video.price - video.discountPrice) / video.price) * 100)
    : null;

  const currentPrice = video.discountPrice ?? video.price;

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-16">
      <div className="container mx-auto px-3.5 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl">
        
        {/* ── Top Navigation Bar on Mobile / Desktop ── */}
        <div className="flex items-center gap-2 mb-3.5 sm:mb-6">
          <Link href="/catalog">
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full -ml-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 gap-1.5 px-3 py-1.5 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="inline">Назад в каталог</span>
            </Button>
          </Link>
        </div>

        {/* ── Main Top Hero & Course Presentation ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 mb-10 sm:mb-14">
          
          {/* Left Column: Video Player / Cinema Box (col-span-7) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="relative w-full bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 dark:ring-white/10 ring-slate-900/10 group" style={{ aspectRatio: '16/9', minHeight: '240px' }}>
              {!isPlaying ? (
                <>
                  <img 
                    src={video.thumbnailUrl || undefined} 
                    alt={video.title} 
                    className="w-full h-full object-contain filter brightness-[0.9] group-hover:scale-102 transition-transform duration-700 ease-out"
                  />
                  
                  {/* Subtle dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                    {showPurchaseOverlay ? (
                      <div className="bg-slate-950/92 border border-amber-400/50 backdrop-blur-2xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl max-w-md w-full animate-in zoom-in-95 duration-300 shadow-2xl text-center">
                        <div className="inline-flex h-12 sm:h-14 w-12 sm:w-14 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-400 mb-3 sm:mb-4 border border-amber-400/30">
                          <Lock className="h-6 sm:h-7 w-6 sm:w-7" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-white mb-2 leading-snug">Бесплатный превью-просмотр завершен</h3>
                        <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">Для продолжения просмотра приобретите полный доступ к обучающему курсу.</p>
                        <Button 
                          size="lg" 
                          className="btn-glow font-black w-full rounded-xl sm:rounded-2xl h-11 sm:h-12 bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/30" 
                          onClick={handleBuyNow}
                        >
                          Купить доступ ({currentPrice} ₽)
                        </Button>
                      </div>
                    ) : (
                      <button 
                        onClick={handleStartPlaying}
                        className="group/play flex flex-col items-center gap-3 focus:outline-none cursor-pointer transform transition-transform active:scale-95"
                      >
                        {/* Play button circle */}
                        <div className="h-14 w-14 sm:h-18 sm:w-18 rounded-full bg-white/95 text-slate-950 flex items-center justify-center shadow-xl group-hover/play:scale-110 group-hover/play:bg-amber-400 transition-all duration-250">
                          <Play className="h-6 w-6 sm:h-8 sm:w-8 fill-current ml-0.5" />
                        </div>

                        {/* Label */}
                        <span className="text-white font-semibold text-xs sm:text-sm bg-black/50 px-3.5 py-1 rounded-full">
                          {isPurchasedByUser || video.isPurchased ? "Смотреть курс" : "Смотреть превью бесплатно"}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Corner Badges on Thumbnail */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {video.categoryName && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-amber-400 text-[11px] font-extrabold border border-amber-400/30 shadow-md">
                        {video.categoryName}
                      </span>
                    )}
                  </div>

                  {displayDuration && (
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-md">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        {displayDuration}
                      </span>
                    </div>
                  )}
                </>
              ) : videoError ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white gap-3 p-6 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                    <PlayCircle className="h-7 w-7 text-amber-400" />
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm max-w-xs">Видео недоступно для воспроизведения в браузере</p>
                  <button
                    onClick={() => { setVideoError(false); setIsPlaying(false); }}
                    className="text-xs text-amber-400 font-bold underline underline-offset-4 hover:text-amber-300 cursor-pointer"
                  >
                    Вернуться к превью
                  </button>
                </div>
              ) : (
                <ReactPlayer
                  ref={playerRef}
                  url={playerUrl}
                  playing={isPlaying}
                  controls
                  width="100%"
                  height="100%"
                  className="bg-black object-contain absolute top-0 left-0"
                  onProgress={handleTimeUpdate}
                  onDuration={(d) => {
                    if (d && d > 0 && (!video?.durationSeconds || video.durationSeconds === 0)) {
                      setPlayerDuration(Math.round(d));
                    }
                  }}
                  onEnded={handleEnded}
                  onError={() => setVideoError(true)}
                  config={{ file: { forceHLS: playerUrl.includes(".m3u8"), attributes: { controlsList: 'nodownload', preload: 'metadata' } } }}
                  onContextMenu={(e: any) => e.preventDefault()}
                />
              )}
            </div>
          </div>

          {/* Right Column: Course Info & Primary Purchase Card (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-card/90 dark:bg-card/70 border border-border/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-xl shadow-slate-950/5 backdrop-blur-xl flex flex-col justify-between flex-1 relative overflow-hidden">
              
              {/* Subtle top ambient gradient pill */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

              <div>
                {/* Meta Tags Row - only real data */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {/* Category — always shown */}
                  <span className="px-3 py-1 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-400 font-extrabold text-xs border border-amber-400/30">
                    {video.categoryName || "Фокусы"}
                  </span>

                  {/* Duration — only if actually set and > 0 */}
                  {displayDuration && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/80 text-muted-foreground text-xs font-semibold border border-border/60">
                      <Clock className="h-3 w-3 text-amber-500" />
                      {displayDuration}
                    </span>
                  )}

                  {/* Reviews count — only if > 0 */}
                  {reviewCountNumber > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                      <Star className="h-3 w-3 fill-primary" />
                      {reviewCountNumber} отз.
                    </span>
                  )}
                </div>

                {/* Course Title */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground leading-snug tracking-tight mb-3">
                  {video.title}
                </h1>

                {/* Rating & Reviews pill + Difficulty info */}
                <div className="flex flex-wrap items-center gap-2.5 mb-4 sm:mb-5">
                  <button 
                    onClick={scrollToReviews}
                    className="inline-flex items-center gap-1.5 bg-amber-400/15 dark:bg-amber-400/10 px-2.5 py-1 rounded-xl border border-amber-400/30 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-black hover:bg-amber-400/25 transition-colors cursor-pointer"
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{displayVideo?.averageRating ? Number(displayVideo.averageRating).toFixed(1) : "0.0"}</span>
                  </button>

                  <button 
                    onClick={scrollToReviews}
                    className="text-xs sm:text-sm text-muted-foreground font-semibold hover:text-foreground transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{displayVideo?.reviewCount ?? 0} отзывов</span>
                  </button>

                  <span className="text-muted-foreground/40 hidden sm:inline">•</span>

                  {/* Single, clean difficulty rating indicator */}
                  <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                    <span>Сложность:</span>
                    <TrickDifficultyBadge difficulty={video.difficulty} size="xs" showIcon={false} />
                  </div>
                </div>

                {/* Price Block */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-primary/5 to-muted/40 border border-amber-500/25 mb-5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                      Стоимость курса
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                        {currentPrice} ₽
                      </span>
                      {video.discountPrice && video.price && video.price > video.discountPrice && (
                        <span className="text-xs sm:text-sm text-muted-foreground line-through font-semibold">
                          {video.price} ₽
                        </span>
                      )}
                    </div>
                  </div>

                  {discountPercent && (
                    <div className="flex flex-col items-end">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-sm">
                        -{discountPercent}% Скидка
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                        Экономия {video.discountPrice ? (video.price - Number(video.discountPrice)) : 0} ₽
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons & Security Guarantees */}
              <div ref={mainBuyButtonRef} className="space-y-3.5 pt-2 border-t border-border/60">
                {video.isPurchased ? (
                  <div className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 p-3.5 sm:p-4 rounded-2xl font-black text-center border border-emerald-500/30 flex items-center justify-center gap-2 text-sm sm:text-base">
                    <ShieldCheck className="h-5 w-5" /> Курс куплен. Приятного просмотра!
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <Button 
                      size="lg" 
                      className="w-full h-12 sm:h-13 text-sm sm:text-base font-black rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/30 btn-glow transition-all active:scale-[0.98] cursor-pointer" 
                      onClick={handleBuyNow}
                    >
                      <Zap className="mr-2 h-4 w-4 fill-slate-950" />
                      Купить доступ сейчас
                    </Button>

                    <Button 
                      size="lg" 
                      variant={inCart ? "secondary" : "outline"} 
                      className={`w-full h-11 sm:h-12 font-bold rounded-2xl text-xs sm:text-sm transition-all active:scale-[0.98] cursor-pointer ${
                        inCart ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" : ""
                      }`}
                      onClick={() => {
                        if (inCart) {
                          cart.remove(video.id);
                          toast({ title: "Удалено из корзины" });
                        } else {
                          cart.add({ videoId: video.id, title: video.title, thumbnailUrl: video.thumbnailUrl, price: video.price, discountPrice: video.discountPrice });
                          toast({ title: "Добавлено в корзину" });
                        }
                      }}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {inCart ? "В корзине (Перейти)" : "В корзину"}
                    </Button>
                  </div>
                )}

                {/* Secondary Fast Actions (Favorite & Compare) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={`rounded-xl h-10 font-bold text-xs border-border/70 ${isFav ? "text-red-500 border-red-500/30 bg-red-500/5" : "text-muted-foreground"}`}
                    onClick={() => {
                      favs.toggle(video);
                      toast({ title: isFav ? "Удалено из избранного" : "Добавлено в избранное" });
                    }}
                  >
                    <Heart className={`mr-1.5 h-3.5 w-3.5 ${isFav ? "fill-current" : ""}`} />
                    {isFav ? "В избранном" : "В избранное"}
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm"
                    className={`rounded-xl h-10 font-bold text-xs border-border/70 ${inCompare ? "text-primary border-primary/30 bg-primary/5" : "text-muted-foreground"}`}
                    onClick={() => {
                      if (inCompare) {
                        compare.removeVideo(video.id);
                        toast({ title: "Удалено из сравнения" });
                      } else {
                        compare.addVideo(video);
                        toast({ title: "Добавлено к сравнению" });
                      }
                    }}
                  >
                    <Scale className="mr-1.5 h-3.5 w-3.5" />
                    {inCompare ? "В сравнении" : "Сравнить"}
                  </Button>
                </div>


                {/* Digital Goods Delivery Notice */}
                <div className="text-[11px] text-muted-foreground bg-muted/25 p-3 rounded-xl border border-border/50 space-y-0.5">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="text-amber-500">●</span> Доступ к материалам:
                  </div>
                  <p className="leading-relaxed">
                    Цифровой обучающий видеокурс. Доступ открывается в Личном кабинете сразу после подтверждения успешной онлайн-оплаты.
                  </p>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ── Description Block (Описание курса) ── */}
        <div className="max-w-4xl mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-500 font-bold text-xs uppercase tracking-wider mb-3 border border-amber-400/20">
            <Info className="h-3.5 w-3.5" /> О курсе
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black mb-4 tracking-tight">
            Описание обучающего курса
          </h2>
          <div className="bg-card/90 dark:bg-card/70 p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-border/80 shadow-sm text-foreground/90 text-sm sm:text-base leading-relaxed space-y-3">
            <p>{video.description || "Подробный пошаговый обучающий видеокурс от профессионального иллюзиониста с детальным разбором секретов и приемов."}</p>
          </div>
        </div>

        {/* ── Student Reviews Section (Отзывы учеников) ── */}
        <div id="reviews-section" className="max-w-4xl mb-12 sm:mb-16 pt-6 sm:pt-8 border-t border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-500 font-bold text-xs uppercase tracking-wider mb-2 border border-amber-400/20">
                <Star className="h-3.5 w-3.5 fill-amber-400" /> Реальные отзывы
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2.5">
                Отзывы учеников
                {reviewsList.length > 0 && (
                  <span className="text-xs sm:text-sm font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border">
                    {reviewsList.length}
                  </span>
                )}
              </h2>
            </div>

            {(isPurchasedByUser || video.isPurchased) && (
              <Button
                className="btn-glow font-bold rounded-xl sm:rounded-2xl h-10 sm:h-11 px-4 sm:px-6 self-start sm:self-auto bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm cursor-pointer"
                onClick={() => setReviewModalOpen(true)}
              >
                <Star className={`h-4 w-4 mr-2 ${myExistingReview ? "fill-slate-950" : ""}`} />
                {myExistingReview ? "Редактировать отзыв" : "Оставить отзыв о курсе"}
              </Button>
            )}
          </div>

          {reviewsList.length === 0 ? (
            <div className="bg-card/80 p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-dashed border-border/80 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-400/10 text-amber-500 flex items-center justify-center mx-auto mb-1">
                <Star className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-base sm:text-lg">Пока нет отзывов</h4>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {isPurchasedByUser 
                  ? "Вы прошли этот курс? Поделитесь вашим мнением и помогите другим сделать выбор!" 
                  : "Отзывы появятся после того, как первые ученики пройдут данный курс."}
              </p>
              {isPurchasedByUser && (
                <Button 
                  className="mt-2 btn-glow font-bold rounded-xl px-5 h-10 text-xs bg-amber-400 text-slate-950 hover:bg-amber-300"
                  onClick={() => setReviewModalOpen(true)}
                >
                  Написать первый отзыв
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3.5 sm:space-y-4">
              {reviewsList.map((review: any) => (
                <div 
                  key={review.id}
                  className="bg-card/90 dark:bg-card/70 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 shadow-sm space-y-3 hover:border-amber-400/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center shadow-md shrink-0">
                        {(review.userName || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs sm:text-sm text-foreground flex flex-wrap items-center gap-1.5">
                          <span className="truncate max-w-[130px] sm:max-w-none">{review.userName || "Пользователь"}</span>
                          <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                            <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Покупатель
                          </span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-muted-foreground">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "Недавно"}
                        </div>
                      </div>
                    </div>

                    {/* Stars badge */}
                    <div className="flex items-center gap-0.5 bg-amber-400/10 px-2 sm:px-2.5 py-1 rounded-xl border border-amber-400/20 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                            i < review.rating 
                              ? "fill-amber-400 text-amber-400" 
                              : "text-slate-300 dark:text-slate-700"
                          }`}
                        />
                      ))}
                      <span className="text-[11px] sm:text-xs font-black text-amber-500 ml-1">{review.rating}.0</span>
                    </div>
                  </div>

                  {review.text && (
                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed bg-muted/25 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border/40 italic">
                      «{review.text}»
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 1. Сопутствующие товары — Real related videos from API ── */}
        <div className="mb-12 sm:mb-16 pt-6 sm:pt-8 border-t border-border/60">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-500 font-bold text-xs uppercase tracking-wider mb-1.5 border border-amber-400/20">
                <Package className="h-3.5 w-3.5" /> Пресеты & Плагины
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">Сопутствующие товары</h2>
            </div>
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Дополнения для обучения</span>
          </div>

          {relatedList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {relatedList.slice(0, 3).map((item: any) => {
                const itemDuration = formatDuration(item.durationSeconds) || formatDuration(item.duration);
                return (
                  <div key={item.id} className="group rounded-2xl sm:rounded-3xl bg-card/90 dark:bg-card/70 border border-border/80 shadow-sm p-3.5 sm:p-4 flex flex-col justify-between hover:border-amber-400/40 transition-all hover:shadow-lg">
                    <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden mb-3.5 bg-slate-950">
                      <img
                        src={item.thumbnailUrl || "https://image.qwenlm.ai/public_source/2d826fc3-d8ca-4fdd-afe7-1a198c300694/19903dcea-c171-465f-b4af-c85e8b69b3a5.png"}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {item.categoryName && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-extrabold border border-amber-400/30">
                          {item.categoryName}
                        </span>
                      )}
                      {itemDuration && (
                        <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-semibold text-white/90 bg-slate-950/75 backdrop-blur-md px-2 py-0.5 rounded-md">
                          <Clock className="h-3 w-3 text-amber-400" /> {itemDuration}
                        </span>
                      )}
                    </div>
                    <Link href={`/video/${item.id}`}>
                      <h4 className="font-bold text-xs sm:text-sm leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors cursor-pointer">
                        {item.title}
                      </h4>
                    </Link>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto gap-2">
                      <div className="flex items-baseline gap-1.5">
                        {item.discountPrice ? (
                          <>
                            <span className="font-black text-sm sm:text-base text-primary">{item.discountPrice} ₽</span>
                            <span className="text-[11px] text-muted-foreground line-through">{item.price} ₽</span>
                          </>
                        ) : (
                          <span className="font-black text-sm sm:text-base text-primary">{item.price} ₽</span>
                        )}
                      </div>
                      <Link href={`/video/${item.id}`}>
                        <Button size="sm" className="rounded-full text-[11px] sm:text-xs font-bold px-3 sm:px-3.5 h-8 bg-amber-400 text-slate-950 hover:bg-amber-300 cursor-pointer">
                          <ArrowRight className="h-3 w-3 mr-1" /> Подробнее
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground text-center py-6">Сопутствующие материалы пока не добавлены.</p>
          )}
        </div>

        {/* ── 2. Аналогичные товары — Real similar videos from API ── */}
        <div className="mb-10 sm:mb-12 pt-6 sm:pt-8 border-t border-border/60">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-1.5 border border-primary/20">
                <Layers className="h-3.5 w-3.5" /> Рекомендуемые курсы
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">Аналогичные товары</h2>
            </div>
            <Link href="/catalog">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-amber-500 hover:text-amber-400">
                Все курсы &rarr;
              </Button>
            </Link>
          </div>

          {similarList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {similarList.slice(0, 3).map((item: any) => {
                const itemDuration = formatDuration(item.durationSeconds) || formatDuration(item.duration);
                return (
                  <div key={item.id} className="group rounded-2xl sm:rounded-3xl bg-card/90 dark:bg-card/70 border border-border/80 shadow-sm p-3.5 sm:p-4 flex flex-col justify-between hover:border-amber-400/40 transition-all hover:shadow-lg">
                    <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden mb-3.5 bg-slate-950">
                      <img
                        src={item.thumbnailUrl || "https://image.qwenlm.ai/public_source/2d826fc3-d8ca-4fdd-afe7-1a198c300694/19903dcea-c171-465f-b4af-c85e8b69b3a5.png"}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {item.categoryName && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-extrabold border border-amber-400/30">
                          {item.categoryName}
                        </span>
                      )}
                      {itemDuration && (
                        <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-semibold text-white/90 bg-slate-950/75 backdrop-blur-md px-2 py-0.5 rounded-md">
                          <Clock className="h-3 w-3 text-amber-400" /> {itemDuration}
                        </span>
                      )}
                    </div>
                    <div>
                      <Link href={`/video/${item.id}`}>
                        <h4 className="font-bold text-xs sm:text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors cursor-pointer">
                          {item.title}
                        </h4>
                      </Link>
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground mb-3">
                        <Star className="h-3 w-3 fill-current text-amber-400" />
                        <span className="font-bold text-amber-500">{item.averageRating ? Number(item.averageRating).toFixed(1) : "0.0"}</span>
                        <span>({item.reviewCount ?? 0})</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto gap-2">
                      <div className="flex items-baseline gap-1.5">
                        {item.discountPrice ? (
                          <>
                            <span className="font-black text-sm sm:text-base text-primary">{item.discountPrice} ₽</span>
                            <span className="text-[11px] text-muted-foreground line-through">{item.price} ₽</span>
                          </>
                        ) : (
                          <span className="font-black text-sm sm:text-base text-primary">{item.price} ₽</span>
                        )}
                      </div>
                      <Link href={`/video/${item.id}`}>
                        <Button size="sm" variant="outline" className="rounded-full text-[11px] sm:text-xs font-bold h-8 px-3 hover:border-amber-400 hover:text-amber-500 cursor-pointer">
                          Смотреть &rarr;
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground text-center py-6">Похожие курсы пока не добавлены.</p>
          )}
        </div>

      </div>

      {/* ── Mobile Floating Sticky Bottom Purchase Bar (Screen < lg) ── */}
      {!video.isPurchased && (
        <div 
          className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-border/80 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out transform ${
            showStickyBar ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              {video.thumbnailUrl && (
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title} 
                  className="h-10 w-14 rounded-lg object-cover bg-slate-950 shrink-0 border border-border/50"
                />
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold truncate text-foreground leading-tight">
                  {video.title}
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-sm font-black text-amber-500">
                    {currentPrice} ₽
                  </span>
                  {video.discountPrice && video.price && video.price > video.discountPrice && (
                    <span className="text-[10px] text-muted-foreground line-through">
                      {video.price} ₽
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button 
                size="sm"
                className="btn-glow font-black rounded-xl h-10 px-4 text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md active:scale-95 cursor-pointer"
                onClick={handleBuyNow}
              >
                Купить сейчас
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal for Purchasers */}
      <VideoReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        video={{
          id: video.id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
        }}
        existingReview={myExistingReview ? { id: myExistingReview.id, rating: myExistingReview.rating, text: myExistingReview.text } : null}
        onSuccess={() => {
          refetchReviews();
          queryClient.invalidateQueries({ queryKey: ["video", id] });
        }}
      />

    </div>
  );
}

function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold mb-4">Видео не найдено</h2>
      <Link href="/catalog">
        <Button variant="outline" className="rounded-full">Вернуться в каталог</Button>
      </Link>
    </div>
  );
}
