import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  useGetOrder, 
  useInitiatePayment, 
  useGetPaymentStatus 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CreditCard, Smartphone, CheckCircle2 } from "lucide-react";
import { LoadingSpinner, ErrorState } from "@/components/ui/states";

export function PaymentPage({ params }: { params: { orderId: string } }) {
  const orderId = Number(params.orderId);
  const [, setLocation] = useLocation();
  const { data: order, isLoading, error } = useGetOrder(orderId, { query: { enabled: !!orderId } });
  
  const initPayment = useInitiatePayment();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  // Poll status
  const { data: paymentStatus } = useGetPaymentStatus(orderId, {
    query: {
      enabled: !!paymentUrl, // only poll after initiated
      refetchInterval: 3000, // 3 seconds
    }
  });

  useEffect(() => {
    if (paymentStatus?.status === 'paid' || order?.status === 'paid') {
      // Redirect to profile after a brief success message
      const timer = setTimeout(() => {
        setLocation("/profile");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, order?.status, setLocation]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;
  if (!order) return null;

  const isPaid = order.status === 'paid' || paymentStatus?.status === 'paid';

  if (isPaid) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Оплата прошла успешно!</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Спасибо за покупку. Курсы добавлены в ваш личный кабинет. Сейчас вы будете перенаправлены...
        </p>
      </div>
    );
  }

  const handlePay = async (method: 'yookassa' | 'sbp') => {
    try {
      const res = await initPayment.mutateAsync({
        data: { orderId, method }
      });
      setPaymentUrl(res.confirmationUrl);
    } catch (err) {
      console.error(err);
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
              В заказе {order.items.length} {order.items.length === 1 ? 'курс' : 'курсов'}.
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
                Оплатить через ЮKassa
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
              <p className="text-sm text-muted-foreground">Ссылка для оплаты создана.</p>
              <Button size="lg" className="w-full h-14 animate-pulse" asChild>
                <a href={paymentUrl} target="_blank" rel="noreferrer">
                  Перейти к оплате
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Ожидаем подтверждения платежа... Страница обновится автоматически.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
