import { useState, useEffect, useRef, useCallback } from "react";
import { useSEO } from "@/hooks/use-seo";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/states";
import { Save, RefreshCw, Upload, ImageIcon, Film, Palette, Type } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const SETTINGS_KEY = "author_section";

interface Chapter {
  label: string;
  heading: string;
  text: string;
}

interface TextStyle {
  fontFamily?: string;
  color?: string;
}

interface AuthorSectionData {
  badgeText: string;
  heading: string;
  subheading: string;
  quote: string;
  authorName: string;
  authorTitle: string;
  photoUrl: string;
  photoMediaType?: "image" | "video";
  backgroundPhotoUrl: string;
  chapters: Chapter[];
  skills: string[];
  socialLinks?: {
    telegram?: string;
    whatsapp?: string;
    instagram?: string;
    vk?: string;
    youtube?: string;
    rutube?: string;
    dzen?: string;
    boosty?: string;
    profi?: string;
    gorko?: string;
    mailru?: string;
  };
  entertainmentVideos?: {
    url: string;
    platform: "youtube" | "tiktok";
    title: string;
  }[];
  textStyles?: Record<string, TextStyle>;
}

const DEFAULT_DATA: AuthorSectionData = {
  badgeText: "История мастера & Мой путь",
  heading: "Как иллюзионное искусство стало ремеслом всей жизни",
  subheading: "От первого карточного трюка до создания обучающей системы для сотен учеников",
  quote: "Иллюзия — это искусство удивлять и дарить людям яркие эмоции. На моих курсах я раскрываю секреты профессиональных фокусов и обучаю технике, которая захватывает внимание зрителей с первых секунд.",
  authorName: "Максим Берестнев",
  authorTitle: "Иллюзионист, менталист, автор обучающих курсов",
  photoUrl: "",
  photoMediaType: "image",
  backgroundPhotoUrl: "/n13.jpg",
  chapters: [
    { label: "Глава 1", heading: "Первые шаги и освоение мастерства", text: "Начинал с изучения классической механики карточных трюков и сценического мастерства. Доводил каждое движение пальцев до абсолютной точности." },
    { label: "Глава 2", heading: "Выступления и практический опыт", text: "Перешел к сценическим шоу и интерактивной магии. Выступил перед сотнями зрителей и отточил психологию управления вниманием." },
    { label: "Глава 3", heading: "Авторская методика обучения", text: "Создал пошаговую систему обучения фокусам: от базовых приемов до зрелищных ментальных трюков." },
  ],
  skills: ["Карточная магия", "Микромагия", "Ментальная магия", "Сценическая иллюзия", "Интерактивные трюки", "Психология внимания"],
  socialLinks: {
    telegram: "",
    whatsapp: "",
    instagram: "",
    vk: "",
    youtube: "",
    rutube: "",
    dzen: "",
    boosty: "",
    profi: "",
    gorko: "",
    mailru: "",
  },
  entertainmentVideos: [
    {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      platform: "youtube",
      title: "Мой первый успешный фокус на сцене",
    },
    {
      url: "https://www.tiktok.com/@tiktok/video/7106594312292453678",
      platform: "tiktok",
      title: "Быстрый карточный трюк для начинающих",
    },
  ],
  textStyles: {},
};

async function fetchSetting(token: string): Promise<AuthorSectionData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/site-settings/${SETTINGS_KEY}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch");
    const json = await res.json();
    return json.value as AuthorSectionData;
  } catch {
    return null;
  }
}

async function saveSetting(token: string, value: AuthorSectionData): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/admin/site-settings/${SETTINGS_KEY}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ value }),
  });
  return res.ok;
}

async function uploadImage(_token: string, file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

async function uploadVideo(token: string, file: File): Promise<string | null> {
  try {
    const urlRes = await fetch(`${API_BASE}/api/admin/upload-author-video-url`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!urlRes.ok) return null;

    const { uploadUrl, key } = await urlRes.json();

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "video/mp4" },
    });
    if (!putRes.ok) return null;

    const processRes = await fetch(`${API_BASE}/api/admin/process-author-video`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key }),
    });
    if (!processRes.ok) return null;

    const { url } = await processRes.json();
    return url as string;
  } catch {
    return null;
  }
}

