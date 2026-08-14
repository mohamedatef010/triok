import { useState, useEffect } from 'react';
import { useSEO } from '@/hooks/use-seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/states';
import {
  Save,
  Plus,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Camera,
  Calendar,
  MapPin,
  Tag,
  CheckCircle2,
  Eye,
  X,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const SETTINGS_KEY = 'events_gallery_section';

export interface EventPhoto {
  id: string;
  imageUrl: string;
  title: string;
  tag?: string;
  eventDate?: string;
  location?: string;
  description?: string;
}

export interface EventsGallerySectionData {
  badgeText: string;
  heading: string;
  subheading: string;
  ctaText?: string;
  ctaLink?: string;
  photos: EventPhoto[];
}

const DEFAULT_DATA: EventsGallerySectionData = {
  badgeText: 'Живые выступления и магия',
  heading: 'Фото с мероприятий и шоу',
  subheading: 'Корпоративы, свадьбы, закрытые VIP-вечеринки и детские праздники. Настоящие эмоции и восторг зрителей!',
  ctaText: 'Заказать выступление на праздник',
  ctaLink: '/contacts',
  photos: [],
};

const SUGGESTED_TAGS = [
  'Корпоратив',
  'Свадьба',
  'Детский праздник',
  'VIP Шоу',
  'Фестиваль',
  'Сцена',
  'Микромагия',
];

/** Convert any uploaded image file to WebP in browser using Canvas API */
async function convertImageToWebP(file: File, quality = 0.88): Promise<{ blob: Blob; originalSize: number; newSize: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              blob,
              originalSize: file.size,
              newSize: blob.size,
            });
          } else {
            reject(new Error('Failed to convert image to WebP'));
          }
        },
        'image/webp',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file'));
    };
    img.src = objectUrl;
  });
}

