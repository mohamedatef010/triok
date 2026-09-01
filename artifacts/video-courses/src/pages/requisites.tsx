import { useSEO } from "@/hooks/use-seo";
import { User, FileText, ShieldCheck, Mail, Phone, MapPin, CreditCard, PlayCircle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export function RequisitesPage() {
  useSEO({
    title: "Реквизиты продавца",
    description: "Реквизиты продавца Берестнева Максима Геннадьевича. ИНН, статус самозанятого, контактная информация и порядок оплаты.",
    canonical: "/requisites",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "Реквизиты продавца — Классный Фокус",
      "url": "https://xn----7sb1acdcpkxafxk9g.xn--p1ai/requisites"
    }
  });

  const { data: requisitesData } = useQuery({
    queryKey: ["site-settings", "site_requisites"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings/site_requisites");
      if (!res.ok) return null;
      const json = await res.json();
      return json?.value;
    },
    staleTime: 60000,
  });

  const NOT_SET = "Не указано";
  const fullName = requisitesData?.fullName || NOT_SET;
  const inn = requisitesData?.inn || NOT_SET;
  const taxStatus = requisitesData?.taxStatus || "Самозанятый (Плательщик налога на профессиональный доход)";
  const phone = requisitesData?.phone || NOT_SET;
  const email = requisitesData?.email || NOT_SET;
  const supportEmail = requisitesData?.supportEmail || NOT_SET;
  const location = requisitesData?.location || "Россия";
  const paymentMethods = requisitesData?.paymentMethods || "Банковские карты (МИР, Visa, MasterCard), СБП через сервис ЮKassa";
  const deliveryMethod = requisitesData?.deliveryMethod || "Электронный доступ к цифровым обучающим материалам в Личном кабинете сразу после онлайн-оплаты";

  const items = [
    {
      icon: User,
      label: "ФИО продавца",
      value: fullName,
      href: null,
    },
    {
      icon: FileText,
      label: "ИНН",
      value: inn,
      href: null,
    },
    {
      icon: ShieldCheck,
      label: "Налоговый статус",
      value: taxStatus,
      href: null,
    },
    {
      icon: Phone,
      label: "Контактный телефон",
      value: phone,
      href: phone !== NOT_SET ? `tel:${phone.replace(/\s+/g, '')}` : null,
    },
    {
      icon: Mail,
      label: "Основной Email",
      value: email,
      href: email !== NOT_SET ? `mailto:${email}` : null,
    },
    {
      icon: Mail,
      label: "Email службы поддержки",
      value: supportEmail,
      href: supportEmail !== NOT_SET ? `mailto:${supportEmail}` : null,
    },
    {
      icon: MapPin,
      label: "Регион деятельности",
      value: location,
      href: null,
    },
    {
      icon: CreditCard,
      label: "Способы оплаты",
      value: paymentMethods,
      href: null,
    },
    {
      icon: PlayCircle,
      label: "Порядок предоставления товара",
      value: deliveryMethod,
      href: null,
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl flex-1 flex flex-col justify-center overflow-hidden">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-3 border border-amber-400/20">
          <ShieldCheck className="h-3.5 w-3.5" />
          Юридические данные
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight">Реквизиты продавца</h1>
        <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
          Официальные юридические, платёжные и контактные данные платформы «Классный Фокус»
        </p>
      </div>

      <Card className="border shadow-sm bg-card rounded-3xl overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="space-y-6">
            {items.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4 group pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <div className="h-11 w-11 rounded-2xl bg-amber-400/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 border border-amber-400/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground font-semibold mb-1">{label}</div>
                  {href ? (
                    <a
                      href={href}
                      className="text-base sm:text-lg font-bold text-foreground hover:text-amber-500 transition-colors duration-200 break-all"
                    >
                      {value}
                    </a>
                  ) : (
                    <div className="text-base sm:text-lg font-bold text-foreground break-words">{value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
