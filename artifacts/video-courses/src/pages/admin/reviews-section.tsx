import { useState, useEffect } from 'react';
import { useSEO } from '@/hooks/use-seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/states';
import { Save, RefreshCw, Plus, Trash2, ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const SETTINGS_KEY = 'reviews_section';

interface Review {
  id: string;
  authorName: string;
  text: string;
  imageUrl: string;
  rating: number;
}

interface ReviewsSectionData {
  badgeText: string;
  heading: string;
  subheading: string;
  reviews: Review[];
}

const DEFAULT_DATA: ReviewsSectionData = {
  badgeText: 'Отзывы',
  heading: 'Что говорят наши ученики и клиенты',
  subheading: 'Реальные отзывы о работе и обучении от тех, кто уже попробовал',
  reviews: [],
};

async function fetchSetting(token: string): Promise<ReviewsSectionData | null> {
  try {
    const res = await fetch(API_BASE + '/api/admin/site-settings/' + SETTINGS_KEY, {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch');
    const json = await res.json();
    return json.value as ReviewsSectionData;
  } catch {
    return null;
  }
}

async function saveSetting(token: string, value: ReviewsSectionData): Promise<boolean> {
  const res = await fetch(API_BASE + '/api/admin/site-settings/' + SETTINGS_KEY, {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
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

export function AdminReviewsSection() {
  useSEO({ robots: "noindex, follow" });
  const [data, setData] = useState<ReviewsSectionData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const token = localStorage.getItem('admin_token') ?? '';

  useEffect(() => {
    fetchSetting(token).then((d) => {
      if (d) { if (!d.reviews) d.reviews = []; setData(d); }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveSetting(token, data);
    setSaving(false);
    if (ok) {
      toast.success('Настройки сохранены!');
      alert('Успешно сохранено!');
    } else {
      toast.error('Ошибка при сохранении.');
      alert('Ошибка при сохранении!');
    }
  };

  const handleUpload = async (file: File, reviewId: string) => {
    setUploadingId(reviewId);
    const url = await uploadImage(token, file);
    setUploadingId(null);
    if (url) { updateReview(reviewId, 'imageUrl', url); toast.success('Изображение загружено!'); }
    else toast.error('Ошибка загрузки изображения.');
  };

  const addReview = () => {
    setData((prev) => ({
      ...prev,
      reviews: [...prev.reviews, { id: Date.now().toString(), authorName: '', text: '', imageUrl: '', rating: 5 }],
    }));
  };

  const updateReview = (id: string, field: keyof Review, value: any) => {
    setData((prev) => ({ ...prev, reviews: prev.reviews.map((r) => r.id === id ? { ...r, [field]: value } : r) }));
  };

  const removeReview = (id: string) => {
    setData((prev) => ({ ...prev, reviews: prev.reviews.filter((r) => r.id !== id) }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Контент: Отзывы</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 sm:px-6 w-full sm:w-auto shrink-0">
          {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="text-lg">Заголовок секции</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Текст значка (Badge)</label>
            <Input value={data.badgeText} onChange={(e) => setData((p) => ({ ...p, badgeText: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Главный заголовок</label>
            <Input value={data.heading} onChange={(e) => setData((p) => ({ ...p, heading: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Подзаголовок</label>
            <Input value={data.subheading} onChange={(e) => setData((p) => ({ ...p, subheading: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Список отзывов</h2>
          <Button onClick={addReview} variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" /> Добавить отзыв</Button>
        </div>

        {data.reviews.map((review, index) => (
          <Card key={review.id} className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 relative">
              <Button variant="ghost" size="sm" className="absolute top-4 right-4 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeReview(review.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="text-xs font-black uppercase tracking-widest text-amber-600 mb-4">Отзыв #{index + 1}</div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Имя автора</label>
                    <Input value={review.authorName} onChange={(e) => updateReview(review.id, 'authorName', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Текст отзыва</label>
                    <Textarea value={review.text} onChange={(e) => updateReview(review.id, 'text', e.target.value)} rows={4} className="resize-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Рейтинг (0-5)</label>
                    <Input type="number" min={0} max={5} value={review.rating} onChange={(e) => updateReview(review.id, 'rating', Number(e.target.value))} className="w-24" />
                  </div>
                </div>
                <div className="md:col-span-4 space-y-3">
                  <label className="text-sm font-medium text-muted-foreground block">Скриншот / Изображение</label>
                  <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center">
                    {review.imageUrl ? (
                      <img src={review.imageUrl} alt="Review" className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <ImageIcon className="h-8 w-8" /><span className="text-xs">Нет фото</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input value={review.imageUrl.startsWith('data:') ? '✓ Изображение загружено' : review.imageUrl} onChange={(e) => updateReview(review.id, 'imageUrl', e.target.value)} placeholder="URL изображения" className="flex-1 text-sm" readOnly={review.imageUrl.startsWith('data:')} />
                    <Button variant="outline" size="sm" disabled={uploadingId === review.id} onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file'; input.accept = 'image/*';
                      input.onchange = (e: any) => { const file = e.target.files?.[0]; if (file) handleUpload(file, review.id); input.value = ''; };
                      input.click();
                    }}>
                      {uploadingId === review.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {data.reviews.length === 0 && (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
            Нет добавленных отзывов. Нажмите «Добавить отзыв» выше.
          </div>
        )}
      </div>

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} size="lg" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8">
          {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? 'Сохранение...' : 'Сохранить все изменения'}
        </Button>
      </div>
    </div>
  );
}