/** Upload WebP image via API server (server uploads to S3 internally — no browser→MinIO direct connection needed) */
async function uploadWebPToStorage(file: File, token: string): Promise<{ publicUrl: string; savedPercent: number }> {
  const { blob, originalSize, newSize } = await convertImageToWebP(file);
  const savedPercent = Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100));

  const uploadRes = await fetch(`${API_BASE}/api/admin/upload-image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'image/webp',
    },
    body: blob,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Ошибка загрузки изображения');
  }

  const { url: publicUrl } = (await uploadRes.json()) as { url: string; key: string };
  return { publicUrl, savedPercent };
}

async function fetchSetting(token: string): Promise<EventsGallerySectionData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/site-settings/${SETTINGS_KEY}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch');
    const json = await res.json();
    return json.value as EventsGallerySectionData;
  } catch {
    return null;
  }
}

async function saveSetting(token: string, value: EventsGallerySectionData): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/admin/site-settings/${SETTINGS_KEY}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value }),
  });
  return res.ok;
}

export function AdminEventsGallery() {
  useSEO({ robots: 'noindex, follow' });
  const [data, setData] = useState<EventsGallerySectionData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<EventPhoto | null>(null);
  const token = localStorage.getItem('admin_token') ?? localStorage.getItem('auth_token') ?? '';

  useEffect(() => {
    fetchSetting(token).then((d) => {
      if (d) {
        if (!d.photos) d.photos = [];
        setData(d);
      }
      setLoading(false);
    });
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveSetting(token, data);
    setSaving(false);
    if (ok) {
      toast.success('Раздел "Фото с мероприятий" успешно сохранен!');
    } else {
      toast.error('Ошибка при сохранении данных.');
    }
  };

  const handleAddPhoto = () => {
    const newPhoto: EventPhoto = {
      id: Date.now().toString(),
      imageUrl: '',
      title: 'Новое мероприятие',
      tag: 'Корпоратив',
      eventDate: 'Недавно',
      location: 'Москва',
      description: 'Незабываемое интерактивное шоу и фокусы для гостей праздника.',
    };
    setData((prev) => ({ ...prev, photos: [newPhoto, ...prev.photos] }));
  };

  const handleRemovePhoto = (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту фотографию?')) return;
    setData((prev) => ({ ...prev, photos: prev.photos.filter((p) => p.id !== id) }));
    toast.info('Фотография удалена из списка');
  };

  const handleMovePhoto = (index: number, direction: 'up' | 'down') => {
    const newPhotos = [...data.photos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPhotos.length) return;
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[targetIndex];
    newPhotos[targetIndex] = temp;
    setData((prev) => ({ ...prev, photos: newPhotos }));
  };

  const updatePhoto = (id: string, key: keyof EventPhoto, value: string) => {
    setData((prev) => ({
      ...prev,
      photos: prev.photos.map((p) => (p.id === id ? { ...p, [key]: value } : p)),
    }));
  };

  const handleImageUpload = async (file: File, photoId: string) => {
    setUploadingId(photoId);
    try {
      toast.info('Оптимизация и конвертация в WebP...');
      const { publicUrl, savedPercent } = await uploadWebPToStorage(file, token);
      updatePhoto(photoId, 'imageUrl', publicUrl);
      toast.success(`Фото загружено в WebP! (Сжатие: -${savedPercent}%)`);
    } catch (err: any) {
      toast.error(err.message || 'Ошибка загрузки изображения');
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-extrabold text-xs uppercase tracking-widest mb-1">
            <Camera className="h-4 w-4" />
            Маркетинговая галерея
          </div>
          <h1 className="text-2xl font-black tracking-tight">Фото с мероприятий (صور من المناسبات)</h1>
          <p className="text-sm text-muted-foreground">
            Управляйте фотографиями ваших выступлений. Все изображения автоматически конвертируются в легкий и быстрый формат <b>WebP</b>.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={handleAddPhoto}
            variant="outline"
            className="flex-1 sm:flex-none gap-2 rounded-xl border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
          >
            <Plus className="h-4 w-4" /> Добавить фото
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black shadow-lg shadow-amber-500/20"
          >
            {saving ? <LoadingSpinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            Сохранить
          </Button>
        </div>
      </div>

      {/* Section Global Settings */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 dark:bg-slate-950/40 border-b pb-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
            <Sparkles className="h-4 w-4" /> Настройки заголовков и текста раздела
          </div>
          <CardDescription>Эти тексты отображаются вверху блока на главной странице сайта</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Бейдж / Маленький заголовок
              </label>
              <Input
                value={data.badgeText}
                onChange={(e) => setData({ ...data, badgeText: e.target.value })}
                placeholder="Живые выступления и магия"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Главный заголовок
              </label>
              <Input
                value={data.heading}
                onChange={(e) => setData({ ...data, heading: e.target.value })}
                placeholder="Фото с мероприятий и шоу"
                className="rounded-xl font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Подзаголовок / Маркетинговое описание
            </label>
            <Textarea
              value={data.subheading}
              onChange={(e) => setData({ ...data, subheading: e.target.value })}
              placeholder="Корпоративы, свадьбы, закрытые VIP-вечеринки и детские праздники..."
              rows={2}
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Текст кнопки заказа (CTA)
              </label>
              <Input
                value={data.ctaText || ''}
                onChange={(e) => setData({ ...data, ctaText: e.target.value })}
                placeholder="Заказать выступление на праздник"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Ссылка кнопки заказа
              </label>
              <Input
                value={data.ctaLink || ''}
                onChange={(e) => setData({ ...data, ctaLink: e.target.value })}
                placeholder="/contacts"
                className="rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-500" />
            Список фотографий ({data.photos.length})
          </h2>
          <span className="text-xs text-muted-foreground">Формат: WebP (быстрая загрузка без потери качества)</span>
        </div>

        {data.photos.length === 0 ? (
          <Card className="rounded-2xl border-2 border-dashed p-12 text-center">
            <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <h3 className="text-base font-bold mb-1">Фотографии пока не добавлены</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Нажмите кнопку «Добавить фото», чтобы загрузить яркие снимки с ваших мероприятий.
            </p>
            <Button onClick={handleAddPhoto} className="gap-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-600">
              <Plus className="h-4 w-4" /> Добавить первое фото
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.photos.map((photo, index) => (
              <Card
                key={photo.id}
                className="rounded-2xl border shadow-sm overflow-hidden hover:border-amber-500/30 transition-all"
              >
                <div className="p-5 flex flex-col md:flex-row gap-6 items-start">
                  {/* Photo Preview & Upload Zone */}
                  <div className="w-full md:w-56 shrink-0 flex flex-col items-center gap-2">
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center group">
                      {photo.imageUrl ? (
                        <>
                          <img
                            src={photo.imageUrl}
                            alt={photo.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8 rounded-full shadow"
                              onClick={() => setPreviewPhoto(photo)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-3 text-muted-foreground">
                          <Camera className="h-8 w-8 mx-auto mb-1 opacity-40" />
                          <span className="text-xs">Нет изображения</span>
                        </div>
                      )}

                      {uploadingId === photo.id && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-xs gap-1.5 backdrop-blur-xs">
                          <LoadingSpinner className="h-6 w-6 text-amber-400" />
                          <span>Конвертация в WebP...</span>
                        </div>
                      )}
                    </div>

                    {/* Upload button */}
                    <label className="w-full cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, photo.id);
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={uploadingId === photo.id}
                        className="w-full text-xs font-bold rounded-lg pointer-events-none gap-1.5"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {photo.imageUrl ? 'Заменить (WebP)' : 'Загрузить фото'}
                      </Button>
                    </label>
                  </div>

                  {/* Photo Details Form */}
                  <div className="flex-1 space-y-3 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                          Название мероприятия / Заголовок
                        </label>
                        <Input
                          value={photo.title}
                          onChange={(e) => updatePhoto(photo.id, 'title', e.target.value)}
                          placeholder="Шоу на корпоративе"
                          className="rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                          Категория / Тег
                        </label>
                        <div className="flex gap-2">
                          <Input
                            value={photo.tag || ''}
                            onChange={(e) => updatePhoto(photo.id, 'tag', e.target.value)}
                            placeholder="Корпоратив, Свадьба, VIP"
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick tag chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground text-[11px] font-semibold">Быстрый тег:</span>
                      {SUGGESTED_TAGS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updatePhoto(photo.id, 'tag', t)}
                          className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold transition ${
                            photo.tag === t
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-300'
                              : 'bg-muted/50 border-muted hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                          <Calendar className="inline h-3.5 w-3.5 mr-1 -mt-0.5" /> Дата или сезон
                        </label>
                        <Input
                          value={photo.eventDate || ''}
                          onChange={(e) => updatePhoto(photo.id, 'eventDate', e.target.value)}
                          placeholder="Май 2024 / Недавно"
                          className="rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                          <MapPin className="inline h-3.5 w-3.5 mr-1 -mt-0.5" /> Локация / Город
                        </label>
                        <Input
                          value={photo.location || ''}
                          onChange={(e) => updatePhoto(photo.id, 'location', e.target.value)}
                          placeholder="Москва / Банкетный зал"
                          className="rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                        Краткое описание / Эмоции
                      </label>
                      <Input
                        value={photo.description || ''}
                        onChange={(e) => updatePhoto(photo.id, 'description', e.target.value)}
                        placeholder="Интерактивная магия, левитация и восторг гостей праздника"
                        className="rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Actions (Reorder & Delete) */}
                  <div className="flex md:flex-col items-center justify-end gap-1.5 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => handleMovePhoto(index, 'up')}
                      title="Переместить выше"
                      className="h-8 w-8 rounded-lg"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={index === data.photos.length - 1}
                      onClick={() => handleMovePhoto(index, 'down')}
                      title="Переместить ниже"
                      className="h-8 w-8 rounded-lg"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemovePhoto(photo.id)}
                      title="Удалить"
                      className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating Save Button on Mobile */}
      <div className="fixed bottom-6 right-6 sm:hidden z-40">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="rounded-full shadow-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black gap-2 px-6"
        >
          {saving ? <LoadingSpinner className="h-5 w-5" /> : <Save className="h-5 w-5" />}
          Сохранить
        </Button>
      </div>

      {/* Lightbox Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-black/60 text-white hover:bg-black/90 flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative aspect-[16/10] bg-black flex items-center justify-center">
              <img src={previewPhoto.imageUrl} alt={previewPhoto.title} className="w-full h-full object-contain" />
            </div>
            <div className="p-6 bg-slate-900 text-white space-y-1">
              <div className="inline-block px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold mb-1">
                {previewPhoto.tag || 'Мероприятие'}
              </div>
              <h3 className="text-xl font-bold">{previewPhoto.title}</h3>
              {previewPhoto.description && (
                <p className="text-sm text-slate-400">{previewPhoto.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEventsGallery;
