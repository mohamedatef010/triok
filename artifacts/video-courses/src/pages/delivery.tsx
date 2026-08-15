import { useSEO } from "@/hooks/use-seo";
import { Link } from "wouter";
import { 
  CheckCircle2, 
  PlayCircle, 
  Smartphone, 
  HelpCircle, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Lock,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DeliveryPage() {
  useSEO({
    title: "Получение цифрового товара | Порядок предоставления доступа",
    description: "Информация о порядке и сроках предоставления доступа к цифровым обучающим видеокурсам на платформе Классный Фокус после успешной оплаты.",
    canonical: "/delivery",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Получение цифрового товара — Классный Фокус",
      "description": "Порядок и правила предоставления электронного доступа к видеокурсам после оплаты.",
      "url": "https://xn----7sb1acdcpkxafxk9g.xn--p1ai/delivery"
    }
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 flex-1">
      {/* Page Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-4 border border-amber-400/20">
          <Sparkles className="h-3.5 w-3.5" />
          Цифровой контент
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-foreground">
          Получение цифрового товара
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Все обучающие материалы на платформе «Классный Фокус» являются 100% цифровым контентом. 
          Физическая доставка почтой или курьером не требуется.
        </p>
      </div>

      {/* Main Delivery Steps */}
      <div className="space-y-6 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <Card className="border shadow-sm bg-card rounded-3xl p-2 relative overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-400/10 text-amber-500 flex items-center justify-center font-black text-lg border border-amber-400/20">
                1
              </div>
              <h3 className="font-bold text-lg text-foreground">Оплата заказа</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Вы выбираете интересующий видеокурс и оплачиваете его онлайн через защищённую платёжную систему ЮKassa.
              </p>
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="border shadow-sm bg-card rounded-3xl p-2 relative overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-400/10 text-emerald-500 flex items-center justify-center font-black text-lg border border-emerald-400/20">
                2
              </div>
              <h3 className="font-bold text-lg text-foreground">Мгновенный доступ</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Сразу после подтверждения успешного платежа доступ к видеокурсу автоматически открывается в вашем Личном кабинете.
              </p>
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="border shadow-sm bg-card rounded-3xl p-2 relative overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-sky-400/10 text-sky-500 flex items-center justify-center font-black text-lg border border-sky-400/20">
                3
              </div>
              <h3 className="font-bold text-lg text-foreground">Обучение 24/7</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Смотрите видеоуроки в любое удобное время с компьютера, планшета или смартфона без ограничений по срокам.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Detailed Information Accordion / Cards */}
      <div className="space-y-6 mb-12">
        <Card className="border shadow-sm bg-card rounded-3xl overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-400/10 text-amber-500 flex items-center justify-center shrink-0 mt-1 border border-amber-400/20">
                <Clock className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Сроки предоставления доступа</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Активация доступа происходит в автоматическом режиме в течение <strong>1–5 минут</strong> после успешного проведения платежа банком. 
                  Вам не нужно ждать звонка оператора или подтверждения вручную.
                </p>
              </div>
            </div>

            <div className="border-t border-border/60 pt-6 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-400/10 text-emerald-500 flex items-center justify-center shrink-0 mt-1 border border-emerald-400/20">
                <PlayCircle className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Где найти приобретённые материалы?</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Все купленные видеокурсы сохраняются в вашем{" "}
                  <Link href="/profile" className="text-primary font-bold hover:underline">
                    Личном кабинете
                  </Link>{" "}
                  в разделе «Мои курсы». Вы можете возвращаться к урокам, повторять трюки и пересматривать материалы в любое время.
                </p>
              </div>
            </div>

            <div className="border-t border-border/60 pt-6 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-400/10 text-indigo-500 flex items-center justify-center shrink-0 mt-1 border border-indigo-400/20">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Технические требования для просмотра</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Для комфортного просмотра видеоуроков необходим современный веб-браузер (Google Chrome, Safari, Яндекс.Браузер, Mozilla Firefox, Opera) 
                  и стабильное интернет-соединение. Видео воспроизводится на компьютерах, ноутбуках, планшетах и смартфонах (iOS и Android).
                </p>
              </div>
            </div>

            <div className="border-t border-border/60 pt-6 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-purple-400/10 text-purple-500 flex items-center justify-center shrink-0 mt-1 border border-purple-400/20">
                <Lock className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Безопасность и авторские права</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Доступ к видеоматериалам предоставляется исключительно для личного некоммерческого использования. 
                  Копирование, распространение, скачивание и передача третьим лицам запрещены в соответствии с законодательством об авторском праве.
                </p>
              </div>
            </div>

            <div className="border-t border-border/60 pt-6 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-rose-400/10 text-rose-500 flex items-center justify-center shrink-0 mt-1 border border-rose-400/20">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Что делать, если возникли вопросы по доступу?</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Если после оплаты курс не отобразился в Личном кабинете или возникла техническая заминка, обратитесь в службу поддержки:
                </p>
                <div className="flex flex-wrap gap-4 pt-2 text-sm font-medium">
                  <a href="mailto:cool-trick@mail.ru" className="text-primary hover:underline font-bold">
                    Email: cool-trick@mail.ru
                  </a>
                  <a href="tel:+79787176674" className="text-foreground hover:text-primary font-bold">
                    Тел: +7 978 717-66-74
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Button size="lg" className="rounded-2xl font-bold btn-glow px-8 h-12" asChild>
          <Link href="/catalog">
            Перейти в каталог курсов <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="rounded-2xl font-bold px-8 h-12" asChild>
          <Link href="/profile">
            Мой личный кабинет
          </Link>
        </Button>
      </div>
    </div>
  );
}
