import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/states";
import {
  Save, RefreshCw, Sparkles, LayoutTemplate, Star, MessageSquare, Layers, Award,
  ArrowRight, RotateCcw, Palette, Type, Trash2, X, Move, AlignLeft, AlignCenter,
  AlignRight, ArrowLeftRight, ArrowUpDown, Eye, EyeOff, Film, Camera, Play
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const SETTINGS_KEY = "hero_section";

export const AVAILABLE_FONTS = [
  { label: "По умолчанию (Plus Jakarta Sans)", value: "" },
  { label: "Inter (Современный гротеск)", value: "'Inter', sans-serif" },
  { label: "Montserrat (Геометрический стильный)", value: "'Montserrat', sans-serif" },
  { label: "Playfair Display (Элегантный с засечками / Магия)", value: "'Playfair Display', serif" },
  { label: "Roboto (Строгий классический)", value: "'Roboto', sans-serif" },
  { label: "Lora (Литературная антиква)", value: "'Lora', serif" },
  { label: "Merriweather (Книжный премиальный)", value: "'Merriweather', serif" },
  { label: "Open Sans (Чистый нейтральный)", value: "'Open Sans', sans-serif" },
  { label: "Oswald (Высокий плакатный)", value: "'Oswald', sans-serif" },
  { label: "Roboto Slab (Брусковый)", value: "'Roboto Slab', serif" },
  { label: "Comfortaa (Мягкий округлый)", value: "'Comfortaa', cursive" },
];

const PRESET_COLORS = [
  { label: "Белый", value: "#ffffff" },
  { label: "Золотой", value: "#f59e0b" },
  { label: "Янтарный", value: "#fbbf24" },
  { label: "Изумрудный", value: "#10b981" },
  { label: "Голубой", value: "#38bdf8" },
  { label: "Розовый", value: "#f43f5e" },
  { label: "Серый", value: "#94a3b8" },
  { label: "Темный", value: "#0f172a" },
];

export interface TextStyleItem {
  color?: string;
  fontFamily?: string;
  bgColor?: string;
  secondaryColor?: string;
  textAlign?: "left" | "center" | "right";
  offsetX?: number;
  offsetY?: number;
  marginTop?: number;
  marginBottom?: number;
}

export interface HeroSectionData {
  hidden?: boolean;
  badge1: string;
  badge2: string;
  heading: string;
  subheading: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  orbit1Value: string;
  orbit1Label: string;
  orbit2Title: string;
  orbit2Subtitle: string;
  orbit2Desc: string;
  orbit3Title: string;
  orbit3Desc: string;
  orbit4Title: string;
  orbit4Subtitle: string;
  orbit5Title: string;
  orbit5Desc: string;
  authorName: string;
  authorRole: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  marqueeItemsText: string;
  styles?: {
    heading?: TextStyleItem;
    subheading?: TextStyleItem;
    badge1?: TextStyleItem;
    badge2?: TextStyleItem;
    ctaPrimary?: TextStyleItem;
    ctaSecondary?: TextStyleItem;
    orbitCards?: TextStyleItem;
    authorTagline?: TextStyleItem;
    stats?: TextStyleItem;
    marquee?: TextStyleItem;
  };
  sectionsVisibility?: {
    hero?: boolean;
    featured_courses?: boolean;
    about?: boolean;
    social_videos?: boolean;
    events_gallery?: boolean;
    reviews?: boolean;
  };
}

export const DEFAULT_HERO_DATA: HeroSectionData = {
  hidden: false,
  badge1: "Искусство удивлять",
  badge2: "С трудоустройством",
  heading: "Научись фокусам, которые действительно хочется показать друзьям",
  subheading: "Научись эффектным фокусам, раскрывай секреты иллюзионного искусства и удивляй друзей и близких. Понятные пошаговые уроки от профессионального фокусника.",
  ctaPrimaryText: "Смотри секрет трюка",
  ctaPrimaryLink: "/catalog",
  ctaSecondaryText: "Хочешь удивить друзей?",
  orbit1Value: "10+",
  orbit1Label: "лет в мире иллюзий",
  orbit2Title: "Видеоуроки",
  orbit2Subtitle: "понятно и пошагово",
  orbit2Desc: "Практический опыт выступлений и обучения",
  orbit3Title: "Первый фокус",
  orbit3Desc: "Научись своему первому эффектному фокусу",
  orbit4Title: "Бесплатно",
  orbit4Subtitle: "Попробуй первый урок",
  orbit5Title: "Для всех",
  orbit5Desc: "от новичков до увлечённых магией",
  authorName: "✨ Первый трюк за 15 минут",
  authorRole: "понятный разбор секрета без сложного реквизита",
  stat1Value: "15 минут на трюк",
  stat1Label: "пошаговое объяснение и легкий старт с нуля",
  stat2Value: "HD и 2 ракурса",
  stat2Label: "крупные планы: вид со стороны и глазами фокусника",
  stat3Value: "Доступ навсегда",
  stat3Label: "учись 24/7 в удобном темпе с любого устройства",
  marqueeItemsText: "Фокусы, Иллюзии, Секреты магии, Карточные трюки, Ментальная магия, Пошаговые уроки, Мастер-классы, Удивляй друзей, Открывай мир иллюзий",
  styles: {},
  sectionsVisibility: {
    hero: true,
    featured_courses: true,
    about: true,
    social_videos: true,
    events_gallery: true,
    reviews: true,
  },
};

/** Reusable Style (Font, Color & Movement/Position) Picker Component */
function StylePicker({
  title,
  value,
  onChange,
  showBg = false,
  showSecondaryColor = false,
  secondaryColorLabel = "Второй цвет",
  showPosition = true,
}: {
  title: string;
  value?: TextStyleItem;
  onChange: (val: TextStyleItem) => void;
  showBg?: boolean;
  showSecondaryColor?: boolean;
  secondaryColorLabel?: string;
  showPosition?: boolean;
}) {
  const [showAdvancedPos, setShowAdvancedPos] = useState(false);
  const currentFont = value?.fontFamily || "";
  const currentColor = value?.color || "";
  const currentBg = value?.bgColor || "";
  const currentSecondary = value?.secondaryColor || "";
  const currentAlign = value?.textAlign || "left";
  const currentOffsetX = value?.offsetX ?? 0;
  const currentOffsetY = value?.offsetY ?? 0;

  const hasPosOverrides = Boolean(
    (value?.textAlign && value.textAlign !== "left") ||
    value?.offsetX ||
    value?.offsetY ||
    value?.marginTop ||
    value?.marginBottom
  );

  return (
    <div className="p-3.5 rounded-xl border bg-amber-500/5 dark:bg-slate-900/60 border-amber-500/20 space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
        <span className="flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5" />
          {title}
        </span>
        <div className="flex items-center gap-2">
          {showPosition && (
            <button
              type="button"
              onClick={() => setShowAdvancedPos(!showAdvancedPos)}
              className={`text-[11px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                hasPosOverrides || showAdvancedPos
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-300 font-bold"
                  : "bg-background border-input text-muted-foreground hover:text-foreground"
              }`}
              title="Настройка смещения и выравнивания текста"
            >
              <Move className="h-3 w-3" /> Позиция {hasPosOverrides && "•"}
            </button>
          )}
          {(currentColor || currentFont || currentBg || currentSecondary || hasPosOverrides) && (
            <button
              type="button"
              onClick={() => onChange({})}
              className="text-[11px] text-muted-foreground hover:text-destructive underline"
            >
              Сбросить стиль
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Font Picker */}
        <div className="space-y-1">
          <label className="text-xs font-medium flex items-center gap-1 text-slate-700 dark:text-slate-300">
            <Type className="h-3 w-3 text-amber-500" /> Шрифт (Font Family)
          </label>
          <select
            value={currentFont}
            onChange={(e) => onChange({ ...value, fontFamily: e.target.value })}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {AVAILABLE_FONTS.map((f) => (
              <option key={f.label} value={f.value} style={{ fontFamily: f.value || undefined }}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Text Color Picker */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Цвет текста</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColor || "#ffffff"}
              onChange={(e) => onChange({ ...value, color: e.target.value })}
              className="h-9 w-10 p-0.5 rounded border cursor-pointer shrink-0 bg-background"
              title="Выбрать цвет"
            />
            <Input
              value={currentColor}
              onChange={(e) => onChange({ ...value, color: e.target.value })}
              placeholder="По умолчанию (напр. #f59e0b)"
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Secondary color */}
        {showSecondaryColor && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{secondaryColorLabel}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentSecondary || "#94a3b8"}
                onChange={(e) => onChange({ ...value, secondaryColor: e.target.value })}
                className="h-9 w-10 p-0.5 rounded border cursor-pointer shrink-0 bg-background"
                title="Выбрать цвет"
              />
              <Input
                value={currentSecondary}
                onChange={(e) => onChange({ ...value, secondaryColor: e.target.value })}
                placeholder="#94a3b8"
                className="h-9 text-xs"
              />
            </div>
          </div>
        )}

        {/* Optional Background Color */}
        {showBg && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Цвет фона</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentBg || "#f59e0b"}
                onChange={(e) => onChange({ ...value, bgColor: e.target.value })}
                className="h-9 w-10 p-0.5 rounded border cursor-pointer shrink-0 bg-background"
                title="Выбрать цвет фона"
              />
              <Input
                value={currentBg}
                onChange={(e) => onChange({ ...value, bgColor: e.target.value })}
                placeholder="По умолчанию"
                className="h-9 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Position and Movement Controls */}
      {showPosition && (showAdvancedPos || hasPosOverrides) && (
        <div className="pt-2 border-t border-amber-500/20 space-y-3 bg-amber-500/[0.03] p-3 rounded-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Move className="h-3.5 w-3.5 text-amber-500" />
              Позиция, смещение и выравнивание
            </span>
            <button
              type="button"
              onClick={() => onChange({ ...value, textAlign: undefined, offsetX: undefined, offsetY: undefined, marginTop: undefined, marginBottom: undefined })}
              className="text-[10px] text-muted-foreground hover:text-destructive underline"
            >
              Сбросить позицию
            </button>
          </div>

          {/* Alignment */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Выравнивание (Alignment)</label>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant={currentAlign === "left" ? "default" : "outline"}
                size="sm"
                className={`h-7 px-3 text-xs gap-1 ${currentAlign === "left" ? "bg-amber-500 text-slate-950 hover:bg-amber-600" : ""}`}
                onClick={() => onChange({ ...value, textAlign: "left" })}
              >
                <AlignLeft className="h-3.5 w-3.5" /> Слева
              </Button>
              <Button
                type="button"
                variant={currentAlign === "center" ? "default" : "outline"}
                size="sm"
                className={`h-7 px-3 text-xs gap-1 ${currentAlign === "center" ? "bg-amber-500 text-slate-950 hover:bg-amber-600" : ""}`}
                onClick={() => onChange({ ...value, textAlign: "center" })}
              >
                <AlignCenter className="h-3.5 w-3.5" /> По центру
              </Button>
              <Button
                type="button"
                variant={currentAlign === "right" ? "default" : "outline"}
                size="sm"
                className={`h-7 px-3 text-xs gap-1 ${currentAlign === "right" ? "bg-amber-500 text-slate-950 hover:bg-amber-600" : ""}`}
                onClick={() => onChange({ ...value, textAlign: "right" })}
              >
                <AlignRight className="h-3.5 w-3.5" /> Справа
              </Button>
            </div>
          </div>

          {/* Horizontal & Vertical Offsets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Shift X */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-muted-foreground flex items-center gap-1">
                  <ArrowLeftRight className="h-3 w-3 text-amber-500" /> Смещение X (← влево / вправо →)
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{currentOffsetX}px</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-150"
                  max="150"
                  step="2"
                  value={currentOffsetX}
                  onChange={(e) => onChange({ ...value, offsetX: Number(e.target.value) })}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-xs text-muted-foreground hover:text-foreground shrink-0"
                  title="Сбросить X на 0"
                  onClick={() => onChange({ ...value, offsetX: 0 })}
                >
                  0
                </Button>
              </div>
            </div>

            {/* Shift Y */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-muted-foreground flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3 text-amber-500" /> Смещение Y (↑ вверх / вниз ↓)
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{currentOffsetY}px</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="2"
                  value={currentOffsetY}
                  onChange={(e) => onChange({ ...value, offsetY: Number(e.target.value) })}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-xs text-muted-foreground hover:text-foreground shrink-0"
                  title="Сбросить Y на 0"
                  onClick={() => onChange({ ...value, offsetY: 0 })}
                >
                  0
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Color Presets */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1">
        <span className="text-[10px] text-muted-foreground mr-1">Быстрый цвет:</span>
        {PRESET_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange({ ...value, color: c.value })}
            className="w-5 h-5 rounded-full border border-black/20 dark:border-white/20 transition-transform hover:scale-125 shadow-sm"
            style={{ backgroundColor: c.value }}
            title={c.label}
          />
        ))}
      </div>
    </div>
  );
}

export function AdminHeroSection() {
  useSEO({ robots: "noindex, follow" });
  const [data, setData] = useState<HeroSectionData>(DEFAULT_HERO_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/site-settings/${SETTINGS_KEY}`);
      if (res.ok) {
        const json = await res.json();
        if (json.value && typeof json.value === "object") {
          setData({
            ...DEFAULT_HERO_DATA,
            ...json.value,
            styles: json.value.styles || {},
          });
        }
      }
    } catch (e) {
      console.error("Failed to load hero section settings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("admin_token") || localStorage.getItem("auth_token");
      const res = await fetch(`/api/admin/site-settings/${SETTINGS_KEY}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: data }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Не удалось сохранить");
      }

      // Invalidate React Query cache so hero section updates immediately
      queryClient.invalidateQueries({ queryKey: ["site-settings", SETTINGS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });

      toast.success("✅ Тексты, цвета и шрифты главного экрана успешно сохранены!");
    } catch (e: any) {
      toast.error(e.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Сбросить все тексты, цвета и шрифты к значениям по умолчанию?")) {
      setData(DEFAULT_HERO_DATA);
      toast.info("Настройки сброшены к значениям по умолчанию. Не забудьте нажать 'Сохранить изменения'.");
    }
  };

  const updateStyle = (key: keyof NonNullable<HeroSectionData["styles"]>, style: TextStyleItem) => {
    setData((prev) => ({
      ...prev,
      styles: {
        ...prev.styles,
        [key]: style,
      },
    }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <LayoutTemplate className="h-7 w-7 text-amber-500" />
            Главный экран (Hero Section)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Настройте все тексты, цвета и шрифты для каждого элемента в первом блоке сайта.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset} size="sm" className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> По умолчанию
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Сохранить изменения
          </Button>
        </div>
      </div>

      {/* Sections Visibility Manager */}
      <Card className="border shadow-sm border-amber-500/30 bg-amber-500/[0.02]">
        <CardHeader className="pb-4 border-b bg-amber-500/10">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-amber-500" />
              Управление видимостью секций сайта
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Включайте или отключайте любые секции сайта. Отключенная секция полностью исчезает со страницы и не оставляет пустого места (высота 0px).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: "hero", label: "Главный экран (Hero Section)", icon: LayoutTemplate, desc: "Первый экран с постером и заголовком" },
              { key: "featured_courses", label: "Каталог видеокурсов", icon: Film, desc: "Сетка курсов и мастер-классов" },
              { key: "about", label: "Обо мне / История мастера", icon: Award, desc: "Блок с фото и биографией" },
              { key: "social_videos", label: "Соцсети (YouTube & TikTok)", icon: Play, desc: "Видеоролики с внешних платформ" },
              { key: "events_gallery", label: "Галерея мероприятий", icon: Camera, desc: "Фотографии с выступлений и шоу" },
              { key: "reviews", label: "Отзывы и шоу для праздника", icon: Star, desc: "Отзывы клиентов и блок заказа шоу" },
            ].map(({ key, label, icon: Icon, desc }) => {
              const isVisible = data.sectionsVisibility?.[key as keyof NonNullable<HeroSectionData["sectionsVisibility"]>] !== false && (key !== "hero" || data.hidden !== true);
              return (
                <div
                  key={key}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isVisible
                      ? "bg-background border-slate-200 dark:border-slate-800 shadow-sm"
                      : "bg-red-500/5 border-red-500/30 opacity-80"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Icon className={`h-4 w-4 ${isVisible ? "text-amber-500" : "text-red-400"}`} />
                        <span>{label}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isVisible
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      }`}>
                        {isVisible ? "Активна" : "Скрыта"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">{desc}</p>
                  </div>

                  <Button
                    type="button"
                    variant={isVisible ? "outline" : "destructive"}
                    size="sm"
                    className="w-full text-xs h-8 gap-1.5 font-medium"
                    onClick={() => {
                      const nextVal = !isVisible;
                      setData((prev) => ({
                        ...prev,
                        hidden: key === "hero" ? !nextVal : prev.hidden,
                        sectionsVisibility: {
                          ...prev.sectionsVisibility,
                          [key]: nextVal,
                        },
                      }));
                    }}
                  >
                    {isVisible ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5 text-red-500" /> Скрыть секцию
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Показать секцию
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Proposition & Badges */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4 border-b bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Главный заголовок, описание и бейджи
          </CardTitle>
          <CardDescription>
            Настройка текстов, цветов и шрифтов для верхнего блока предложения
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Top Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 p-3.5 rounded-xl border bg-muted/10">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1 mr-2">
                  <label className="text-xs font-semibold">Бейдж 1 (Текст)</label>
                  <Input
                    value={data.badge1}
                    onChange={(e) => setData({ ...data, badge1: e.target.value })}
                    placeholder="Искусство удивлять"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 mt-5"
                  title="Удалить Бейдж 1 (будет скрыт на сайте)"
                  onClick={() => setData({ ...data, badge1: "" })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {!data.badge1 && <p className="text-[11px] text-red-400 font-medium">⚠ Скрыт на сайте</p>}
              <StylePicker
                title="Шрифт и цвет Бейджа 1"
                value={data.styles?.badge1}
                onChange={(st) => updateStyle("badge1", st)}
                showBg
              />
            </div>

            <div className="space-y-3 p-3.5 rounded-xl border bg-muted/10">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1 mr-2">
                  <label className="text-xs font-semibold">Бейдж 2 (Текст)</label>
                  <Input
                    value={data.badge2}
                    onChange={(e) => setData({ ...data, badge2: e.target.value })}
                    placeholder="С трудоустройством"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 mt-5"
                  title="Удалить Бейдж 2 (будет скрыт на сайте)"
                  onClick={() => setData({ ...data, badge2: "" })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {!data.badge2 && <p className="text-[11px] text-red-400 font-medium">⚠ Скрыт на сайте</p>}
              <StylePicker
                title="Шрифт и цвет Бейджа 2"
                value={data.styles?.badge2}
                onChange={(st) => updateStyle("badge2", st)}
                showBg
              />
            </div>
          </div>

          {/* Heading H1 */}
          <div className="space-y-3 p-4 rounded-xl border bg-muted/10">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 flex-1">
                <label className="text-sm font-semibold">Главный заголовок H1 <span className="text-red-500">*</span></label>
                <Textarea
                  rows={2}
                  value={data.heading}
                  onChange={(e) => setData({ ...data, heading: e.target.value })}
                  placeholder="Научись фокусам, которые действительно хочется показать друзьям"
                  className="resize-none font-semibold text-base"
                  style={{
                    fontFamily: data.styles?.heading?.fontFamily || undefined,
                    color: data.styles?.heading?.color || undefined,
                  }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 mt-6"
                title="Удалить заголовок (будет скрыт на сайте)"
                onClick={() => setData({ ...data, heading: "" })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {!data.heading && <p className="text-[11px] text-red-400 font-medium">⚠ Заголовок скрыт на сайте</p>}
            <StylePicker
              title="Шрифт и цвет главного заголовка"
              value={data.styles?.heading}
              onChange={(st) => updateStyle("heading", st)}
            />
          </div>

          {/* Subheading */}
          <div className="space-y-3 p-4 rounded-xl border bg-muted/10">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 flex-1">
                <label className="text-sm font-semibold">Подзаголовок / Описание</label>
                <Textarea
                  rows={3}
                  value={data.subheading}
                  onChange={(e) => setData({ ...data, subheading: e.target.value })}
                  placeholder="Научись эффектным фокусам, раскрывай секреты иллюзионного искусства..."
                  className="resize-none"
                  style={{
                    fontFamily: data.styles?.subheading?.fontFamily || undefined,
                    color: data.styles?.subheading?.color || undefined,
                  }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 mt-6"
                title="Удалить описание (будет скрыто на сайте)"
                onClick={() => setData({ ...data, subheading: "" })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {!data.subheading && <p className="text-[11px] text-red-400 font-medium">⚠ Описание скрыто на сайте</p>}
            <StylePicker
              title="Шрифт и цвет подзаголовка"
              value={data.styles?.subheading}
              onChange={(st) => updateStyle("subheading", st)}
            />
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 p-4 rounded-xl border bg-muted/10">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1 mr-2">
                  <label className="text-xs font-semibold">Основная кнопка (Текст)</label>
                  <Input
                    value={data.ctaPrimaryText}
                    onChange={(e) => setData({ ...data, ctaPrimaryText: e.target.value })}
                    placeholder="Смотри секрет трюка"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 mt-5"
                  title="Удалить основную кнопку"
                  onClick={() => setData({ ...data, ctaPrimaryText: "" })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {!data.ctaPrimaryText && <p className="text-[11px] text-red-400 font-medium">⚠ Скрыта на сайте</p>}
              <div className="space-y-1">
                <label className="text-xs font-semibold">Ссылка</label>
                <Input
                  value={data.ctaPrimaryLink}
                  onChange={(e) => setData({ ...data, ctaPrimaryLink: e.target.value })}
                  placeholder="/catalog"
                />
              </div>
              <StylePicker
                title="Шрифт и цвет основной кнопки"
                value={data.styles?.ctaPrimary}
                onChange={(st) => updateStyle("ctaPrimary", st)}
                showBg
              />
            </div>

            <div className="space-y-3 p-4 rounded-xl border bg-muted/10">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1 mr-2">
                  <label className="text-xs font-semibold">Вторая кнопка (Интерактив)</label>
                  <Input
                    value={data.ctaSecondaryText}
                    onChange={(e) => setData({ ...data, ctaSecondaryText: e.target.value })}
                    placeholder="Хочешь удивить друзей?"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 mt-5"
                  title="Удалить вторую кнопку"
                  onClick={() => setData({ ...data, ctaSecondaryText: "" })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {!data.ctaSecondaryText && <p className="text-[11px] text-red-400 font-medium">⚠ Скрыта на сайте</p>}
              <StylePicker
                title="Шрифт и цвет второй кнопки"
                value={data.styles?.ctaSecondary}
                onChange={(st) => updateStyle("ctaSecondary", st)}
                showBg
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Orbit Cards */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4 border-b bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-500" />
            Пять плавающих бейджей вокруг фото
          </CardTitle>
          <CardDescription>
            Тексты, шрифты и цвета плавающих карточек на орбите постера
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <StylePicker
            title="Общий шрифт и цвет для плавающих карточек"
            value={data.styles?.orbitCards}
            onChange={(st) => updateStyle("orbitCards", st)}
            showSecondaryColor
            secondaryColorLabel="Цвет подписи/описания"
          />

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="p-3.5 rounded-xl border bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-current" /> Карточка 1 (Опыт / Звезда)
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Удалить карточку 1 целиком"
                  onClick={() => setData({ ...data, orbit1Value: "", orbit1Label: "" })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {(!data.orbit1Value && !data.orbit1Label) && <p className="text-[11px] text-red-400 font-medium">⚠ Карточка скрыта на сайте</p>}
              <Input
                value={data.orbit1Value}
                onChange={(e) => setData({ ...data, orbit1Value: e.target.value })}
                placeholder="10+"
                className="font-bold"
              />
              <Input
                value={data.orbit1Label}
                onChange={(e) => setData({ ...data, orbit1Label: e.target.value })}
                placeholder="лет в мире иллюзий"
              />
            </div>

            {/* Card 2 */}
            <div className="p-3.5 rounded-xl border bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Карточка 2 (Видеоуроки)
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Удалить карточку 2 целиком"
                  onClick={() => setData({ ...data, orbit2Title: "", orbit2Subtitle: "", orbit2Desc: "" })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {(!data.orbit2Title && !data.orbit2Subtitle && !data.orbit2Desc) && <p className="text-[11px] text-red-400 font-medium">⚠ Карточка скрыта на сайте</p>}
              <Input
                value={data.orbit2Title}
                onChange={(e) => setData({ ...data, orbit2Title: e.target.value })}
                placeholder="Видеоуроки"
                className="font-bold text-amber-500"
              />
              <Input
                value={data.orbit2Subtitle}
                onChange={(e) => setData({ ...data, orbit2Subtitle: e.target.value })}
                placeholder="понятно и пошагово"
              />
              <Input
                value={data.orbit2Desc}
                onChange={(e) => setData({ ...data, orbit2Desc: e.target.value })}
                placeholder="Практический опыт..."
                className="text-xs"
              />
            </div>

            {/* Card 3 */}
            <div className="p-3.5 rounded-xl border bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Карточка 3 (✨ Первый фокус)
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Удалить карточку 3 целиком"
                  onClick={() => setData({ ...data, orbit3Title: "", orbit3Desc: "" })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {(!data.orbit3Title && !data.orbit3Desc) && <p className="text-[11px] text-red-400 font-medium">⚠ Карточка скрыта на сайте</p>}
              <Input
                value={data.orbit3Title}
                onChange={(e) => setData({ ...data, orbit3Title: e.target.value })}
                placeholder="Первый фокус"
                className="font-bold"
              />
              <Input
                value={data.orbit3Desc}
                onChange={(e) => setData({ ...data, orbit3Desc: e.target.value })}
                placeholder="Научись своему первому..."
                className="text-xs"
              />
            </div>

            {/* Card 4 */}
            <div className="p-3.5 rounded-xl border bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Карточка 4 (Бесплатно)
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Удалить карточку 4 целиком"
                  onClick={() => setData({ ...data, orbit4Title: "", orbit4Subtitle: "" })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {(!data.orbit4Title && !data.orbit4Subtitle) && <p className="text-[11px] text-red-400 font-medium">⚠ Карточка скрыта на сайте</p>}
              <Input
                value={data.orbit4Title}
                onChange={(e) => setData({ ...data, orbit4Title: e.target.value })}
                placeholder="Бесплатно"
                className="font-bold text-emerald-500"
              />
              <Input
                value={data.orbit4Subtitle}
                onChange={(e) => setData({ ...data, orbit4Subtitle: e.target.value })}
                placeholder="Попробуй первый урок"
              />
            </div>

            {/* Card 5 */}
            <div className="p-3.5 rounded-xl border bg-muted/10 space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Карточка 5 (Для всех)
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Удалить карточку 5 целиком"
                  onClick={() => setData({ ...data, orbit5Title: "", orbit5Desc: "" })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {(!data.orbit5Title && !data.orbit5Desc) && <p className="text-[11px] text-red-400 font-medium">⚠ Карточка скрыта на сайте</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  value={data.orbit5Title}
                  onChange={(e) => setData({ ...data, orbit5Title: e.target.value })}
                  placeholder="Для всех"
                  className="font-bold"
                />
                <Input
                  value={data.orbit5Desc}
                  onChange={(e) => setData({ ...data, orbit5Desc: e.target.value })}
                  placeholder="от новичков до увлечённых магией"
                />
              </div>
            </div>
          </div>

          {/* Delete all 5 orbit cards at once */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => {
                if (confirm("Удалить все 5 плавающих бейджей вокруг фото? Они будут скрыты на сайте.")) {
                  setData({
                    ...data,
                    orbit1Value: "", orbit1Label: "",
                    orbit2Title: "", orbit2Subtitle: "", orbit2Desc: "",
                    orbit3Title: "", orbit3Desc: "",
                    orbit4Title: "", orbit4Subtitle: "",
                    orbit5Title: "", orbit5Desc: "",
                  });
                  toast.info("Все 5 карточек очищены. Нажмите 'Сохранить' для применения.");
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Удалить все 5 бейджей
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Author Tagline & Stats Bar */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4 border-b bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Гарантийный бейдж и 3 блока преимуществ
          </CardTitle>
          <CardDescription>
            Иконка-бейдж с главным УТП под постером (заголовок + подзаголовок) и три карточки ценностного предложения с настройкой цветов и шрифтов
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Guarantee Pill (formerly Author Tagline) */}
          <div className="space-y-3 p-4 rounded-xl border bg-muted/10">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600">
                ✨ Гарантийный бейдж под постером
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                title="Удалить гарантийный бейдж (будет скрыт на сайте)"
                onClick={() => setData({ ...data, authorName: "", authorRole: "" })}
              >
                <Trash2 className="h-3.5 w-3.5" /> Удалить бейдж
              </Button>
            </div>
            {(!data.authorName && !data.authorRole) && <p className="text-[11px] text-red-400 font-medium">⚠ Гарантийный бейдж скрыт на сайте</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Главный УТП (жирный текст)</label>
                <Input
                  value={data.authorName}
                  onChange={(e) => setData({ ...data, authorName: e.target.value })}
                  placeholder="✨ Первый трюк за 15 минут"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Подзаголовок бейджа</label>
                <Input
                  value={data.authorRole}
                  onChange={(e) => setData({ ...data, authorRole: e.target.value })}
                  placeholder="понятный разбор секрета без сложного реквизита"
                />
              </div>
            </div>
            <StylePicker
              title="Шрифт и цвета для блока автора"
              value={data.styles?.authorTagline}
              onChange={(st) => updateStyle("authorTagline", st)}
              showSecondaryColor
              secondaryColorLabel="Цвет должности/роли"
            />
          </div>

          {/* Stats Bar */}
          <div className="space-y-3 p-4 rounded-xl border bg-muted/10">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Три карточки преимуществ (внизу Hero)
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                title="Удалить все три карточки статистики"
                onClick={() => {
                  if (confirm("Удалить все три карточки преимуществ? Они будут скрыты на сайте.")) {
                    setData({ ...data, stat1Value: "", stat1Label: "", stat2Value: "", stat2Label: "", stat3Value: "", stat3Label: "" });
                    toast.info("Карточки очищены. Нажмите 'Сохранить' для применения.");
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Удалить все
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border bg-background space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-amber-600">⚡ Карточка 1 — Заголовок</label>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" title="Очистить карточку 1" onClick={() => setData({ ...data, stat1Value: "", stat1Label: "" })}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {(!data.stat1Value && !data.stat1Label) && <p className="text-[10px] text-red-400">⚠ Скрыта</p>}
                <Input
                  value={data.stat1Value}
                  onChange={(e) => setData({ ...data, stat1Value: e.target.value })}
                  placeholder="15 минут на трюк"
                  className="font-bold"
                />
                <Input
                  value={data.stat1Label}
                  onChange={(e) => setData({ ...data, stat1Label: e.target.value })}
                  placeholder="пошаговое объяснение и легкий старт с нуля"
                  className="text-xs"
                />
              </div>

              <div className="p-3 rounded-lg border bg-background space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-amber-600">🎥 Карточка 2 — Заголовок</label>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" title="Очистить карточку 2" onClick={() => setData({ ...data, stat2Value: "", stat2Label: "" })}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {(!data.stat2Value && !data.stat2Label) && <p className="text-[10px] text-red-400">⚠ Скрыта</p>}
                <Input
                  value={data.stat2Value}
                  onChange={(e) => setData({ ...data, stat2Value: e.target.value })}
                  placeholder="HD и 2 ракурса"
                  className="font-bold"
                />
                <Input
                  value={data.stat2Label}
                  onChange={(e) => setData({ ...data, stat2Label: e.target.value })}
                  placeholder="крупные планы: вид со стороны и глазами фокусника"
                  className="text-xs"
                />
              </div>

              <div className="p-3 rounded-lg border bg-background space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-amber-600">🛡 Карточка 3 — Заголовок</label>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" title="Очистить карточку 3" onClick={() => setData({ ...data, stat3Value: "", stat3Label: "" })}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {(!data.stat3Value && !data.stat3Label) && <p className="text-[10px] text-red-400">⚠ Скрыта</p>}
                <Input
                  value={data.stat3Value}
                  onChange={(e) => setData({ ...data, stat3Value: e.target.value })}
                  placeholder="Доступ навсегда"
                  className="font-bold"
                />
                <Input
                  value={data.stat3Label}
                  onChange={(e) => setData({ ...data, stat3Label: e.target.value })}
                  placeholder="учись 24/7 в удобном темпе с любого устройства"
                  className="text-xs"
                />
              </div>
            </div>

            <StylePicker
              title="Шрифт и цвета для карточек статистики"
              value={data.styles?.stats}
              onChange={(st) => updateStyle("stats", st)}
              showSecondaryColor
              secondaryColorLabel="Цвет подписи (Labels)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Marquee Running Ticker */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4 border-b bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-500" />
            Бегущая строка (Marquee Ticker)
          </CardTitle>
          <CardDescription>
            Фразы, цвет и шрифт бегущей строки внизу первого блока
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Фразы через запятую</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                title="Удалить бегущую строку (будет скрыта на сайте)"
                onClick={() => setData({ ...data, marqueeItemsText: "" })}
              >
                <Trash2 className="h-3.5 w-3.5" /> Удалить
              </Button>
            </div>
            {!data.marqueeItemsText && <p className="text-[11px] text-red-400 font-medium">⚠ Бегущая строка скрыта на сайте</p>}
            <Textarea
              rows={3}
              value={data.marqueeItemsText}
              onChange={(e) => setData({ ...data, marqueeItemsText: e.target.value })}
              placeholder="Фокусы, Иллюзии, Секреты магии, Карточные трюки, Ментальная магия..."
              style={{
                fontFamily: data.styles?.marquee?.fontFamily || undefined,
                color: data.styles?.marquee?.color || undefined,
              }}
            />
          </div>
          <StylePicker
            title="Шрифт и цвет бегущей строки"
            value={data.styles?.marquee}
            onChange={(st) => updateStyle("marquee", st)}
          />
        </CardContent>
      </Card>

      {/* Bottom Save Bar */}
      <div className="flex justify-end gap-3 sticky bottom-4 z-20 bg-background/95 backdrop-blur-md p-4 rounded-xl border shadow-lg">
        <Button variant="outline" onClick={handleReset}>
          Сбросить
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8">
          {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Сохранить все тексты, цвета и шрифты
        </Button>
      </div>
    </div>
  );
}
