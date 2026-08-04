import { useState, useRef, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { 
  useGetVideo, 
  useGetRelatedVideos, 
  useGetSimilarVideos,
  useCreateOrder
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { useCompareStore } from "@/hooks/use-compare";
import { Button } from "@/components/ui/button";
import { Star, Heart, ShoppingCart, Info, PlayCircle, Scale } from "lucide-react";
import { LoadingSpinner, ErrorState } from "@/components/ui/states";
import { useToast } from "@/hooks/use-toast";

export function VideoDetailPage() {
  const [, params] = useRoute("/video/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const { data: video, isLoading, error } = useGetVideo(id, {
    query: { enabled: !!id }
  });

  const cart = useCart();
  const favs = useFavorites();
  const compare = useCompareStore();
  const createOrder = useCreateOrder();

  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPurchaseOverlay, setShowPurchaseOverlay] = useState(false);

  useEffect(() => {
    // Reset state on id change
    setIsPlaying(false);
    setShowPurchaseOverlay(false);
  }, [id]);

  const handleTimeUpdate = () => {
    if (!video || !videoRef.current) return;
    
    // If purchased, allow full play
    if (video.isPurchased) return;

    // If not purchased, restrict to 20%
    const duration = videoRef.current.duration;
    const currentTime = videoRef.current.currentTime;
    
    if (duration > 0 && currentTime > duration * 0.2) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowPurchaseOverlay(true);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      setLocation(`/auth/login?redirect=/video/${id}`);
      return;
    }
    try {
      const order = await createOrder.mutateAsync({ data: { videoId: id, fromCart: false } });
      setLocation(`/payment/${order.id}`);
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err.message || "Не удалось перейти к оплате",
        variant: "destructive"
      });
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;
  if (!video) return <NotFound />;

  const isFav = favs.isFavorite(video.id);
  const inCart = cart.isInCart(video.id);
  const inCompare = !!compare.videos.find(v => v.id === video.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Top Section */}
      <div className="flex flex-col lg:flex-row gap-8 mb-16">
        
        {/* Player / Thumbnail */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-xl ring-1 ring-border">
            {!isPlaying ? (
              <>
                <img 
                  src={video.thumbnailUrl || undefined} 
                  alt={video.title} 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="w-20 h-20 rounded-full bg-black/50 border-white/20 text-white hover:bg-black/70 hover:scale-105 transition-all"
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast({ title: "Требуется авторизация", description: "Войдите, чтобы посмотреть демо-версию" });
                        setLocation(`/auth/login?redirect=/video/${id}`);
                        return;
                      }
                      setIsPlaying(true);
                      setTimeout(() => videoRef.current?.play(), 0);
                    }}
                  >
                    <PlayCircle className="w-12 h-12" />
                  </Button>
                </div>
              </>
            ) : (
              <video 
                ref={videoRef}
                src={video.isPurchased ? video.videoUrl! : (video.previewVideoUrl || video.videoUrl!)}
                controls
                controlsList="nodownload"
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                autoPlay
              />
            )}

            {showPurchaseOverlay && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm z-10">
                <h3 className="text-2xl font-bold text-white mb-2">Демо-версия завершена</h3>
                <p className="text-slate-300 mb-6 max-w-md">
                  Вы посмотрели 20% урока. Чтобы продолжить просмотр и получить полный доступ ко всем материалам, необходимо приобрести курс.
                </p>
                <div className="flex gap-4">
                  <Button size="lg" onClick={handleBuyNow}>Купить полную версию</Button>
                  <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={() => {
                    setShowPurchaseOverlay(false);
                    setIsPlaying(false);
                    if (videoRef.current) videoRef.current.currentTime = 0;
                  }}>
                    Смотреть сначала
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info & Buy Panel */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div>
            {video.categoryName && (
              <div className="text-sm font-medium text-primary mb-2 uppercase tracking-wider">
                {video.categoryName}
              </div>
            )}
            <h1 className="text-3xl font-bold leading-tight mb-4">{video.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center text-amber-500">
                <Star className="h-4 w-4 fill-current mr-1" />
                <span className="font-medium text-foreground text-base">{video.averageRating.toFixed(1)}</span>
              </div>
              <span>{video.reviewCount} отзывов</span>
              <span>{video.viewCount} просмотров</span>
            </div>
            
            <div className="bg-muted/30 rounded-2xl p-6 border shadow-sm flex flex-col gap-6">
              <div className="flex items-end gap-3">
                {video.discountPrice ? (
                  <>
                    <span className="font-bold text-4xl text-primary">{video.discountPrice} ₽</span>
                    <span className="text-xl text-muted-foreground line-through pb-1">{video.price} ₽</span>
                  </>
                ) : (
                  <span className="font-bold text-4xl text-primary">{video.price} ₽</span>
                )}
              </div>

              {video.isPurchased ? (
                <div className="bg-primary/10 text-primary p-4 rounded-xl font-medium text-center border border-primary/20">
                  Курс уже куплен. Приятного просмотра!
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button size="lg" className="w-full h-14 text-lg" onClick={handleBuyNow}>
                    Купить сейчас
                  </Button>
                  <Button 
                    size="lg" 
                    variant={inCart ? "secondary" : "outline"} 
                    className="w-full h-14"
                    onClick={() => {
                      if (inCart) cart.remove(video.id);
                      else cart.add({ videoId: video.id, title: video.title, thumbnailUrl: video.thumbnailUrl, price: video.price, discountPrice: video.discountPrice });
                    }}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {inCart ? "В корзине" : "В корзину"}
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t">
                <Button 
                  variant="ghost" 
                  className={`flex-1 ${isFav ? "text-red-500" : "text-muted-foreground"}`}
                  onClick={() => favs.toggle(video)}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                  {isFav ? "В избранном" : "В избранное"}
                </Button>
                <div className="w-px h-6 bg-border"></div>
                <Button 
                  variant="ghost" 
                  className={`flex-1 ${inCompare ? "text-primary" : "text-muted-foreground"}`}
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

      {/* Description */}
      <div className="max-w-4xl mb-16">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Info className="h-6 w-6 text-primary" /> Описание курса
        </h2>
        <div className="prose dark:prose-invert prose-slate max-w-none">
          <p className="text-lg leading-relaxed">{video.description || "Описание отсутствует."}</p>
        </div>
      </div>

      {/* Reviews (Placeholder for UI completeness) */}
      <div className="max-w-4xl mb-16">
        <h2 className="text-2xl font-bold mb-6">Отзывы ({video.reviewCount})</h2>
        <div className="bg-muted/20 border rounded-2xl p-8 text-center text-muted-foreground">
          {video.reviewCount === 0 ? "Пока нет отзывов. Станьте первым!" : "Отзывы загружаются..."}
        </div>
      </div>
    </div>
  );
}

// Temporary NotFound stub
function NotFound() {
  return <div>Not found</div>;
}
