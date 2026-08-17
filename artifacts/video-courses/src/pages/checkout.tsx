import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Tag, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/use-seo";

async function syncLocalCartToServer(token: string) {
  try {
    const stored = localStorage.getItem("local_cart");
    if (!stored) return;
    const items = JSON.parse(stored);
    if (!Array.isArray(items) || items.length === 0) return;
    for (const item of items) {
      if (!item?.videoId) continue;
      await fetch("/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoId: item.videoId }),
      });
    }
    localStorage.removeItem("local_cart");
  } catch {}
}

export function CheckoutPage() {
  useSEO({ robots: "noindex, follow" });
  const [, setLocation] = useLocation();
  const cart = useCart();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncing, setSyncing] = useState(true);

  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent?: number;
    discountAmount?: number;
    discountType?: string;
  } | null>(null);

  // Sync local guest cart to server on mount (runs once)
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { setSyncing(false); return; }
    syncLocalCartToServer(token).finally(async () => {
      // Invalidate cart query so CheckoutPage sees updated items
      await cart.refetchCart?.();
      setSyncing(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("applied_promocode");
      if (stored) {
        setAppliedPromo(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Calculate discount
  let discountValue = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === "fixed" && appliedPromo.discountAmount) {
      discountValue = Math.min(appliedPromo.discountAmount, cart.total);
    } else {
      const pct = appliedPromo.discountPercent || 20;
      discountValue = Math.round((cart.total * pct) / 100);
    }
  }
  const finalTotal = Math.max(0, cart.total - discountValue);

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      // Backend supports promoCode in body
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          fromCart: true,
          promoCode: appliedPromo?.code,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Не удалось создать заказ");
      }

      const order = await res.json();
      // Clear applied promocode
      localStorage.removeItem("applied_promocode");
      setLocation(`/payment/${order.id}`);
    } catch (err: any) {
      toast({
        title: "Ошибка оформления",
        description: err.message || "Не удалось создать заказ",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  // Wait for cart sync before checking if cart is empty
  if (syncing) return null;

  if (!cart.items.length) {
    setLocation("/cart");
    return null;
  }


  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center max-w-lg">
      <div className="w-full bg-card border rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-500 mx-auto border border-amber-400/20">
          <ShieldCheck className="h-8 w-8" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black mb-2">Подтверждение заказа</h1>
          <p className="text-muted-foreground text-sm">
            Проверьте данные заказа перед переходом к защищенной оплате.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-muted/40 border space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Курсов в заказе:</span>
            <span className="font-bold text-foreground">{cart.items.length} шт.</span>
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span>Сумма без скидки:</span>
            <span>{cart.total} ₽</span>
          </div>

          {appliedPromo && discountValue > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Промокод ({appliedPromo.code}):
              </span>
              <span>-{discountValue} ₽</span>
            </div>
          )}

          <div className="border-t pt-2 flex justify-between font-black text-lg text-primary">
            <span>Итого к оплате:</span>
            <span>{finalTotal} ₽</span>
          </div>
        </div>

        {/* Digital Delivery Notice */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border/60 text-left space-y-1">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <span className="text-amber-500 font-bold">●</span> Электронная доставка:
          </div>
          <div>
            Доступ к видеокурсам открывается в вашем Личном кабинете сразу после подтверждения успешной оплаты.
          </div>
        </div>

        <Button 
          size="lg" 
          onClick={handleCheckout} 
          disabled={isProcessing} 
          className="w-full h-14 text-base font-bold rounded-2xl btn-glow"
        >
          {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          Оплатить {finalTotal} ₽
        </Button>

        {/* Legal Consent */}
        <p className="text-[11px] text-muted-foreground leading-relaxed text-center px-2">
          Нажимая кнопку «Оплатить», вы соглашаетесь с условиями{" "}
          <Link href="/terms" className="underline hover:text-amber-500 font-semibold">
            Публичной оферты
          </Link>{" "}
          и{" "}
          <Link href="/help" className="underline hover:text-amber-500 font-semibold">
            Политикой обработки персональных данных
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
