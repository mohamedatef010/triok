import { Link } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function CartPage() {
  const { items, total, remove, clear } = useCart();
  const { isAuthenticated } = useAuth();

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
        <Button size="lg" asChild>
          <Link href="/catalog">Перейти в каталог</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Корзина</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-end mb-4">
            <Button variant="ghost" className="text-muted-foreground" onClick={clear}>
              Очистить корзину
            </Button>
          </div>
          
          {items.map((item) => (
            <Card key={item.videoId}>
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-full sm:w-40 aspect-video rounded-lg overflow-hidden bg-muted shrink-0">
                  <img 
                    src={item.thumbnailUrl || undefined} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col items-start w-full">
                  <Link href={`/video/${item.videoId}`} className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2 mb-2">
                    {item.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-auto">
                    {item.discountPrice ? (
                      <>
                        <span className="font-bold text-lg text-primary">{item.discountPrice} ₽</span>
                        <span className="text-sm text-muted-foreground line-through">{item.price} ₽</span>
                      </>
                    ) : (
                      <span className="font-bold text-lg text-primary">{item.price} ₽</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 w-full sm:w-auto flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => remove(item.videoId)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-primary/20 shadow-lg shadow-primary/5">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-6">Ваш заказ</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Курсов:</span>
                  <span>{items.length} шт.</span>
                </div>
                <div className="border-t pt-4 flex justify-between font-bold text-xl">
                  <span>Итого:</span>
                  <span className="text-primary">{total} ₽</span>
                </div>
              </div>

              {isAuthenticated ? (
                <Button size="lg" className="w-full h-14 text-lg" asChild>
                  <Link href="/checkout">Оформить заказ <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Для оформления заказа необходимо войти в аккаунт
                  </p>
                  <Button size="lg" className="w-full h-14" asChild>
                    <Link href="/auth/login?redirect=/cart">Войти и оформить</Link>
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
