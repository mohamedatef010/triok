import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  useGetOrder, 
  useInitiatePayment, 
  useGetPaymentStatus 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CreditCard, Smartphone, CheckCircle2, ArrowRight } from "lucide-react";
import { LoadingSpinner, ErrorState } from "@/components/ui/states";
import { useSEO } from "@/hooks/use-seo";
import { useToast } from "@/hooks/use-toast";

export function PaymentPage({ params }: { params: { orderId: string } }) {
  useSEO({ robots: "noindex, follow" });
  const orderId = Number(params.orderId);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: order, isLoading, error } = useGetOrder(orderId, { query: { enabled: !!orderId } as any });
  
  const initPayment = useInitiatePayment();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const isPaid = order?.status === 'paid';

  // Poll payment status if order is pending or payment initiated
  const { data: paymentStatus } = useGetPaymentStatus(orderId, {
    query: {
      enabled: !isPaid && (!!paymentUrl || (!!order && order.status === 'pending')),
      refetchInterval: 3000,
    } as any
  });

  const isComplete = isPaid || paymentStatus?.status === 'paid';

  useEffect(() => {
    if (!isComplete) return undefined;
    // Redirect to profile after a brief success message
    const timer = setTimeout(() => {
      setLocation("/profile");
    }, 3000);
    return () => clearTimeout(timer);
  }, [isComplete, setLocation]);


  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;
  if (!order) return null;

  if (isComplete) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Оплата прошла успешно!</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Спасибо за покупку. Обучение добавлено в ваш личный кабинет. Сейчас вы будете перенаправлены...
        </p>
      </div>
    );
  }

  const handlePay = async (method: 'yookassa' | 'sbp') => {
    try {
      const res = await initPayment.mutateAsync({
        data: { orderId, method }
      });
      if (res.confirmationUrl) {
        setPaymentUrl(res.confirmationUrl);
        // Automatically redirect to YooKassa payment checkout
        window.location.href = res.confirmationUrl;
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Ошибка оплаты",
        description: err.message || "Не удалось инициализировать оплату",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <h1 className="text-3xl font-bold mb-8 text-center">Оплата заказа #{order.id}</h1>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-muted-foreground">
              <span>Сумма к оплате:</span>
              <span className="font-bold text-xl text-foreground">{order.total} ₽</span>
            </div>
            <div className="text-sm text-muted-foreground border-t pt-4">
              В заказе {order.items.length} {order.items.length === 1 ? 'урок' : 'уроков'}.
            </div>
          </div>

          {!paymentUrl ? (
            <div className="space-y-4">
              <Button 
                size="lg" 
                className="w-full h-14 justify-start px-6 bg-[#0052FF] hover:bg-[#0040CC] text-white border-none"
                onClick={() => handlePay('yookassa')}
                disabled={initPayment.isPending}
              >
                {initPayment.isPending ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <CreditCard className="mr-3 h-5 w-5" />}
                Оплатить картой / ЮKassa
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full h-14 justify-start px-6 border-[#E11C2B] text-[#E11C2B] hover:bg-[#E11C2B]/10"
                onClick={() => handlePay('sbp')}
                disabled={initPayment.isPending}
              >
                {initPayment.isPending ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Smartphone className="mr-3 h-5 w-5" />}
                Оплатить через СБП
              </Button>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <p className="text-sm text-muted-foreground">Перенаправление на страницу оплаты...</p>
              <Button size="lg" className="w-full h-14 animate-pulse" asChild>
                <a href={paymentUrl} rel="noreferrer">
                  Перейти к оплате <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Ожидаем подтверждения платежа... Страница обновится автоматически после завершения.
              </p>
            </div>
          )}

          {/* Security and delivery reassurance */}
          <div className="mt-6 pt-4 border-t text-center space-y-1.5 text-xs text-muted-foreground">
            <p>Платежи безопасно обрабатываются через сервис <strong>ЮKassa</strong>.</p>
            <p>
              Оформляя заказ, вы соглашаетесь с{" "}
              <a href="/terms" className="underline hover:text-foreground font-semibold">
                Публичной офертой
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
