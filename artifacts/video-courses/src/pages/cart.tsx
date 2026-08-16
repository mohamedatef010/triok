import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ShoppingBag, ArrowRight, Tag, Check, X, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSEO } from "@/hooks/use-seo";
import { useToast } from "@/hooks/use-toast";

export function CartPage() {
  useSEO({ robots: "noindex, follow" });
  const { items, total, remove, clear } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent?: number;
    discountAmount?: number;
    discountType?: string;
    description?: string;
  } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Auto-detect promo code from game if saved in localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("applied_promocode");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.code) {
          setAppliedPromo(parsed);
          setPromoInput(parsed.code);
        }
      }
    } catch {}
  }, []);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setIsApplying(true);

    try {
      const res = await fetch("/api/promocode/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        throw new Error(data.message || "Неверный промокод");
      }

      setAppliedPromo(data);
      localStorage.setItem("applied_promocode", JSON.stringify(data));
      toast({
        title: "Промокод применен!",
        description: data.description || `Скидка ${data.discountPercent || 20}% активирована`,
      });
    } catch (err: any) {
      toast({
        title: "Ошибка промокода",
        description: err.message || "Недействительный промокод",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    localStorage.removeItem("applied_promocode");
    toast({ title: "Промокод удален" });
  };

  // Calculate discount
  let discountValue = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === "fixed" && appliedPromo.discountAmount) {
      discountValue = Math.min(appliedPromo.discountAmount, total);
    } else {
      const pct = appliedPromo.discountPercent || 20;
      discountValue = Math.round((total * pct) / 100);
    }
  }
  const finalTotal = Math.max(0, total - discountValue);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Корзина пуста</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Вы еще не добавили ни одного курса в корзину. Перейдите в каталог, чтобы выбрать подходящее обучение.
        </p>
        <Button size="lg" className="rounded-2xl font-bold btn-glow px-8 h-12" asChild>
          <Link href="/catalog">Перейти в каталог</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-3xl sm:text-4xl font-black mb-8">Корзина</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-end mb-4">
            <Button variant="ghost" className="text-muted-foreground text-xs" onClick={clear}>
              Очистить корзину
            </Button>
          </div>
          
          {items.map((item) => (
            <Card key={item.videoId} className="rounded-3xl border shadow-sm overflow-hidden">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-full sm:w-44 aspect-video rounded-2xl overflow-hidden bg-slate-950 shrink-0">
                  <img 
                    src={item.thumbnailUrl || undefined} 
                    alt={item.title} 
                    loading="lazy" 
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col items-start w-full">
                  <Link href={`/video/${item.videoId}`} className="font-bold text-base sm:text-lg hover:text-primary transition-colors line-clamp-2 mb-2">
                    {item.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-auto">
                    {item.discountPrice ? (
                      <>
                        <span className="font-black text-lg text-primary">{item.discountPrice} ₽</span>
                        <span className="text-sm text-muted-foreground line-through">{item.price} ₽</span>
                      </>
                    ) : (
                      <span className="font-black text-lg text-primary">{item.price} ₽</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 w-full sm:w-auto flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => remove(item.videoId)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary & Promo code */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="sticky top-24 border-primary/20 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-xl font-extrabold">Ваш заказ</h3>

              {/* Promo Code Input Box */}
              <div className="space-y-2 pt-2 border-t">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Промокод на скидку
                </label>

                {appliedPromo ? (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      <div>
                        <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                          {appliedPromo.code}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          Скидка {appliedPromo.discountType === "fixed" ? `${appliedPromo.discountAmount} ₽` : `${appliedPromo.discountPercent || 20}%`}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-destructive"
                      onClick={handleRemovePromo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="ПРОМОКОД"
                        className="pl-9 rounded-xl font-mono text-sm uppercase h-11"
                        onKeyDown={(e) => { if (e.key === "Enter") handleApplyPromo(); }}
                      />
                    </div>
                    <Button
                      onClick={handleApplyPromo}
                      disabled={isApplying || !promoInput.trim()}
                      className="rounded-xl font-bold h-11 px-4"
                    >
                      {isApplying ? "..." : "Применить"}
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Totals */}
              <div className="space-y-3 pt-2 border-t text-sm font-semibold">
                <div className="flex justify-between text-muted-foreground">
                  <span>Курсов в заказе:</span>
                  <span>{items.length} шт.</span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>Стоимость:</span>
                  <span>{total} ₽</span>
                </div>

                {appliedPromo && discountValue > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Скидка по промокоду ({appliedPromo.code}):</span>
                    <span>-{discountValue} ₽</span>
                  </div>
                )}

                <div className="border-t pt-3 flex justify-between font-black text-xl">
                  <span>Итого к оплате:</span>
                  <span className="text-primary">{finalTotal} ₽</span>
                </div>
              </div>

              {isAuthenticated ? (
                <Button size="lg" className="w-full h-14 text-base font-bold rounded-2xl btn-glow" asChild>
                  <Link href="/checkout">
                    Оформить заказ ({finalTotal} ₽) <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Для оформления заказа необходимо войти в личный кабинет
                  </p>
                  <Button size="lg" className="w-full h-14 text-base font-bold rounded-2xl btn-glow" asChild>
                    <Link href="/auth/login?redirect=/checkout">
                      Оформить заказ ({finalTotal} ₽) <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
