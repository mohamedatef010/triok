import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSEO } from "@/hooks/use-seo";
import { 
  Sparkles, 
  Tag, 
  Percent, 
  Save, 
  Check, 
  Gift, 
  Gamepad2, 
  Info, 
  Flame,
  ShieldCheck,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { InteractiveMagicSurpriseModal } from "@/components/interactive-magic-surprise-modal";

interface PromoCodeSettings {
  code: string;
  discountType: "percent" | "fixed";
  discountPercent: number;
  discountAmount: number;
  isActive: boolean;
  description: string;
  gameDifficulty: "easy" | "medium" | "hard";
}

const DEFAULT_PROMO_SETTINGS: PromoCodeSettings = {
  code: "MAGIC20",
  discountType: "percent",
  discountPercent: 20,
  discountAmount: 500,
  isActive: true,
  description: 'Скидка 20% за победу в интерактивной игре "Хочешь удивить друзей?"',
  gameDifficulty: "medium",
};

export function AdminPromocodes() {
  useSEO({ title: "Управление промокодами | CMS Админ" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<PromoCodeSettings>(DEFAULT_PROMO_SETTINGS);
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Fetch settings from server
  const { data: serverData, isLoading } = useQuery({
    queryKey: ["site-settings", "game_promocode"],
    queryFn: async () => {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("auth_token");
      const res = await fetch("/api/admin/site-settings/game_promocode", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (!res.ok) {
        if (res.status === 404) return DEFAULT_PROMO_SETTINGS;
        throw new Error("Failed to fetch settings");
      }
      const data = await res.json();
      return (data.value as PromoCodeSettings) || DEFAULT_PROMO_SETTINGS;
    }
  });

  useEffect(() => {
    if (serverData) {
      setSettings({
        ...DEFAULT_PROMO_SETTINGS,
        ...serverData,
      });
    }
  }, [serverData]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (updated: PromoCodeSettings) => {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("auth_token");
      const res = await fetch("/api/admin/site-settings/game_promocode", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ value: updated })
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Настройки промокода сохранены!", description: "Новый промокод и скидка активированы для игры и корзины." });
      queryClient.invalidateQueries({ queryKey: ["site-settings", "game_promocode"] });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка сохранения", description: err.message, variant: "destructive" });
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.code.trim()) {
      toast({ title: "Ошибка", description: "Введите промокод", variant: "destructive" });
      return;
    }
    saveMutation.mutate({
      ...settings,
      code: settings.code.trim().toUpperCase()
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-500 font-bold text-xs border border-amber-400/20 mb-2">
            <Gamepad2 className="h-3.5 w-3.5" /> Интерактивная игра & Скидки
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Промокоды и Настройки Игры
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Настройте промокод, который выигрывает посетитель в игре «Хочешь удивить друзей?», и размер скидки при покупке.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setTestModalOpen(true)}
            className="rounded-2xl font-bold h-11 px-5 border-amber-400/40 text-amber-500 hover:bg-amber-400 hover:text-slate-950"
          >
            <Gamepad2 className="h-4 w-4 mr-2" /> Протестировать игру
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Main Settings Card */}
        <Card className="rounded-3xl border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Gift className="h-5 w-5 text-amber-500" />
                  Призовой промокод для игры
                </CardTitle>
                <CardDescription>
                  Этот промокод выдается победителю игры и автоматически дает скидку в корзине при оформлении заказа.
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground">
                  {settings.isActive ? "Активен" : "Отключен"}
                </span>
                <Switch
                  checked={settings.isActive}
                  onCheckedChange={(checked) => setSettings({ ...settings, isActive: checked })}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-6">
            
            {/* Promo Code Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Код промокода (напр. MAGIC20) <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                  <Input
                    value={settings.code}
                    onChange={(e) => setSettings({ ...settings, code: e.target.value.toUpperCase() })}
                    placeholder="MAGIC20"
                    className="pl-11 h-12 rounded-2xl font-mono font-black text-lg tracking-wider"
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Код будет автоматически переведен в верхний регистр.
                </p>
              </div>

              {/* Discount Type & Value */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Тип и размер скидки <span className="text-amber-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={settings.discountType}
                    onChange={(e) => setSettings({ ...settings, discountType: e.target.value as "percent" | "fixed" })}
                    className="h-12 rounded-2xl border border-input bg-background px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="percent">Процент (%)</option>
                    <option value="fixed">Фиксированная (₽)</option>
                  </select>

                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min={1}
                      max={settings.discountType === "percent" ? 99 : 50000}
                      value={settings.discountType === "percent" ? settings.discountPercent : settings.discountAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (settings.discountType === "percent") {
                          setSettings({ ...settings, discountPercent: val });
                        } else {
                          setSettings({ ...settings, discountAmount: val });
                        }
                      }}
                      className="h-12 rounded-2xl font-black text-lg pr-10"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                      {settings.discountType === "percent" ? "%" : "₽"}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {settings.discountType === "percent" 
                    ? `Покупатель получит скидку ${settings.discountPercent}% от общей стоимости заказа.` 
                    : `Покупатель получит скидку ${settings.discountAmount} ₽ от общей стоимости заказа.`}
                </p>
              </div>
            </div>

            {/* Description Text */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Описание для покупателя
              </label>
              <Input
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                placeholder='Скидка 20% за победу в игре "Хочешь удивить друзей?"'
                className="h-12 rounded-2xl text-sm"
              />
            </div>

            {/* Game Difficulty / Shuffles count */}
            <div className="space-y-2 pt-2 border-t">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Сложность перемешивания карт в игре
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "easy", label: "Легкая (3 перемешивания)", desc: "Просто уследить за Тузом" },
                  { id: "medium", label: "Средняя (5 перемешиваний)", desc: "Оптимальный баланс" },
                  { id: "hard", label: "Мастер (7 перемешиваний)", desc: "Быстрая динамика трюка" }
                ].map((diff) => (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setSettings({ ...settings, gameDifficulty: diff.id as any })}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      settings.gameDifficulty === diff.id 
                        ? "bg-amber-400/10 border-amber-400 text-amber-500 font-bold shadow-sm" 
                        : "bg-background border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="text-sm font-extrabold">{diff.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{diff.desc}</div>
                  </button>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Action Save Bar */}
        <div className="flex items-center justify-between p-6 rounded-3xl bg-card border shadow-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 text-amber-500" />
            Изменения вступают в силу немедленно после сохранения.
          </div>

          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="btn-glow font-black rounded-2xl h-12 px-8 text-base inline-flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? "Сохранение..." : "Сохранить промокод"}
          </Button>
        </div>

      </form>

      {/* Test Interactive Modal */}
      <InteractiveMagicSurpriseModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
      />
    </div>
  );
}
