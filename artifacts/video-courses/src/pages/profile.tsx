import { useState } from "react";
import { useSEO } from "@/hooks/use-seo";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  useUpdateMe, 
  useGetMyPurchasedVideos, 
  useListOrders,
  Order
} from "@workspace/api-client-react";
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
  Lock, 
  ArrowRight, 
  Download, 
  ShieldCheck, 
  Star,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Demo mock data for guest mode
const DEMO_PURCHASED_COURSES = [
  {
    id: 101,
    title: "Полный курс по видеомонтажу в Premiere Pro",
    thumbnailUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80",
    progress: 75,
    categoryName: "Premiere Pro"
  },
  {
    id: 102,
    title: "Цветокоррекция и Грейдинг в DaVinci Resolve",
    thumbnailUrl: "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=800&auto=format&fit=crop&q=80",
    progress: 40,
    categoryName: "DaVinci Resolve"
  }
];

const DEMO_ORDERS = [
  {
    id: 1084,
    createdAt: new Date().toISOString(),
    status: "paid",
    total: 6800,
    items: [
      { title: "Полный курс по видеомонтажу в Premiere Pro", price: 2900 },
      { title: "Цветокоррекция и Грейдинг в DaVinci Resolve", price: 3900 }
    ]
  }
];

export function ProfilePage() {
  useSEO({ robots: "noindex, follow" });
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading, logout, refetch } = useAuth();
  const { toast } = useToast();

  // Guest Demo Mode toggle
  const [demoMode, setDemoMode] = useState(false);

  const { data: videos, isLoading: videosLoading } = useGetMyPurchasedVideos({
    query: { enabled: isAuthenticated }
  });
  const videoList = Array.isArray(videos) ? videos : [];

  const { data: orders, isLoading: ordersLoading } = useListOrders({
    query: { enabled: isAuthenticated }
  });
  const orderList = Array.isArray(orders) ? orders : [];

  const updateMe = useUpdateMe();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: "", phone: "" });

  if (authLoading) return <LoadingSpinner />;

  // Display user details (real or demo)
  const activeUser = isAuthenticated && user ? user : (demoMode ? {
    id: 999,
    name: "Максим Берестнев (Демо)",
    email: "magik.777@mail.ru",
    phone: "+7 (978) 717-66-74"
  } : null);

  const activeVideos = isAuthenticated ? videoList : (demoMode ? DEMO_PURCHASED_COURSES : []);
  const activeOrders = isAuthenticated ? orderList : (demoMode ? DEMO_ORDERS : []);

  const handleSaveProfile = async () => {
    if (demoMode) {
      setIsEditing(false);
      toast({ title: "Демо-профиль сохранен" });
      return;
    }
    try {
      await updateMe.mutateAsync({ data: editData });
      await refetch();
      setIsEditing(false);
      toast({ title: "Профиль обновлен" });
    } catch (err) {
      toast({ title: "Ошибка", variant: "destructive" });
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
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-card border rounded-3xl p-8 md:p-12 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-400/10 text-amber-500 mb-6 border border-amber-400/30 shadow-lg">
            <User className="h-10 w-10" />
          </div>

          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Личный кабинет</h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            Войдите в аккаунт, чтобы просматривать купленные курсы, историю заказов и индивидуальные настройки.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Button size="lg" className="btn-glow font-bold h-14 px-8 rounded-2xl w-full sm:w-auto" asChild>
              <Link href="/auth/login">
                Войти в аккаунт <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="font-semibold h-14 px-8 rounded-2xl w-full sm:w-auto" asChild>
              <Link href="/auth/register">
                Регистрация
              </Link>
            </Button>
          </div>

          {/* Demo Cabinet Option */}
          <div className="pt-8 border-t border-border/60 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">
              <Sparkles className="h-4 w-4 text-amber-400" /> Просмотр без регистрации
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-amber-400/40 text-amber-500 hover:bg-amber-400 hover:text-slate-950 font-bold px-6 h-11 transition-all duration-300"
              onClick={() => setDemoMode(true)}
            >
              Включить интерактивный Демо-кабинет
            </Button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      
      {/* Demo Notice Banner */}
      {demoMode && !isAuthenticated && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
            <span>Вы просматриваете Личный кабинет в интерактивном Демо-режиме</span>
          </div>
          <Button size="sm" variant="outline" className="rounded-full border-amber-400 text-amber-500 hover:bg-amber-400 hover:text-slate-950 font-bold shrink-0" asChild>
            <Link href="/auth/login">Войти в реальный аккаунт</Link>
          </Button>
        </div>
      )}

      {/* Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 bg-card p-8 rounded-3xl border shadow-md relative overflow-hidden">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-primary text-slate-950 flex items-center justify-center text-3xl font-black shadow-lg">
            {(activeUser.name ?? "U").charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black">{activeUser.name ?? "Пользователь"}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold">
                <ShieldCheck className="h-3.5 w-3.5" /> Премиум
              </span>
            </div>
            <p className="text-muted-foreground text-sm">{activeUser.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isEditing && (
            <Button variant="outline" className="rounded-xl font-semibold" onClick={() => {
              setEditData({ name: activeUser.name, phone: activeUser.phone || "" });
              setIsEditing(true);
            }}>
              <Edit3 className="mr-2 h-4 w-4" /> Редактировать
            </Button>
          )}

          {isAuthenticated && (
            <Button variant="ghost" className="rounded-xl text-destructive hover:bg-destructive/10" onClick={() => logout()}>
              Выйти
            </Button>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-card p-6 rounded-3xl border shadow-md mb-10 animate-in fade-in duration-300">
          <h3 className="font-bold text-lg mb-4">Редактирование профиля</h3>
          <div className="grid gap-4 max-w-md mb-6">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase">Имя</label>
              <Input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="rounded-xl h-11 bg-background" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase">Телефон</label>
              <Input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} placeholder="+7 (999) 000-00-00" className="rounded-xl h-11 bg-background" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSaveProfile} disabled={updateMe.isPending} className="btn-glow font-bold rounded-xl px-6">Сохранить</Button>
            <Button variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl">Отмена</Button>
          </div>
        </div>
      )}

      {/* Stats counter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <div className="p-5 rounded-2xl bg-card border shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-400/10 text-amber-500 flex items-center justify-center font-bold border border-amber-400/20">
            <Play className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black">{activeVideos.length}</div>
            <div className="text-xs text-muted-foreground font-semibold">Доступных курсов</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold border border-emerald-500/20">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black">{activeOrders.length}</div>
            <div className="text-xs text-muted-foreground font-semibold">Оформленных заказов</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black">100%</div>
            <div className="text-xs text-muted-foreground font-semibold">Доступ к материалам</div>
          </div>
        </div>
      </div>

      {/* Main Cabinet Tabs */}
      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="mb-8 p-1.5 bg-muted/60 w-full sm:w-auto flex flex-col sm:flex-row h-auto rounded-2xl border">
          <TabsTrigger value="videos" className="w-full sm:w-auto py-3 px-6 text-sm font-bold rounded-xl">
            <Play className="mr-2 h-4 w-4 text-amber-400" /> Мои курсы ({activeVideos.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="w-full sm:w-auto py-3 px-6 text-sm font-bold rounded-xl">
            <ShoppingBag className="mr-2 h-4 w-4 text-primary" /> История заказов ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="w-full sm:w-auto py-3 px-6 text-sm font-bold rounded-xl">
            <Settings className="mr-2 h-4 w-4" /> Настройки
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: My Courses */}
        <TabsContent value="videos" className="min-h-[350px]">
          {videosLoading && isAuthenticated ? (
            <LoadingSpinner />
          ) : activeVideos.length === 0 ? (
            <div className="text-center py-20 bg-card border border-dashed rounded-3xl p-8">
              <Play className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">У вас пока нет купленных курсов</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                Выберите понравившийся курс из каталога и начните обучение прямо сейчас.
              </p>
              <Button asChild className="btn-glow font-bold rounded-full px-8 h-12">
                <Link href="/catalog">Перейти в каталог курсов</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {activeVideos.map((video: any) => (
                <div key={video.id} className="group flex flex-col bg-card rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="relative aspect-video bg-slate-950">
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                      <Link href={`/video/${video.id}`}>
                        <div className="h-12 w-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-5 w-5 fill-current ml-0.5" />
                        </div>
                      </Link>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <h4 className="font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-3">
                        {video.title}
                      </h4>
                      {video.progress !== undefined && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-muted-foreground font-semibold mb-1">
                            <span>Прогресс</span>
                            <span className="text-amber-500 font-bold">{video.progress}%</span>
                          </div>
                          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full" style={{ width: `${video.progress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <Button size="sm" className="w-full font-bold rounded-xl mt-2" asChild>
                      <Link href={`/video/${video.id}`}>Смотреть курс</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Orders History */}
        <TabsContent value="orders" className="min-h-[350px]">
          {ordersLoading && isAuthenticated ? (
            <LoadingSpinner />
          ) : activeOrders.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground bg-card border rounded-3xl p-8">
              Заказов пока нет.
            </div>
          ) : (
            <div className="space-y-5">
              {activeOrders.map((order: any) => {
                const statusInfo = statusMap[order.status] || { label: order.status, color: "text-slate-500 bg-slate-500/10 border-slate-500/20" };
                const itemsList = Array.isArray(order.items) ? order.items : [];
                return (
                  <div key={order.id} className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <div>
                        <div className="font-extrabold text-lg">Заказ #{order.id}</div>
                        <div className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("ru-RU")}</div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-wider ${statusInfo.color}`}>
                        {statusInfo.label}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 bg-muted/30 p-4 rounded-2xl border">
                      {itemsList.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm font-semibold">
                          <span className="line-clamp-1 flex-1 pr-4">{item.title}</span>
                          <span className="shrink-0 text-primary font-bold">{item.price} ₽</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t flex items-center justify-between">
                      <span className="font-bold text-muted-foreground">Итого:</span>
                      <span className="font-black text-xl text-primary">{order.total} ₽</span>
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

        {/* Tab 3: Settings */}
        <TabsContent value="settings">
          <div className="bg-card border rounded-3xl p-8 max-w-lg shadow-sm">
            <h3 className="font-bold text-lg mb-2">Настройки аккаунта</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Вы можете обновить личные данные или обратиться в поддержку для настройки доступов.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="p-4 rounded-2xl bg-muted/40 border flex items-center justify-between text-sm font-semibold">
                <span>Электронная почта</span>
                <span className="text-muted-foreground">{activeUser.email}</span>
              </div>
              <div className="p-4 rounded-2xl bg-muted/40 border flex items-center justify-between text-sm font-semibold">
                <span>Телефон</span>
                <span className="text-muted-foreground">{activeUser.phone || "Не указан"}</span>
              </div>
            </div>

            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl">
              Запросить удаление данных
            </Button>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
