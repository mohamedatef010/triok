import { useState, useEffect } from "react";
import { 
  Star, 
  X, 
  CheckCircle2, 
  Sparkles, 
  MessageSquare, 
  ShieldCheck, 
  Send,
  Eye,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface VideoReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: {
    id: number;
    title: string;
    thumbnailUrl?: string | null;
  } | null;
  existingReview?: {
    id?: number;
    rating: number;
    text?: string | null;
  } | null;
  onSuccess?: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "1 из 5 — Очень плохо",
  2: "2 из 5 — Не понравилось",
  3: "3 из 5 — Нормально",
  4: "4 из 5 — Хорошо, качественный материал",
  5: "5 из 5 — Отлично, восторг и рекомендация! ⭐",
};

export function VideoReviewModal({
  isOpen,
  onClose,
  video,
  existingReview,
  onSuccess,
}: VideoReviewModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [text, setText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRating(existingReview?.rating ?? 5);
      setText(existingReview?.text ?? "");
      setError(null);
    }
  }, [isOpen, existingReview]);

  if (!isOpen || !video) return null;

  const activeRating = hoverRating || rating;
  const reviewerName = user?.name || "Пользователь";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;

    if (rating < 1 || rating > 5) {
      setError("Пожалуйста, выберите оценку от 1 до 5 звезд");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/videos/${video.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rating,
          text: text.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Не удалось сохранить отзыв");
      }

      toast({
        title: existingReview ? "Отзыв обновлен" : "Отзыв опубликован!",
        description: "Ваш отзыв и оценка теперь видны всем посетителям сайта с вашим именем.",
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при отправке");
      toast({
        title: "Ошибка",
        description: err.message || "Не удалось отправить отзыв",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-card text-card-foreground rounded-3xl border shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-300 my-auto">
        {/* Header decoration */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-amber-400/15 via-amber-500/5 to-transparent border-b relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-muted/60 hover:bg-muted border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4 pr-6">
            {video.thumbnailUrl && (
              <img 
                src={video.thumbnailUrl} 
                alt={video.title} 
                className="w-16 h-12 object-cover rounded-xl border shrink-0 bg-slate-950" 
              />
            )}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-500 font-bold text-xs border border-amber-400/20 mb-1.5">
                <Sparkles className="h-3 w-3" /> {existingReview ? "Редактировать отзыв" : "Оставить отзыв"}
              </div>
              <h3 className="font-extrabold text-base sm:text-lg line-clamp-1 leading-snug">
                {video.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Star rating selector */}
          <div className="space-y-2 text-center sm:text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Ваша оценка обучения <span className="text-amber-500">*</span>
            </label>

            <div className="flex items-center justify-center sm:justify-start gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 rounded-xl hover:scale-125 transition-transform duration-200 focus:outline-none"
                  aria-label={`Оценка ${star}`}
                >
                  <Star 
                    className={`h-8 w-8 transition-colors ${
                      star <= activeRating 
                        ? "fill-amber-400 text-amber-400 drop-shadow-md" 
                        : "text-slate-300 dark:text-slate-700"
                    }`} 
                  />
                </button>
              ))}
            </div>

            <div className="text-xs font-semibold text-amber-500 dark:text-amber-400 min-h-[18px]">
              {RATING_LABELS[activeRating]}
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Ваш отзыв и впечатления
            </label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Расскажите, что вам понравилось больше всего, как помогли объяснения и секреты фокусов..."
              rows={4}
              className="rounded-2xl resize-none p-4 text-sm bg-background border-border/80 focus-visible:ring-amber-400"
            />
            <p className="text-[11px] text-muted-foreground">
              Отзыв будет опубликован на странице обучения с вашим именем: <span className="font-bold text-foreground">{reviewerName}</span>
            </p>
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-muted/40 border space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Eye className="h-3.5 w-3.5" /> Как отзыв будет выглядеть публично:
            </div>

            <div className="bg-card p-4 rounded-xl border shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                    {reviewerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-sm leading-none block">{reviewerName}</span>
                    <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
                      <ShieldCheck className="h-3 w-3" /> Проверенный покупатель
                    </span>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-3.5 w-3.5 ${
                        i < rating 
                          ? "fill-amber-400 text-amber-400" 
                          : "text-slate-300 dark:text-slate-700"
                      }`} 
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic leading-relaxed">
                {text.trim() ? `«${text.trim()}»` : "«Отличный курс, всё очень понятно и доступно!»"}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-5 h-11 font-semibold"
              disabled={isSubmitting}
            >
              Отмена
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="btn-glow font-bold rounded-xl px-6 h-11 inline-flex items-center gap-2"
            >
              {isSubmitting ? (
                <>Отправка...</>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {existingReview ? "Сохранить изменения" : "Опубликовать отзыв"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
