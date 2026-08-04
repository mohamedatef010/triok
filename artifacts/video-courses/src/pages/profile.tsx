import { useState } from "react";
import { useLocation } from "wouter";
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
import { Play, Settings, ShoppingBag, Edit3 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function ProfilePage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading, refetch } = useAuth();
  const { toast } = useToast();

  const { data: videos, isLoading: videosLoading } = useGetMyPurchasedVideos({
    query: { enabled: isAuthenticated }
  });

  const { data: orders, isLoading: ordersLoading } = useListOrders({
    query: { enabled: isAuthenticated }
  });

  const updateMe = useUpdateMe();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: "", phone: "" });

  if (authLoading) return <LoadingSpinner />;

  if (!isAuthenticated || !user) {
    setLocation("/auth/login");
    return null;
  }

  const handleSaveProfile = async () => {
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
    paid: { label: "Оплачен", color: "text-green-500 bg-green-500/10 border-green-500/20" },
    failed: { label: "Ошибка оплаты", color: "text-red-500 bg-red-500/10 border-red-500/20" },
    cancelled: { label: "Отменен", color: "text-slate-500 bg-slate-500/10 border-slate-500/20" },
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-12 bg-card p-8 rounded-3xl border shadow-sm">
        <div className="h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        {!isEditing && (
          <Button variant="outline" onClick={() => {
            setEditData({ name: user.name, phone: user.phone || "" });
            setIsEditing(true);
          }}>
            <Edit3 className="mr-2 h-4 w-4" /> Редактировать
          </Button>
        )}
      </div>

      {isEditing && (
        <div className="bg-card p-6 rounded-2xl border shadow-sm mb-12">
          <h3 className="font-semibold text-lg mb-4">Редактирование профиля</h3>
          <div className="grid gap-4 max-w-sm mb-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Имя</label>
              <Input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Телефон</label>
              <Input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} placeholder="+7 (999) 000-00-00" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveProfile} disabled={updateMe.isPending}>Сохранить</Button>
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Отмена</Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="mb-8 p-1 bg-muted/50 w-full sm:w-auto flex flex-col sm:flex-row h-auto">
          <TabsTrigger value="videos" className="w-full sm:w-auto py-3 text-base">
            <Play className="mr-2 h-4 w-4" /> Мои курсы
          </TabsTrigger>
          <TabsTrigger value="orders" className="w-full sm:w-auto py-3 text-base">
            <ShoppingBag className="mr-2 h-4 w-4" /> История заказов
          </TabsTrigger>
          <TabsTrigger value="settings" className="w-full sm:w-auto py-3 text-base">
            <Settings className="mr-2 h-4 w-4" /> Настройки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="min-h-[400px]">
          {videosLoading ? <LoadingSpinner /> : 
           videos?.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 border border-dashed rounded-2xl">
              <Play className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">У вас пока нет купленных курсов</h3>
              <Button asChild className="mt-4"><Link href="/catalog">Перейти в каталог</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {videos?.map(video => (
                <Link key={video.id} href={`/video/${video.id}`} className="group block bg-card rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="relative aspect-video bg-muted">
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-10 w-10 text-white fill-white" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">{video.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="min-h-[400px]">
          {ordersLoading ? <LoadingSpinner /> :
           !orders?.length ? (
            <div className="text-center py-20 text-muted-foreground">Заказов пока нет.</div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: Order) => (
                <div key={order.id} className="bg-card border rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <div className="font-semibold text-lg">Заказ #{order.id}</div>
                      <div className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("ru-RU")}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${statusMap[order.status].color}`}>
                      {statusMap[order.status].label}
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-medium line-clamp-1 flex-1 pr-4">{item.title}</span>
                        <span className="shrink-0">{item.price} ₽</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 flex justify-between items-center">
                    <span className="font-semibold">Итого:</span>
                    <span className="font-bold text-lg text-primary">{order.total} ₽</span>
                  </div>
                  {order.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <Button asChild>
                        <Link href={`/payment/${order.id}`}>Оплатить</Link>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <div className="bg-card border rounded-2xl p-6 max-w-md">
            <h3 className="font-semibold mb-4">Настройки аккаунта</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Вы можете изменить пароль или удалить аккаунт. Для этого свяжитесь с поддержкой.
            </p>
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
              Удалить аккаунт
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
