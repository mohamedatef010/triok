import { useSEO } from "@/hooks/use-seo";
import { User, FileText, ShieldCheck, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function RequisitesPage() {
  useSEO({
    title: "Реквизиты",
    description: "Реквизиты продавца Берестнева Максима Геннадьевича. ИНН, статус самозанятого, контактная информация.",
    canonical: "/requisites",
  });



  const items = [
    {
      icon: User,
      label: "ФИО",
      value: "Берестнев Максим Геннадьевич",
      href: null,
    },
    {
      icon: FileText,
      label: "ИНН",
      value: "482506027919",
      href: null,
    },
    {
      icon: ShieldCheck,
      label: "Статус",
      value: "Самозанятый",
      href: null,
    },
    {
      icon: Mail,
      label: "Email",
      value: "cool-trick@mail.ru",
      href: "mailto:cool-trick@mail.ru",
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl flex-1 flex flex-col justify-center">
      <div className="text-center mb-10">
        <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-2">Информация о продавце</p>
        <h1 className="text-4xl font-extrabold mb-3">Реквизиты</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Официальные юридические и контактные данные продавца курсов
        </p>
      </div>

      <Card className="border shadow-sm bg-card">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-6">
            {items.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-center gap-4 group pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-accent/10 group-hover:text-accent transition-all duration-200 shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground font-medium mb-0.5">{label}</div>
                  {href ? (
                    <a
                      href={href}
                      className="text-lg font-bold hover:text-accent transition-colors duration-200 break-all"
                    >
                      {value}
                    </a>
                  ) : (
                    <div className="text-lg font-bold text-foreground break-words">{value}</div>
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
