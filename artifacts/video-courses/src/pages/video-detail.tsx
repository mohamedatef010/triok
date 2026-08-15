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
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { useCompareStore } from "@/hooks/use-compare";
import { Button } from "@/components/ui/button";
import { Star, Heart, ShoppingCart, Info, PlayCircle, Scale, Lock, ShieldCheck, Play, Package, Layers, Sparkles, Clock, ArrowRight, MessageSquare } from "lucide-react";
import { LoadingSpinner, ErrorState } from "@/components/ui/states";
import { useToast } from "@/hooks/use-toast";
import { VideoReviewModal } from "@/components/video-review-modal";
import { useQueryClient } from "@tanstack/react-query";
import ReactPlayer from "react-player";

function formatDuration(seconds?: number | null): string | null {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}ч ${m}мин`;
  }
  return `${m}мин`;
}

export function VideoDetailPage() {
  const [, params] = useRoute("/video/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const { data: apiVideo, isLoading, error } = useGetVideo(id, {
    query: { enabled: !!id }
  });

  const { data: playbackData } = useGetVideoPlayback(id, {
    query: { enabled: !!id, retry: false }
  });

  const { data: relatedVideos } = useGetRelatedVideos(id, {
    query: { enabled: !!id }
  });
  
  const { data: similarVideos } = useGetSimilarVideos(id, {
    query: { enabled: !!id }
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
    query: { enabled: !!id }
  });
  const reviewsList = Array.isArray(realReviews) ? realReviews : [];

  const { data: myPurchasedVideos } = useGetMyPurchasedVideos({
    query: { enabled: isAuthenticated }
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
    ...(displayVideo.averageRating && displayVideo.reviewCount ? {
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
  const [showPurchaseOverlay, setShowPurchaseOverlay] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Reliable fallback video URLs (hosted on W3C)
  const FALLBACK_VIDEO = "https://media.w3.org/2010/05/sintel/trailer.mp4";

  useEffect(() => {
    // Reset state on id change
    setIsPlaying(false);
    setShowPurchaseOverlay(false);
    setVideoError(false);
  }, [id]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    // Prevent the error from propagating to Vite's runtime error plugin
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget;
    // Try fallback if current src is not already the fallback
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
    
    // If we have playbackData, trust it
    if (playbackData?.type === "full") return;
    if (playbackData?.type === "preview") {
       // Just let it play to the end, the backend already clipped it
       return;
    }

    // Fallback for demo videos
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
      setLocation(`/auth/login?redirect=/video/${id}`);
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

  if (isLoading && !video) return <LoadingSpinner />;
  if (error && !video) return <ErrorState error={error} />;
  if (!video) return <NotFound />;

  const isFav = favs.isFavorite(video.id);
  const inCart = cart.isInCart(video.id);
  const inCompare = !!compare.videos.find(v => v.id === video.id);

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Top Section */}
      <div className="flex flex-col lg:flex-row gap-10 mb-16">
        
        {/* Player / Thumbnail */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <div className="relative aspect-video bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
            {!isPlaying ? (
              <>
                <img 
                  src={video.thumbnailUrl || undefined} 
                  alt={video.title} 
                  className="w-full h-full object-cover filter brightness-[0.8] group-hover:scale-105 transition-transform duration-700"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col items-center justify-center p-6 text-center">
                  {showPurchaseOverlay ? (
                    <div className="bg-slate-950/90 border border-amber-400/40 backdrop-blur-xl p-8 rounded-3xl max-w-md animate-in zoom-in-95 duration-300">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-400 mb-4 border border-amber-400/30">
                        <Lock className="h-7 w-7" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Бесплатный превью-просмотр завершен</h3>
                      <p className="text-sm text-slate-300 mb-6">Для продолжения просмотра приобретите полный доступ к курсу.</p>
                      <Button size="lg" className="btn-glow font-bold w-full rounded-2xl h-12" onClick={handleBuyNow}>
                        Купить полный доступ ({video.discountPrice || video.price} ₽)
                      </Button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        if (!isAuthenticated) {
                          setLocation(`/auth/login?redirect=/video/${id}`);
                          return;
                        }
                        setIsPlaying(true);
                      }}
                      className="group/play flex flex-col items-center gap-3 focus:outline-none"
                    >
                      <div className="h-20 w-20 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-400/50 group-hover/play:scale-115 transition-transform duration-300">
                        <Play className="h-9 w-9 fill-current ml-1" />
                      </div>
                      <span className="text-white font-bold text-base bg-slate-950/80 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
                        Смотреть превью (20% бесплатно)
                      </span>
                    </button>
                  )}
                </div>
              </>
            ) : videoError ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white gap-4 p-8">
                <div className="h-16 w-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                  <PlayCircle className="h-8 w-8 text-amber-400" />
                </div>
                <p className="text-slate-300 text-sm text-center">Видео недоступно для воспроизведения в браузере</p>
                <button
                  onClick={() => { setVideoError(false); setIsPlaying(false); }}
                  className="text-xs text-amber-400 underline underline-offset-4 hover:text-amber-300"
                >
                  Вернуться к превью
                </button>
              </div>
            ) : (
              <ReactPlayer
                ref={playerRef}
                url={playbackData?.manifestUrl || video.videoUrl || FALLBACK_VIDEO}
                playing={isPlaying}
                controls
                width="100%"
                height="100%"
                className="bg-black object-contain absolute top-0 left-0"
                onProgress={handleTimeUpdate}
                onEnded={handleEnded}
                onError={() => setVideoError(true)}
                config={{ file: { forceHLS: true, attributes: { controlsList: 'nodownload', preload: 'metadata' } } }}
                onContextMenu={(e: any) => e.preventDefault()}
              />
            )}
          </div>
        </div>

        {/* Sidebar Info Card */}
        <div className="w-full lg:w-1/3 flex flex-col">
          <div className="bg-card border rounded-3xl p-8 shadow-xl flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-500 font-bold text-xs border border-amber-400/20">
                  {video.categoryName || "Фокусы"}
                </span>
                {(video.duration || video.durationSeconds) && (
                  <span className="text-xs text-muted-foreground font-semibold">
                    • {video.duration || formatDuration(video.durationSeconds)}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-4">{video.title}</h1>

              <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 text-sm">
                <Star className="h-4 w-4 fill-current mr-1 text-amber-400" />
                <span>{displayVideo?.averageRating ? Number(displayVideo.averageRating).toFixed(1) : "0.0"}</span>
              </div>
              <span className="text-sm text-muted-foreground font-medium">({displayVideo?.reviewCount ?? 0} отзывов)</span>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border mb-6 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Стоимость курса:</span>
                <div className="flex items-baseline gap-2">
                  {video.discountPrice ? (
                    <>
                      <span className="text-3xl font-black text-primary">{video.discountPrice} ₽</span>
                      <span className="text-sm text-muted-foreground line-through">{video.price} ₽</span>
                    </>
                  ) : (
                    <span className="text-3xl font-black text-primary">{video.price} ₽</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              {video.isPurchased ? (
                <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-2xl font-bold text-center border border-emerald-500/30 flex items-center justify-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> Курс куплен. Приятного просмотра!
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button size="lg" className="w-full h-14 text-base font-black btn-glow rounded-2xl" onClick={handleBuyNow}>
                    Купить доступ сейчас
                  </Button>
                  <Button 
                    size="lg" 
                    variant={inCart ? "secondary" : "outline"} 
                    className="w-full h-14 font-bold rounded-2xl"
                    onClick={() => {
                      if (inCart) cart.remove(video.id);
                      else cart.add({ videoId: video.id, title: video.title, thumbnailUrl: video.thumbnailUrl, price: video.price, discountPrice: video.discountPrice });
                      toast({ title: inCart ? "Удалено из корзины" : "Добавлено в корзину" });
                    }}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {inCart ? "В корзине" : "В корзину"}
                  </Button>
                </div>
              )}

              {/* Digital Goods Delivery Notice */}
              <div className="text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-2xl border border-border/60 text-left space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="text-amber-500 font-bold">●</span> Доступ к материалам:
                </div>
                <div>
                  Цифровой обучающий видеокурс. Доступ открывается в вашем Личном кабинете сразу после подтверждения успешной онлайн-оплаты.
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button 
                  variant="ghost" 
                  className={`flex-1 rounded-xl font-bold ${isFav ? "text-red-500" : "text-muted-foreground"}`}
                  onClick={() => {
                    favs.toggle(video);
                    toast({ title: isFav ? "Удалено из избранного" : "Добавлено в избранное" });
                  }}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                  {isFav ? "В избранном" : "В избранное"}
                </Button>
                <div className="w-px h-6 bg-border"></div>
                <Button 
                  variant="ghost" 
                  className={`flex-1 rounded-xl font-bold ${inCompare ? "text-primary" : "text-muted-foreground"}`}
                  onClick={() => {
                    if (inCompare) compare.removeVideo(video.id);
                    else compare.addVideo(video);
                    toast({ title: inCompare ? "Удалено из сравнения" : "Добавлено к сравнению" });
                  }}
                >
                  <Scale className="mr-2 h-4 w-4" />
                  Сравнить
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Description Block */}
      <div className="max-w-4xl mb-12">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2.5">
          <Info className="h-6 w-6 text-amber-400" /> Описание курса
        </h2>
        <div className="bg-card p-8 rounded-3xl border shadow-sm text-foreground/90 text-lg leading-relaxed">
          <p>{video.description || "Подробный пошаговый обучающий видеокурс от профессионального иллюзиониста."}</p>
        </div>
      </div>

      {/* ── Student Reviews Section (Отзывы учеников) ── */}
      <div className="max-w-4xl mb-16 pt-8 border-t border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/10 text-amber-500 font-bold text-xs uppercase tracking-wider mb-2 border border-amber-400/20">
              <Star className="h-3.5 w-3.5 fill-amber-400" /> Реальные отзывы
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              Отзывы учеников
              {reviewsList.length > 0 && (
                <span className="text-sm font-bold text-muted-foreground bg-muted px-3 py-0.5 rounded-full border">
                  {reviewsList.length}
                </span>
              )}
            </h2>
          </div>

          {(isPurchasedByUser || video.isPurchased) && (
            <Button
              className="btn-glow font-bold rounded-2xl h-11 px-6 self-start sm:self-auto"
              onClick={() => setReviewModalOpen(true)}
            >
              <Star className={`h-4 w-4 mr-2 ${myExistingReview ? "fill-amber-400" : ""}`} />
              {myExistingReview ? "Редактировать мой отзыв" : "Оставить отзыв о курсе"}
            </Button>
          )}
        </div>

        {reviewsList.length === 0 ? (
          <div className="bg-card p-8 sm:p-10 rounded-3xl border border-dashed text-center space-y-3">
            <Star className="h-10 w-10 text-amber-400/40 mx-auto mb-2" />
            <h4 className="font-bold text-lg">Пока нет отзывов</h4>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {isPurchasedByUser 
                ? "Вы прошли этот курс? Поделитесь вашим мнением и помогите другим сделать выбор!" 
                : "Отзывы появятся после того, как первые ученики пройдут данный курс."}
            </p>
            {isPurchasedByUser && (
              <Button 
                className="mt-2 btn-glow font-bold rounded-xl px-6"
                onClick={() => setReviewModalOpen(true)}
              >
                Написать первый отзыв
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reviewsList.map((review: any) => (
              <div 
                key={review.id}
                className="bg-card p-6 rounded-3xl border border-border/80 shadow-sm space-y-3 hover:border-amber-400/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shrink-0">
                      {(review.userName || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-foreground flex items-center gap-2">
                        <span>{review.userName || "Пользователь"}</span>
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-500 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <ShieldCheck className="h-3 w-3" /> Покупатель
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "Недавно"}
                      </div>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 bg-amber-400/10 px-2.5 py-1 rounded-xl border border-amber-400/20">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < review.rating 
                            ? "fill-amber-400 text-amber-400" 
                            : "text-slate-300 dark:text-slate-700"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-black text-amber-500 ml-1.5">{review.rating}.0</span>
                  </div>
                </div>

                {review.text && (
                  <p className="text-sm text-foreground/90 leading-relaxed bg-muted/25 p-4 rounded-2xl border border-border/40 italic">
                    «{review.text}»
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 1. Сопутствующие товары — Real related videos from API ── */}
      <div className="mb-16 pt-8 border-t border-border/60">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/10 text-amber-500 font-bold text-xs uppercase tracking-wider mb-2 border border-amber-400/20">
              <Package className="h-3.5 w-3.5" /> Пресеты & Плагины
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Сопутствующие товары</h2>
          </div>
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Дополнения для ускорения работы</span>
        </div>

        {relatedList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedList.slice(0, 3).map((item: any) => {
              const itemDuration = item.duration || formatDuration(item.durationSeconds);
              return (
                <div key={item.id} className="group glass-card-hover rounded-3xl bg-card border shadow-sm p-4 flex flex-col justify-between hover:border-amber-400/40">
                  <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-slate-950">
                    <img
                      src={item.thumbnailUrl || "https://image.qwenlm.ai/public_source/2d826fc3-d8ca-4fdd-afe7-1a198c300694/19903dcea-c171-465f-b4af-c85e8b69b3a5.png"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.categoryName && (
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-extrabold border border-amber-400/30">
                        {item.categoryName}
                      </span>
                    )}
                    {itemDuration && (
                      <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-[10px] font-semibold text-white/90 bg-slate-950/70 backdrop-blur-md px-2 py-0.5 rounded-md">
                        <Clock className="h-3 w-3 text-amber-400" /> {itemDuration}
                      </span>
                    )}
                  </div>
                  <Link href={`/video/${item.id}`}>
                    <h4 className="font-bold text-sm leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors cursor-pointer">
                      {item.title}
                    </h4>
                  </Link>
                  <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
                    <div className="flex items-baseline gap-1.5">
                      {item.discountPrice ? (
                        <>
                          <span className="font-black text-base text-primary">{item.discountPrice} ₽</span>
                          <span className="text-xs text-muted-foreground line-through">{item.price} ₽</span>
                        </>
                      ) : (
                        <span className="font-black text-base text-primary">{item.price} ₽</span>
                      )}
                    </div>
                    <Link href={`/video/${item.id}`}>
                      <Button size="sm" className="rounded-full text-xs font-bold px-3.5 bg-amber-400 text-slate-950 hover:bg-amber-300">
                        <ArrowRight className="h-3.5 w-3.5 mr-1" /> Подробнее
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Сопутствующие материалы пока не добавлены.</p>
        )}
      </div>

      {/* ── 2. Аналогичные товары — Real similar videos from API ── */}
      <div className="mb-12 pt-8 border-t border-border/60">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-2 border border-primary/20">
              <Layers className="h-3.5 w-3.5" /> Рекомендуемые курсы
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Аналогичные товары</h2>
          </div>
          <Link href="/catalog">
            <Button variant="ghost" className="text-xs font-bold text-amber-500 hover:text-amber-400">
              Все курсы &rarr;
            </Button>
          </Link>
        </div>

        {similarList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarList.slice(0, 3).map((item: any) => {
              const itemDuration = item.duration || formatDuration(item.durationSeconds);
              return (
                <div key={item.id} className="group glass-card-hover rounded-3xl bg-card border shadow-sm p-4 flex flex-col justify-between hover:border-amber-400/40">
                  <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-slate-950">
                    <img
                      src={item.thumbnailUrl || "https://image.qwenlm.ai/public_source/2d826fc3-d8ca-4fdd-afe7-1a198c300694/19903dcea-c171-465f-b4af-c85e8b69b3a5.png"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.categoryName && (
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-extrabold border border-amber-400/30">
                        {item.categoryName}
                      </span>
                    )}
                    {itemDuration && (
                      <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-[10px] font-semibold text-white/90 bg-slate-950/70 backdrop-blur-md px-2 py-0.5 rounded-md">
                        <Clock className="h-3 w-3 text-amber-400" /> {itemDuration}
                      </span>
                    )}
                  </div>
                  <div>
                    <Link href={`/video/${item.id}`}>
                      <h4 className="font-bold text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors cursor-pointer">
                        {item.title}
                      </h4>
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
                      <span className="font-bold text-amber-400">{item.averageRating ? Number(item.averageRating).toFixed(1) : "0.0"}</span>
                      <span>({item.reviewCount ?? 0} отзывов)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
                    <div className="flex items-baseline gap-1.5">
                      {item.discountPrice ? (
                        <>
                          <span className="font-black text-base text-primary">{item.discountPrice} ₽</span>
                          <span className="text-xs text-muted-foreground line-through">{item.price} ₽</span>
                        </>
                      ) : (
                        <span className="font-black text-base text-primary">{item.price} ₽</span>
                      )}
                    </div>
                    <Link href={`/video/${item.id}`}>
                      <Button size="sm" variant="outline" className="rounded-full text-xs font-bold hover:border-amber-400 hover:text-amber-500">
                        Смотреть &rarr;
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Похожие курсы пока не добавлены.</p>
        )}
      </div>

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
