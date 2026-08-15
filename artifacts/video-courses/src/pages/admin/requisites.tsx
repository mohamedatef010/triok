import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/states";
import { Save, RefreshCw, ShieldCheck, User, Phone, Mail, FileText, MapPin, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const SETTINGS_KEY = "site_requisites";

export interface RequisitesData {
  fullName: string;
  inn: string;
  taxStatus: string;
  phone: string;
  email: string;
  supportEmail: string;
  location: string;
  paymentMethods: string;
  deliveryMethod: string;
}

export const DEFAULT_REQUISITES: RequisitesData = {
  fullName: "Берестнев Максим Геннадьевич",
  inn: "482506027919",
  taxStatus: "Самозанятый (Плательщик налога на профессиональный доход)",
  phone: "+7 978 717-66-74",
  email: "cool-trick@mail.ru",
  supportEmail: "magik.777@mail.ru",
  location: "Россия",
  paymentMethods: "Банковские карты (МИР, Visa, MasterCard), СБП через сервис ЮKassa",
  deliveryMethod: "Электронный доступ к цифровым видеокурсам в Личном кабинете сразу после онлайн-оплаты",
};

export function AdminRequisites() {
  useSEO({ robots: "noindex, follow" });
  const [data, setData] = useState<RequisitesData>(DEFAULT_REQUISITES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const token = typeof window !== "undefined"
    ? (localStorage.getItem("admin_token") || localStorage.getItem("auth_token"))
    : null;

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (!token) {
        setIsLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE}/api/admin/site-settings/${SETTINGS_KEY}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.value) {
          setData({ ...DEFAULT_REQUISITES, ...json.value });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!token) {
      toast.error("Не авторизован");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/site-settings/${SETTINGS_KEY}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: data }),
      });
      if (!res.ok) throw new Error("Ошибка сохранения");
      toast.success("Реквизиты успешно сохранены");
    } catch (err: any) {
      toast.error(err.message || "Не удалось сохранить");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Реквизиты продавца</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Официальные данные, отображаемые на страницах /requisites, /contacts, /terms и в чеках ЮKassa
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isSaving}>
            <RefreshCw className="h-4 w-4 mr-2" /> Сбросить
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="btn-glow">
            <Save className="h-4 w-4 mr-2" /> {isSaving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>

      <Card className="border shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            Юридическая информация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> ФИО продавца
              </label>
              <Input
                value={data.fullName}
                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                placeholder="Берестнев Максим Геннадьевич"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> ИНН
              </label>
              <Input
                value={data.inn}
                onChange={(e) => setData({ ...data, inn: e.target.value })}
                placeholder="482506027919"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Налоговый статус
              </label>
              <Input
                value={data.taxStatus}
                onChange={(e) => setData({ ...data, taxStatus: e.target.value })}
                placeholder="Самозанятый (Плательщик налога на профессиональный доход)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="h-5 w-5 text-amber-500" />
            Контактные данные
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Телефон
              </label>
              <Input
                value={data.phone}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
                placeholder="+7 978 717-66-74"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Основной Email
              </label>
              <Input
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                placeholder="cool-trick@mail.ru"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Дополнительный Email (Поддержка)
              </label>
              <Input
                value={data.supportEmail}
                onChange={(e) => setData({ ...data, supportEmail: e.target.value })}
                placeholder="magik.777@mail.ru"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Локация / Регион
              </label>
              <Input
                value={data.location}
                onChange={(e) => setData({ ...data, location: e.target.value })}
                placeholder="Россия"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-500" />
            Оплата и Доставка
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">
                Способ приёма платежей
              </label>
              <Input
                value={data.paymentMethods}
                onChange={(e) => setData({ ...data, paymentMethods: e.target.value })}
                placeholder="Банковские карты (МИР, Visa, MasterCard), СБП через сервис ЮKassa"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">
                Порядок и способ предоставления товара
              </label>
              <Input
                value={data.deliveryMethod}
                onChange={(e) => setData({ ...data, deliveryMethod: e.target.value })}
                placeholder="Электронный доступ к цифровым видеокурсам в Личном кабинете сразу после онлайн-оплаты"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={isSaving} className="btn-glow px-8">
          <Save className="h-4 w-4 mr-2" /> {isSaving ? "Сохранение..." : "Сохранить изменения"}
        </Button>
      </div>
    </div>
  );
}
