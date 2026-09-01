import { useState } from "react";
import { useSEO } from "@/hooks/use-seo";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  useUpdateMe, 
  useGetMyPurchasedVideos, 
  useListOrders,
} from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/states";
import { 
  Play, 
  Settings, 
  ShoppingBag, 
  Edit3, 
  User, 
  CheckCircle2, 
  Award, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Star,
  MessageSquare,
  Trash2,
  BookOpen,
  TrendingUp,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VideoReviewModal } from "@/components/video-review-modal";

export function ProfilePage() {
  useSEO({ title: "Личный кабинет | Профиль", robots: "noindex, follow" });
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading, logout, refetch: refetchUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedVideoForReview, setSelectedVideoForReview] = useState<{
    id: number;
    title: string;
    thumbnailUrl?: string | null;
  } | null>(null);
  const [selectedExistingReview, setSelectedExistingReview] = useState<{
    id?: number;
    rating: number;
    text?: string | null;
  } | null>(null);

  // Fetch real purchased videos
  const { data: videos, isLoading: videosLoading, refetch: refetchVideos } = useGetMyPurchasedVideos({
    query: { enabled: isAuthenticated } as any
  });
  const videoList = Array.isArray(videos) ? videos : [];

  // Fetch real orders
  const { data: orders, isLoading: ordersLoading } = useListOrders({
    query: { enabled: isAuthenticated } as any
  });

  const orderList = Array.isArray(orders) ? orders : [];

  // Fetch my reviews
  const { data: myReviewsData, refetch: refetchMyReviews } = useQuery({
    queryKey: ["my-reviews"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return [];
      const res = await fetch("/api/reviews/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated
  });
  const myReviewsList = Array.isArray(myReviewsData) ? myReviewsData : [];

  const updateMe = useUpdateMe();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: "", phone: "" });

  if (authLoading) return <LoadingSpinner />;

  const activeUser = isAuthenticated && user ? user : null;
  const activeVideos = videoList;
  const activeOrders = orderList;
  const activeReviews = myReviewsList;

  // Map videoId to user's existing review
  const reviewsByVideoId = new Map<number, any>();
  activeReviews.forEach((rev: any) => {
    reviewsByVideoId.set(rev.videoId, rev);
  });

  const handleSaveProfile = async () => {
    try {
      await updateMe.mutateAsync({ data: editData });
      await refetchUser();
      setIsEditing(false);
      toast({ title: "Профиль успешно обновлен" });
    } catch (err) {
      toast({ title: "Ошибка обновления", variant: "destructive" });
    }
  };

  const handleOpenReview = (video: { id: number; title: string; thumbnailUrl?: string | null }) => {
    const existing = reviewsByVideoId.get(video.id);
    setSelectedVideoForReview(video);
    setSelectedExistingReview(existing ? { id: existing.id, rating: existing.rating, text: existing.text } : null);
    setReviewModalOpen(true);
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error("Не удалось удалить отзыв");
      toast({ title: "Отзыв удален" });
      refetchMyReviews();
      refetchVideos();
      queryClient.invalidateQueries({ queryKey: ["site-settings", "reviews_section"] });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message || "Ошибка при удалении", variant: "destructive" });
    }
  };


  const statusMap: Record<string, { label: string, color: string }> = {
    pending: { label: "Ожидает оплаты", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    paid: { label: "Оплачен", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    failed: { label: "Ошибка оплаты", color: "text-red-500 bg-red-500/10 border-red-500/20" },
    cancelled: { label: "Отменен", color: "text-slate-500 bg-slate-500/10 border-slate-500/20" },
  };

  // If user is guest and demo mode is OFF, render sleek login prompt / demo mode launcher
  if (!activeUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center container mx-auto px-4 py-16 max-w-4xl relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full bg-card/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-8 md:p-14 shadow-2xl text-center relative overflow-hidden">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400/20 to-amber-500/10 text-amber-500 mb-6 border border-amber-400/30 shadow-lg animate-pulse">
            <User className="h-10 w-10" />
          </div>

          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-foreground">
            Личный кабинет
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-lg mx-auto leading-relaxed">
            Войдите в аккаунт, чтобы просматривать купленные видеоуроки, оставлять отзывы, отслеживать прогресс и управлять заказами.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Button size="lg" className="btn-glow font-bold h-14 px-8 rounded-2xl w-full" asChild>
              <Link href="/auth/login">
                Войти в аккаунт <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="font-semibold h-14 px-8 rounded-2xl w-full border-border/80" asChild>
              <Link href="/auth/register">
                Регистрация
              </Link>
            </Button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-5xl relative z-10 space-y-8">

        {/* ── 1. Hero User Profile Card (Rich Glassmorphic Design) ── */}
        <div className="bg-card/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-border/80 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5 sm:gap-6">
            <div className="relative">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-500 to-primary text-slate-950 flex items-center justify-center text-3xl sm:text-4xl font-black shadow-xl shadow-amber-500/20 border-2 border-white/20">
                {(activeUser.name ?? "U").charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-md border-2 border-card">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {activeUser.name ?? "Пользователь"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-black">
                  <ShieldCheck className="h-3.5 w-3.5" /> PRO Ученик
                </span>
              </div>
              <p className="text-muted-foreground text-sm font-medium">{activeUser.email}</p>
              {activeUser.phone && (
                <p className="text-xs text-muted-foreground font-mono">{activeUser.phone}</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end pt-4 md:pt-0 border-t md:border-t-0 border-border/60">
            {!isEditing && (
              <Button 
                variant="outline" 
                className="rounded-2xl font-bold h-11 px-5 border-border/80 hover:border-amber-400/50" 
                onClick={() => {
                  setEditData({ name: activeUser.name || "", phone: activeUser.phone || "" });
                  setIsEditing(true);
                }}
              >
                <Edit3 className="mr-2 h-4 w-4 text-amber-500" /> Редактировать
              </Button>
            )}

            {isAuthenticated && (
              <Button 
                variant="ghost" 
                className="rounded-2xl text-destructive hover:bg-destructive/10 font-bold h-11 px-5" 
                onClick={() => logout()}
              >
                Выйти
              </Button>
            )}
          </div>
        </div>

        {/* ── Edit Profile Form ── */}
        {isEditing && (
          <div className="bg-card p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-amber-500" /> Редактирование личных данных
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase">Ваше Имя (отображается в отзывах)</label>
                <Input 
                  value={editData.name} 
                  onChange={e => setEditData({...editData, name: e.target.value})} 
                  placeholder="Иван Иванов"
                  className="rounded-xl h-12 bg-background border-border/80 font-medium" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase">Телефон</label>
                <Input 
                  value={editData.phone} 
                  onChange={e => setEditData({...editData, phone: e.target.value})} 
                  placeholder="+7 (999) 000-00-00" 
                  className="rounded-xl h-12 bg-background border-border/80 font-medium" 
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSaveProfile} disabled={updateMe.isPending} className="btn-glow font-bold rounded-xl px-6 h-11">
                Сохранить данные
              </Button>
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl h-11">
                Отмена
              </Button>
            </div>
          </div>
        )}

        {/* ── 2. Sleek Metrics Dashboard (4 Cards) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center gap-4 hover:border-amber-400/30 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-amber-400/10 text-amber-500 flex items-center justify-center font-bold border border-amber-400/20 shrink-0">
              <Play className="h-6 w-6 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-black leading-none mb-1">{activeVideos.length}</div>
              <div className="text-xs text-muted-foreground font-semibold">Куплено обучение</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center gap-4 hover:border-amber-400/30 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold border border-amber-500/20 shrink-0">
              <Star className="h-6 w-6 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-black leading-none mb-1">{activeReviews.length}</div>
              <div className="text-xs text-muted-foreground font-semibold">Оставлено отзывов</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center gap-4 hover:border-amber-400/30 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold border border-emerald-500/20 shrink-0">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-black leading-none mb-1">{activeOrders.length}</div>
              <div className="text-xs text-muted-foreground font-semibold">Всего заказов</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center gap-4 hover:border-amber-400/30 transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-black leading-none mb-1">100%</div>
              <div className="text-xs text-muted-foreground font-semibold">Доступ навсегда</div>
            </div>
          </div>
        </div>

        {/* ── 3. Main Cabinet Tabs ── */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="mb-8 p-1.5 bg-muted/60 w-full sm:w-auto flex flex-wrap h-auto rounded-2xl border border-border/80 gap-1">
            <TabsTrigger value="videos" className="flex-1 sm:flex-none py-3 px-6 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md">
              <Play className="mr-2 h-4 w-4 text-amber-400 fill-current" /> Мое обучение ({activeVideos.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 sm:flex-none py-3 px-6 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md">
              <Star className="mr-2 h-4 w-4 text-amber-400 fill-current" /> Мои отзывы ({activeReviews.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 sm:flex-none py-3 px-6 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md">
              <ShoppingBag className="mr-2 h-4 w-4 text-primary" /> История заказов ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 sm:flex-none py-3 px-6 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md">
              <Settings className="mr-2 h-4 w-4" /> Настройки
            </TabsTrigger>
          </TabsList>

          {/* ──────── TAB 1: MY PURCHASED COURSES ──────── */}
          <TabsContent value="videos" className="min-h-[350px]">
            {videosLoading && isAuthenticated ? (
              <LoadingSpinner />
            ) : activeVideos.length === 0 ? (
              <div className="text-center py-20 bg-card border border-dashed rounded-3xl p-8 max-w-lg mx-auto">
                <div className="h-16 w-16 rounded-3xl bg-amber-400/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-400/20">
                  <Play className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">У вас пока нет купленного обучения</h3>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  Выберите интересующий фокус или трюк и начните обучение прямо сейчас!
                </p>
                <Button asChild className="btn-glow font-bold rounded-2xl px-8 h-12">
                  <Link href="/catalog">Перейти в каталог Обучение</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeVideos.map((video: any) => {
                  const existingReview = reviewsByVideoId.get(video.id);

                  return (
                    <div 
                      key={video.id} 
                      className="group flex flex-col bg-card rounded-3xl border border-border/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-400/40 transition-all duration-300"
                    >
                      {/* Video Thumbnail */}
                      <div className="relative aspect-video bg-slate-950 overflow-hidden">
                        <img 
                          src={video.thumbnailUrl || "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800"} 
                          alt={video.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/video/${video.id}`}>
                            <div className="h-14 w-14 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                              <Play className="h-6 w-6 fill-current ml-0.5" />
                            </div>
                          </Link>
                        </div>
                        {video.categoryName && (
                          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-extrabold border border-amber-400/30">
                            {video.categoryName}
                          </span>
                        )}
                      </div>

                      {/* Video Content */}
                      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between space-y-4">
                        <div>
                          <Link href={`/video/${video.id}`}>
                            <h4 className="font-extrabold text-base line-clamp-2 leading-snug group-hover:text-primary transition-colors cursor-pointer mb-2">
                              {video.title}
                            </h4>
                          </Link>

                          {/* Existing Review Badge on Course Card */}
                          {existingReview ? (
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-500 mb-2">
                              <span className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span>Ваша оценка: {existingReview.rating}/5</span>
                              </span>
                              <span className="text-[10px] opacity-75">Опубликовано</span>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Вы можете оставить отзыв и поставить оценку этому курсу.
                            </p>
                          )}
                        </div>

                        {/* Card Action Buttons */}
                        <div className="space-y-2 pt-2 border-t border-border/60">
                          <Button size="sm" className="w-full font-bold rounded-xl h-11 btn-glow" asChild>
                            <Link href={`/video/${video.id}`}>
                              <Play className="h-4 w-4 mr-2 fill-current" /> Смотреть видео
                            </Link>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReview(video)}
                            className="w-full font-bold rounded-xl h-10 border-border/80 hover:border-amber-400 hover:text-amber-500 transition-colors"
                          >
                            <Star className={`h-4 w-4 mr-1.5 ${existingReview ? "fill-amber-400 text-amber-400" : "text-amber-400"}`} />
                            {existingReview ? "Редактировать мой отзыв" : "Оставить отзыв об обучении"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ──────── TAB 2: MY REVIEWS (Customer Reviews & Ratings) ──────── */}
          <TabsContent value="reviews" className="min-h-[350px]">
            <div className="space-y-6">
              {activeReviews.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-border/80 bg-card/50 max-w-lg mx-auto">
                  <div className="h-16 w-16 rounded-3xl bg-amber-400/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-400/20 shadow-sm">
                    <Star className="h-8 w-8 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-black mb-2">Вы еще не оставили отзывов</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                    Поделитесь впечатлениями о пройденном обучении. Ваш отзыв поможет другим иллюзионистам сделать правильный выбор.
                  </p>
                  {activeVideos.length > 0 ? (
                    <Button 
                      className="rounded-full px-6 font-bold btn-glow"
                      onClick={() => handleOpenReview(activeVideos[0])}
                    >
                      Оставить первый отзыв
                    </Button>
                  ) : (
                    <Button asChild className="rounded-full px-6 font-bold btn-glow">
                      <Link href="/catalog">Выбрать обучение в каталоге</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {activeReviews.map((review: any) => (
                    <div 
                      key={review.id} 
                      className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col sm:flex-row items-start justify-between gap-5 hover:border-amber-400/30 transition-colors"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        {review.videoThumbnailUrl && (
                          <img 
                            src={review.videoThumbnailUrl} 
                            alt={review.videoTitle} 
                            className="w-20 h-14 object-cover rounded-xl border shrink-0 bg-slate-950" 
                          />
                        )}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Link href={`/video/${review.videoId}`}>
                              <h4 className="font-extrabold text-base hover:text-primary transition-colors cursor-pointer">
                                {review.videoTitle || "Урок"}
                              </h4>
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString("ru-RU") : "Недавно"}
                            </span>
                          </div>

                          {/* Star Rating Display */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} 
                              />
                            ))}
                            <span className="text-xs font-black ml-1.5 text-foreground">{review.rating}/5</span>
                          </div>

                          {/* Review Text */}
                          {review.text && (
                            <p className="text-sm text-foreground/90 leading-relaxed bg-muted/30 p-3.5 rounded-2xl border border-border/40 italic">
                              «{review.text}»
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end sm:self-start">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl font-semibold text-xs h-9"
                          onClick={() => {
                            setSelectedVideoForReview({
                              id: review.videoId,
                              title: review.videoTitle || "Урок",
                              thumbnailUrl: review.videoThumbnailUrl
                            });
                            setSelectedExistingReview({
                              id: review.id,
                              rating: review.rating,
                              text: review.text
                            });
                            setReviewModalOpen(true);
                          }}
                        >
                          <Edit3 className="h-3.5 w-3.5 mr-1 text-amber-500" /> Изменить
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-xl text-xs h-9 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ──────── TAB 3: ORDERS HISTORY ──────── */}
          <TabsContent value="orders" className="min-h-[350px]">
            {ordersLoading && isAuthenticated ? (
              <LoadingSpinner />
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground bg-card border rounded-3xl p-8 max-w-lg mx-auto">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <h4 className="text-lg font-bold mb-1">Заказов пока нет</h4>
                <p className="text-xs text-muted-foreground mb-4">История ваших покупок будет отображаться здесь.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {activeOrders.map((order: any) => {
                  const statusInfo = statusMap[order.status] || { label: order.status, color: "text-slate-500 bg-slate-500/10 border-slate-500/20" };
                  const itemsList = Array.isArray(order.items) ? order.items : [];
                  return (
                    <div key={order.id} className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 shadow-sm hover:border-amber-400/30 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                          <div className="font-black text-lg">Заказ #{order.id}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : ""}
                          </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-wider ${statusInfo.color}`}>
                          {statusInfo.label}
                        </div>
                      </div>

                      <div className="space-y-3 mb-6 bg-muted/30 p-4 sm:p-5 rounded-2xl border border-border/50">
                        {itemsList.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-sm font-semibold">
                            <span className="line-clamp-1 flex-1 pr-4 text-foreground">{item.title}</span>
                            <span className="shrink-0 text-primary font-bold">{item.price} ₽</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t flex items-center justify-between">
                        <span className="font-bold text-muted-foreground text-sm">Сумма заказа:</span>
                        <span className="font-black text-2xl text-primary">{order.total} ₽</span>
                      </div>

                      {order.status === 'pending' && (
                        <div className="mt-4 pt-4 border-t flex justify-end">
                          <Button className="btn-glow font-bold rounded-xl px-6" asChild>
                            <Link href={`/payment/${order.id}`}>Перейти к оплате</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ──────── TAB 4: SETTINGS ──────── */}
          <TabsContent value="settings">
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 max-w-xl shadow-sm space-y-6">
              <div>
                <h3 className="font-black text-xl mb-1">Настройки аккаунта</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Управление учетными данными и персональной информацией.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-muted/40 border flex items-center justify-between text-sm font-semibold">
                  <span className="text-muted-foreground">Имя пользователя</span>
                  <span className="font-bold text-foreground">{activeUser.name || "Не указано"}</span>
                </div>
                <div className="p-4 rounded-2xl bg-muted/40 border flex items-center justify-between text-sm font-semibold">
                  <span className="text-muted-foreground">Электронная почта</span>
                  <span className="font-bold text-foreground">{activeUser.email}</span>
                </div>
                <div className="p-4 rounded-2xl bg-muted/40 border flex items-center justify-between text-sm font-semibold">
                  <span className="text-muted-foreground">Телефон</span>
                  <span className="font-bold text-foreground">{activeUser.phone || "Не указан"}</span>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                <Button 
                  variant="outline" 
                  className="rounded-xl font-bold text-xs"
                  onClick={() => {
                    setEditData({ name: activeUser.name || "", phone: activeUser.phone || "" });
                    setIsEditing(true);
                  }}
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1.5 text-amber-500" /> Изменить профиль
                </Button>

                {isAuthenticated && (
                  <Button 
                    variant="ghost" 
                    className="text-xs text-destructive hover:bg-destructive/10 font-bold rounded-xl"
                    onClick={() => logout()}
                  >
                    Выйти из аккаунта
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* ── Video Review Modal ── */}
      <VideoReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        video={selectedVideoForReview}
        existingReview={selectedExistingReview}
        onSuccess={() => {
          refetchMyReviews();
          refetchVideos();
          queryClient.invalidateQueries({ queryKey: ["site-settings", "reviews_section"] });
        }}
      />
    </div>
  );
}
