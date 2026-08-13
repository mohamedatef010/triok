import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCreateOrder } from "@workspace/api-client-react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/use-seo";

// Small checkout page that creates an order from cart and redirects to payment
export function CheckoutPage() {
  useSEO({ robots: "noindex, follow" });
  const [, setLocation] = useLocation();
  const cart = useCart();
  const createOrder = useCreateOrder();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      // Backend expects { fromCart: true }
      const order = await createOrder.mutateAsync({ data: { fromCart: true } });
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

  if (!cart.items.length) {
    setLocation("/cart");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-bold mb-4">Подтверждение заказа</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Вы оформляете заказ на сумму {cart.total} ₽. После создания заказа вы будете перенаправлены на страницу оплаты.
      </p>
      <Button size="lg" onClick={handleCheckout} disabled={isProcessing} className="w-full max-w-xs h-14 text-lg">
        {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
        Подтвердить и оплатить
      </Button>
    </div>
  );
}
