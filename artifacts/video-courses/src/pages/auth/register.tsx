import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  User, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Wand2, 
  ArrowLeft,
  UserPlus,
  Gift,
  Trophy
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSEO } from "@/hooks/use-seo";

const formSchema = z.object({
  name: z.string().min(2, "Введите ваше имя (минимум 2 символа)"),
  email: z.string().email("Введите корректный email адрес"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
});

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

async function createOrderFromCart(token: string) {
  let promoCode: string | undefined;
  try {
    const stored = localStorage.getItem("applied_promocode");
    if (stored) promoCode = JSON.parse(stored)?.code;
  } catch {}
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fromCart: true, promoCode }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Не удалось создать заказ");
  }
  const order = await res.json();
  localStorage.removeItem("applied_promocode");
  return order;
}

export function RegisterPage() {
  useSEO({
    title: "Регистрация | Создание личного кабинета",
    description: "Создайте аккаунт, чтобы получить доступ к видеокурсам, урокам магии и специальным предложениям.",
    robots: "noindex, follow"
  });

  const [, setLocation] = useLocation();
  const { refetch } = useAuth();
  const registerMut = useRegister();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const res = await registerMut.mutateAsync({ data: values });
      localStorage.setItem("auth_token", res.token);
      await refetch();

      // Handle redirect — same logic as login
      const url = new URL(window.location.href);
      const redirect = url.searchParams.get("redirect") || "/profile";

      if (redirect === "/checkout" || redirect.startsWith("/checkout")) {
        await syncLocalCartToServer(res.token);
        try {
          const order = await createOrderFromCart(res.token);
          setLocation(`/payment/${order.id}`);
          return;
        } catch {
          setLocation("/checkout");
          return;
        }
      }

      setLocation(redirect);
    } catch (err: any) {
      form.setError("root", { message: err.message || "Ошибка при регистрации" });
    }
  };

  return (
    <div className="min-h-[85vh] relative flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden">
      
      {/* Subtle, soft ambient background (easy on the eyes) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.04)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.04)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10 my-auto">
        
        {/* Left Side: Creative & Clean Presentation (No overlap, no AI stars, no student avatars) */}
        <div className="lg:col-span-5 space-y-6 hidden lg:block pr-2">
          
          {/* Back button */}
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/60 hover:bg-card border border-border/60 text-xs font-bold text-muted-foreground hover:text-foreground transition-all group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" /> 
            <span>На главную</span>
          </Link>

          {/* Badge without AI stars */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 text-amber-500 font-extrabold text-xs border border-amber-400/25 shadow-sm">
              <UserPlus className="h-3.5 w-3.5 text-amber-500" />
              <span>Бесплатная регистрация</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-foreground">
              Начните путь в мир профессиональной магии
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Создайте аккаунт всего за 1 минуту и получите доступ к закрытым видеокурсам, разборам трюков и скидкам.
            </p>
          </div>

          {/* Creative Feature Cards without overlap */}
          <div className="space-y-3 pt-2">
            
            {/* Perk 1 */}
            <div className="p-4 rounded-2xl bg-card/70 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300 shadow-sm flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-amber-400/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-400/20">
                <Wand2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-extrabold text-foreground">
                  Уроки от иллюзиониста
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                  Пошаговые видеоразборы от базовых до сценических трюков
                </p>
              </div>
            </div>

            {/* Perk 2 */}
            <div className="p-4 rounded-2xl bg-card/70 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 shadow-sm flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-400/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-400/20">
                <Gift className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-extrabold text-foreground">
                  Специальные бонусы
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                  Участие в мини-играх и промо-скидки на обучение
                </p>
              </div>
            </div>

            {/* Perk 3 */}
            <div className="p-4 rounded-2xl bg-card/70 border border-indigo-500/20 hover:border-indigo-400/40 transition-all duration-300 shadow-sm flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-indigo-400/10 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-400/20">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-extrabold text-foreground">
                  Личный прогресс
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                  Сохранение истории обучения и заказов
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Luxury Glassmorphic Register Form Card */}
        <div className="lg:col-span-7">
          <div className="bg-card/85 backdrop-blur-xl border border-amber-500/25 rounded-3xl p-6 sm:p-10 shadow-[0_10px_50px_rgba(0,0,0,0.3)] relative overflow-hidden">
            
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300" />

            {/* Form Header */}
            <div className="text-center space-y-2 mb-8">
              <div className="h-16 w-16 rounded-2xl bg-amber-400/10 text-amber-500 border border-amber-400/30 flex items-center justify-center mx-auto shadow-inner mb-3">
                <User className="h-8 w-8 text-amber-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Создать аккаунт
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Заполните данные для создания личного кабинета
              </p>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Ваше имя
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="Иван Иванов"
                            className="pl-11 h-12 rounded-2xl bg-background/60 text-sm font-medium border-border/70 focus:border-amber-400 focus:ring-amber-400/20"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs font-semibold" />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Электронная почта (Email)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="name@example.com"
                            type="email"
                            autoComplete="email"
                            className="pl-11 h-12 rounded-2xl bg-background/60 text-sm font-medium border-border/70 focus:border-amber-400 focus:ring-amber-400/20"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs font-semibold" />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Пароль (минимум 6 символов)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="••••••••"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            className="pl-11 pr-11 h-12 rounded-2xl bg-background/60 text-sm font-medium border-border/70 focus:border-amber-400 focus:ring-amber-400/20"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                            tabIndex={-1}
                            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs font-semibold" />
                    </FormItem>
                  )}
                />

                {/* Global Error Banner */}
                {form.formState.errors.root && (
                  <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold text-center animate-in fade-in">
                    {form.formState.errors.root.message}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={registerMut.isPending}
                  className="w-full h-13 rounded-2xl font-black text-base btn-glow mt-4 shadow-xl shadow-amber-500/20"
                >
                  {registerMut.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Создание аккаунта...
                    </>
                  ) : (
                    <>
                      <span>Зарегистрироваться</span>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Footer Login Link */}
            <div className="mt-6 pt-5 border-t border-border/40 text-center space-y-2">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Уже зарегистрированы?{" "}
                <Link
                  href="/auth/login"
                  className="font-black text-amber-500 hover:text-amber-400 underline underline-offset-4 ml-1 transition-colors"
                >
                  Войти в личный кабинет
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