function isVideoMedia(url: string, mediaType?: string): boolean {
  if (mediaType === "video") return true;
  if (mediaType === "image") return false;
  return /^data:video\//.test(url) || /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
}

function resolveAuthorMediaUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("/api/author-media/")) return url;
  const match = url.match(/\/author-media\/([^/?#]+)$/);
  if (match) return `/api/author-media/${match[1]}`;
  return url;
}

function TextStylePicker({
  value = {},
  onChange,
}: {
  value?: TextStyle;
  onChange: (val: TextStyle) => void;
}) {
  const fonts = [
    { name: "Системный (По умолчанию)", value: "" },
    
    // Modern Sans-serif
    { name: "Inter", value: "Inter, sans-serif" },
    { name: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', sans-serif" },
    { name: "Montserrat", value: "Montserrat, sans-serif" },
    { name: "Roboto", value: "Roboto, sans-serif" },
    { name: "Open Sans", value: "'Open Sans', sans-serif" },
    { name: "Comfortaa (Округлый)", value: "Comfortaa, sans-serif" },
    { name: "Oswald (Узкий)", value: "Oswald, sans-serif" },
    
    // Classic Serif
    { name: "Georgia", value: "Georgia, serif" },
    { name: "Times New Roman", value: "'Times New Roman', Times, serif" },
    { name: "Playfair Display", value: "'Playfair Display', serif" },
    { name: "Lora", value: "Lora, serif" },
    { name: "Merriweather", value: "Merriweather, serif" },
    { name: "Roboto Slab", value: "'Roboto Slab', serif" },
    
    // System Web-Safe
    { name: "Arial", value: "Arial, Helvetica, sans-serif" },
    { name: "Verdana", value: "Verdana, Geneva, sans-serif" },
    { name: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
    { name: "Trebuchet MS", value: "'Trebuchet MS', Helvetica, sans-serif" },
    
    // Stylized
    { name: "Impact (Жирный)", value: "Impact, Charcoal, sans-serif" },
    { name: "Comic Sans MS (Рукописный)", value: "'Comic Sans MS', cursive" },
    { name: "Courier New (Моноширинный)", value: "'Courier New', Courier, monospace" },
  ];

  const colors = [
    { name: "По умолчанию", value: "" },
    { name: "Золотой", value: "#d97706" }, // Amber-600
    { name: "Синий", value: "#4f46e5" }, // Indigo-600
    { name: "Зеленый", value: "#059669" }, // Emerald-600
    { name: "Красный", value: "#e11d48" }, // Rose-600
    { name: "Темный", value: "#1e293b" }, // Slate-800
    { name: "Белый", value: "#ffffff" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="h-10 w-10 p-0 flex items-center justify-center shrink-0 border-slate-200 dark:border-slate-700 bg-background"
          title="Настройка шрифта и цвета"
        >
          <Palette className="h-4 w-4 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 space-y-4 bg-popover border border-border rounded-xl shadow-lg z-50" align="end">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5" /> Шрифт (Font)
          </label>
          <select
            value={value.fontFamily || ""}
            onChange={(e) => onChange({ ...value, fontFamily: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          >
            {fonts.map((f) => (
              <option 
                key={f.name} 
                value={f.value} 
                className="bg-popover text-foreground"
                style={{ fontFamily: f.value || "inherit" }}
              >
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5" /> Цвет (Color)
          </label>
          <div className="grid grid-cols-7 gap-2">
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => onChange({ ...value, color: c.value })}
                className={`h-7 w-7 rounded-full border shadow-sm transition-transform hover:scale-110 ${
                  value.color === c.value || (!value.color && !c.value)
                    ? "ring-2 ring-amber-500 ring-offset-1"
                    : "border-slate-200"
                }`}
                style={{
                  backgroundColor: c.value || "transparent",
                  backgroundImage: !c.value ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)" : "none",
                  backgroundSize: !c.value ? "8px 8px" : "auto",
                }}
                title={c.name}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border mt-2">
            <span className="text-xs text-muted-foreground">Свой цвет:</span>
            <input
              type="color"
              value={value.color || "#000000"}
              onChange={(e) => onChange({ ...value, color: e.target.value })}
              className="h-6 w-12 cursor-pointer rounded border border-input p-0 bg-transparent"
            />
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="pt-2 border-t border-border mt-2 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Предварительный просмотр
          </span>
          <div 
            className="rounded-lg border border-dashed p-3 bg-slate-50 dark:bg-slate-900/50 text-center flex items-center justify-center min-h-[50px] shadow-inner"
            style={{
              fontFamily: value.fontFamily || "inherit",
              color: value.color || "inherit",
            }}
          >
            <span className="text-base font-bold transition-all">
              АБВГД abcde 123
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AdminAuthorSection() {
  useSEO({ robots: "noindex, follow" });
  const { user } = useAuth();
  const [data, setData] = useState<AuthorSectionData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const bgPhotoInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("admin_token") ?? "";

  useEffect(() => {
    fetchSetting(token).then((d) => {
      if (d) setData(d);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveSetting(token, data);
    setSaving(false);
    if (ok) {
      toast.success("Настройки сохранены! Изменения отобразятся на сайте.");
      alert("Успешно сохранено! / تم حفظ البيانات بنجاح!");
    } else {
      toast.error("Ошибка при сохранении. Проверьте подключение.");
      alert("Ошибка при сохранении! / حدث خطأ أثناء حفظ البيانات!");
    }
  };

  const handlePhotoUpload = async (file: File, field: "photoUrl" | "backgroundPhotoUrl") => {
    setUploading(true);

    if (field === "photoUrl" && file.type.startsWith("video/")) {
      if (file.size > 100 * 1024 * 1024) {
        setUploading(false);
        toast.error("Видео слишком большое. Максимум 100 МБ.");
        return;
      }

      const url = await uploadVideo(token, file);
      setUploading(false);
      if (url) {
        setData((prev) => ({ ...prev, photoUrl: url, photoMediaType: "video" }));
        toast.success("Видео загружено и оптимизировано!");
      } else {
        toast.error("Ошибка загрузки видео. Проверьте подключение к серверу.");
      }
      return;
    }

    const url = await uploadImage(token, file);
    setUploading(false);
    if (url) {
      setData((prev) => ({
        ...prev,
        [field]: url,
        ...(field === "photoUrl" ? { photoMediaType: "image" as const } : {}),
      }));
      toast.success("Изображение загружено!");
    } else {
      toast.error("Ошибка загрузки изображения.");
    }
  };

  const updateChapter = (index: number, field: keyof Chapter, value: string) => {
    setData((prev) => ({
      ...prev,
      chapters: prev.chapters.map((ch, i) =>
        i === index ? { ...ch, [field]: value } : ch
      ),
    }));
  };

  const updateSkills = (rawText: string) => {
    setData((prev) => ({
      ...prev,
      skills: rawText.split("\n").map((s) => s.trim()).filter(Boolean),
    }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Контент: История мастера</h1>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 sm:px-6 w-full sm:w-auto shrink-0"
        >
          {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? "Сохранение..." : "Сохранить изменения"}
        </Button>
      </div>

      {/* Section Header */}
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="text-lg">Заголовок секции</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Текст значка (Badge)</label>
            <div className="flex gap-2 items-center">
              <Input
                value={data.badgeText}
                onChange={(e) => setData((p) => ({ ...p, badgeText: e.target.value }))}
                style={{
                  fontFamily: data.textStyles?.badgeText?.fontFamily,
                  color: data.textStyles?.badgeText?.color,
                }}
              />
              <TextStylePicker
                value={data.textStyles?.badgeText}
                onChange={(style) =>
                  setData((p) => ({
                    ...p,
                    textStyles: { ...p.textStyles, badgeText: style },
                  }))
                }
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Главный заголовок (H2)</label>
            <div className="flex gap-2 items-center">
              <Input
                value={data.heading}
                onChange={(e) => setData((p) => ({ ...p, heading: e.target.value }))}
                style={{
                  fontFamily: data.textStyles?.heading?.fontFamily,
                  color: data.textStyles?.heading?.color,
                }}
              />
              <TextStylePicker
                value={data.textStyles?.heading}
                onChange={(style) =>
                  setData((p) => ({
                    ...p,
                    textStyles: { ...p.textStyles, heading: style },
                  }))
                }
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Подзаголовок</label>
            <div className="flex gap-2 items-center">
              <Input
                value={data.subheading}
                onChange={(e) => setData((p) => ({ ...p, subheading: e.target.value }))}
                style={{
                  fontFamily: data.textStyles?.subheading?.fontFamily,
                  color: data.textStyles?.subheading?.color,
                }}
              />
              <TextStylePicker
                value={data.textStyles?.subheading}
                onChange={(style) =>
                  setData((p) => ({
                    ...p,
                    textStyles: { ...p.textStyles, subheading: style },
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="text-lg">Фотографии</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Author Photo / Video */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground block">Фото / Видео автора (основное)</label>
            <div className="relative w-full aspect-[4/5] max-w-[220px] rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center">
              {data.photoUrl ? (
                isVideoMedia(data.photoUrl, data.photoMediaType) ? (
                  <video
                    src={resolveAuthorMediaUrl(data.photoUrl)}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                  />
                ) : (
                  <img src={data.photoUrl} alt="Author" className="w-full h-full object-cover" />
                )
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <ImageIcon className="h-10 w-10" />
                  <span className="text-xs">Нет фото / видео</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={
                  data.photoUrl.startsWith("data:")
                    ? "✓ Изображение загружено"
                    : isVideoMedia(data.photoUrl, data.photoMediaType)
                      ? "✓ Видео загружено"
                      : data.photoUrl
                }
                onChange={(e) => setData((p) => ({ ...p, photoUrl: e.target.value, photoMediaType: "image" }))}
                placeholder="URL или загрузите файл"
                className="flex-1 text-sm"
                readOnly={data.photoUrl.startsWith("data:") || isVideoMedia(data.photoUrl, data.photoMediaType)}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => photoInputRef.current?.click()}
                title="Загрузить фото или видео"
              >
                {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file, "photoUrl");
                  e.target.value = "";
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Film className="h-3.5 w-3.5" />
              Можно загрузить фото или видео (до 30 сек., автоматически оптимизируется)
            </p>
          </div>

          {/* Background Photo */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground block">Фоновое изображение карточки</label>
            <div className="relative w-full aspect-[4/5] max-w-[220px] rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center">
              {data.backgroundPhotoUrl ? (
                <img src={data.backgroundPhotoUrl} alt="Background" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <ImageIcon className="h-10 w-10" />
                  <span className="text-xs">Нет фото</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={data.backgroundPhotoUrl.startsWith('data:') ? '✓ Изображение загружено' : data.backgroundPhotoUrl}
                onChange={(e) => setData((p) => ({ ...p, backgroundPhotoUrl: e.target.value }))}
                placeholder="URL или загрузите файл"
                className="flex-1 text-sm"
                readOnly={data.backgroundPhotoUrl.startsWith('data:')}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => bgPhotoInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <input
                ref={bgPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file, "backgroundPhotoUrl");
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Author Info */}
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="text-lg">Информация об авторе</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Имя автора</label>
            <div className="flex gap-2 items-center">
              <Input
                value={data.authorName}
                onChange={(e) => setData((p) => ({ ...p, authorName: e.target.value }))}
                style={{
                  fontFamily: data.textStyles?.authorName?.fontFamily,
                  color: data.textStyles?.authorName?.color,
                }}
              />
              <TextStylePicker
                value={data.textStyles?.authorName}
                onChange={(style) =>
                  setData((p) => ({
                    ...p,
                    textStyles: { ...p.textStyles, authorName: style },
                  }))
                }
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Должность / специализация</label>
            <div className="flex gap-2 items-center">
              <Input
                value={data.authorTitle}
                onChange={(e) => setData((p) => ({ ...p, authorTitle: e.target.value }))}
                style={{
                  fontFamily: data.textStyles?.authorTitle?.fontFamily,
                  color: data.textStyles?.authorTitle?.color,
                }}
              />
              <TextStylePicker
                value={data.textStyles?.authorTitle}
                onChange={(style) =>
                  setData((p) => ({
                    ...p,
                    textStyles: { ...p.textStyles, authorTitle: style },
                  }))
                }
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Цитата / Речевой пузырь</label>
            <div className="flex gap-2 items-start">
              <Textarea
                value={data.quote}
                onChange={(e) => setData((p) => ({ ...p, quote: e.target.value }))}
                rows={4}
                className="resize-none"
                style={{
                  fontFamily: data.textStyles?.quote?.fontFamily,
                  color: data.textStyles?.quote?.color,
                }}
              />
              <TextStylePicker
                value={data.textStyles?.quote}
                onChange={(style) =>
                  setData((p) => ({
                    ...p,
                    textStyles: { ...p.textStyles, quote: style },
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapters */}
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="text-lg">Главы истории (Timeline)</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {data.chapters.map((ch, idx) => (
            <div key={idx} className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3">
              <div className="text-xs font-black uppercase tracking-widest text-amber-600">
                {ch.label || `Глава ${idx + 1}`}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Метка (Глава 1, Глава 2...)</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      value={ch.label}
                      onChange={(e) => updateChapter(idx, "label", e.target.value)}
                      placeholder="Глава 1"
                      style={{
                        fontFamily: data.textStyles?.[`chapter_${idx}_label`]?.fontFamily,
                        color: data.textStyles?.[`chapter_${idx}_label`]?.color,
                      }}
                    />
                    <TextStylePicker
                      value={data.textStyles?.[`chapter_${idx}_label`]}
                      onChange={(style) =>
                        setData((p) => ({
                          ...p,
                          textStyles: { ...p.textStyles, [`chapter_${idx}_label`]: style },
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Заголовок</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      value={ch.heading}
                      onChange={(e) => updateChapter(idx, "heading", e.target.value)}
                      placeholder="2014 — Начало пути"
                      style={{
                        fontFamily: data.textStyles?.[`chapter_${idx}_heading`]?.fontFamily,
                        color: data.textStyles?.[`chapter_${idx}_heading`]?.color,
                      }}
                    />
                    <TextStylePicker
                      value={data.textStyles?.[`chapter_${idx}_heading`]}
                      onChange={(style) =>
                        setData((p) => ({
                          ...p,
                          textStyles: { ...p.textStyles, [`chapter_${idx}_heading`]: style },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Описание</label>
                <div className="flex gap-2 items-start">
                  <Textarea
                    value={ch.text}
                    onChange={(e) => updateChapter(idx, "text", e.target.value)}
                    rows={3}
                    className="resize-none"
                    style={{
                      fontFamily: data.textStyles?.[`chapter_${idx}_text`]?.fontFamily,
                      color: data.textStyles?.[`chapter_${idx}_text`]?.color,
                    }}
                  />
                  <TextStylePicker
                    value={data.textStyles?.[`chapter_${idx}_text`]}
                    onChange={(style) =>
                      setData((p) => ({
                        ...p,
                        textStyles: { ...p.textStyles, [`chapter_${idx}_text`]: style },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="text-lg">Навыки / Технологии (по одному на строку)</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={data.skills.join("\n")}
            onChange={(e) => updateSkills(e.target.value)}
            rows={6}
            className="font-mono text-sm resize-none"
            placeholder="Adobe Premiere Pro&#10;DaVinci Resolve&#10;After Effects"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Каждый навык на новой строке. Они отображаются как кнопки-теги на странице.
          </p>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="text-lg">Социальные сети и профили</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground mb-4">
            Вставьте ссылки на ваши профили. Если поле пустое, иконка не будет отображаться на сайте.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Telegram</label>
              <Input
                placeholder="https://t.me/username"
                value={data.socialLinks?.telegram ?? ""}
                onChange={(e) => setData((p) => ({ ...p, socialLinks: { ...p.socialLinks, telegram: e.target.value } }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">WhatsApp</label>
              <Input
                placeholder="https://wa.me/1234567890"
                value={data.socialLinks?.whatsapp ?? ""}
                onChange={(e) => setData((p) => ({ ...p, socialLinks: { ...p.socialLinks, whatsapp: e.target.value } }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Instagram</label>
              <Input
                placeholder="https://instagram.com/username"
                value={data.socialLinks?.instagram ?? ""}
                onChange={(e) => setData((p) => ({ ...p, socialLinks: { ...p.socialLinks, instagram: e.target.value } }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">ВКонтакте (ВК)</label>
              <Input
                placeholder="https://vk.com/username"
                value={data.socialLinks?.vk ?? ""}
                onChange={(e) => setData((p) => ({ ...p, socialLinks: { ...p.socialLinks, vk: e.target.value } }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">YouTube</label>
              <Input
                placeholder="https://youtube.com/@channel"
                value={data.socialLinks?.youtube ?? ""}
                onChange={(e) => setData((p) => ({ ...p, socialLinks: { ...p.socialLinks, youtube: e.target.value } }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">RuTube</label>
              <Input
                placeholder="https://rutube.ru/channel/..."
                value={data.socialLinks?.rutube ?? ""}
                onChange={(e) => setData((p) => ({ ...p, socialLinks: { ...p.socialLinks, rutube: e.target.value } }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Дзен</label>
              <Input
                placeholder="https://dzen.ru/username"
                value={data.socialLinks?.dzen ?? ""}
                onChange={(e) => setData((p) => ({ ...p, socialLinks: { ...p.socialLinks, dzen: e.target.value } }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Boosty</label>
              <Input
                placeholder="https://boosty.to/username"
                value={data.socialLinks?.boosty ?? ""}
                onChange={(e) => setData((p) => ({ ...p, socialLinks: { ...p.socialLinks, boosty: e.target.value } }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Профи.ру</label>
              <Input
                placeholder="https://profi.ru/profile/..."
                value={data.socialLinks?.profi ?? ""}
                onChange={(e) => setData((p) => ({ ...p, socialLinks: { ...p.socialLinks, profi: e.target.value } }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Gorko.ru</label>
              <Input
                placeholder="https://gorko.ru/..."
                value={data.socialLinks?.gorko ?? ""}
                onChange={(e) => setData((p) => ({ ...p, socialLinks: { ...p.socialLinks, gorko: e.target.value } }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Email / Mail.ru</label>
              <Input
                placeholder="example@mail.ru"
                value={data.socialLinks?.mailru ?? ""}
                onChange={(e) => setData((p) => ({ ...p, socialLinks: { ...p.socialLinks, mailru: e.target.value } }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entertainment Videos (YouTube & TikTok) */}
      <Card className="border-none shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Развлекательные видео (YouTube & TikTok)</CardTitle>
          <p className="text-sm text-muted-foreground">Добавьте ссылки на видео из YouTube и TikTok, которые будут отображаться на сайте.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {(data.entertainmentVideos && data.entertainmentVideos.length > 0) ? (
            <div className="space-y-4">
              {data.entertainmentVideos.map((video, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Платформа</label>
                        <select
                          value={video.platform}
                          onChange={(e) => {
                            const newVideos = [...(data.entertainmentVideos || [])];
                            newVideos[idx] = { ...newVideos[idx], platform: e.target.value as 'youtube' | 'tiktok' };
                            setData({ ...data, entertainmentVideos: newVideos });
                          }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="youtube">YouTube</option>
                          <option value="tiktok">TikTok</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Название видео</label>
                        <Input
                          value={video.title}
                          placeholder="Введите название"
                          onChange={(e) => {
                            const newVideos = [...(data.entertainmentVideos || [])];
                            newVideos[idx] = { ...newVideos[idx], title: e.target.value };
                            setData({ ...data, entertainmentVideos: newVideos });
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Ссылка на видео (YouTube / TikTok)</label>
                      <Input
                        value={video.url}
                        placeholder="https://www.youtube.com/watch?v=... или https://www.tiktok.com/@user/video/..."
                        onChange={(e) => {
                          const newVideos = [...(data.entertainmentVideos || [])];
                          newVideos[idx] = { ...newVideos[idx], url: e.target.value };
                          setData({ ...data, entertainmentVideos: newVideos });
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const newVideos = (data.entertainmentVideos || []).filter((_, i) => i !== idx);
                        setData({ ...data, entertainmentVideos: newVideos });
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-border rounded-xl">
              <p className="text-sm text-muted-foreground">Нет добавленных видео. Нажмите кнопку ниже, чтобы добавить.</p>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={() => {
              const newVideos = [...(data.entertainmentVideos || []), { url: "", platform: "youtube" as const, title: "" }];
              setData({ ...data, entertainmentVideos: newVideos });
            }}

          >
            + Добавить видео
          </Button>
        </CardContent>
      </Card>

      {/* Save Button Bottom */}
      <div className="flex justify-end pb-8">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8"
        >
          {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? "Сохранение..." : "Сохранить все изменения"}
        </Button>
      </div>
    </div>
  );
}
