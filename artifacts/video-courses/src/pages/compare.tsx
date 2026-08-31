import { Link } from "wouter";
import { useCompareStore } from "@/hooks/use-compare";
import { Button } from "@/components/ui/button";
import { 
  Scale, 
  Trash2, 
  ArrowRight, 
  Star, 
  Play, 
  Clock, 
  Eye, 
  Layers, 
  Sparkles, 
  ChevronLeft, 
  Plus, 
  Flame,
  MessageSquare,
} from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { formatDuration } from "@/lib/utils";
import { TrickDifficultyBadge } from "@/components/ui/trick-difficulty";

export function ComparePage() {
  useSEO({ robots: "noindex, follow" });
  const { videos, removeVideo, clear } = useCompareStore();

  if (videos.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 sm:py-28 flex flex-col items-center justify-center text-center max-w-lg">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-400/10 border border-amber-400/25 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-amber-500/5">
          <Scale className="h-10 w-10 text-amber-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black mb-3 tracking-tight">Сравнение обучения</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-8 leading-relaxed">
          Вы пока не добавили обучение для сравнения. Откройте каталог и добавьте до 3 позиций, чтобы наглядно сравнить цены, сложность и отзывы.
        </p>
        <Button size="lg" className="btn-glow font-bold rounded-2xl h-12 px-8 bg-amber-400 hover:bg-amber-300 text-slate-950" asChild>
          <Link href="/catalog">
            Перейти в каталог
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-3.5 sm:px-4 lg:px-6 py-4 sm:py-8 max-w-7xl">
        
        {/* ── Top Header & Actions ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/catalog">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full -ml-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 gap-1.5 px-3 py-1.5 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>В каталог</span>
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
                Сравнение обучения
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                  {videos.length} из 3
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {videos.length < 3 && (
              <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs gap-1.5 border-dashed" asChild>
                <Link href="/catalog">
                  <Plus className="h-3.5 w-3.5 text-amber-500" />
                  <span>Добавить еще</span>
                </Link>
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clear} 
              className="text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Очистить</span>
            </Button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            MOBILE & TABLET RESPONSIVE COMPARISON (Block < lg)
        ══════════════════════════════════════════════════════ */}
        <div className="block lg:hidden">
          <div className="flex gap-3.5 overflow-x-auto pb-6 pt-1 snap-x snap-mandatory -mx-3.5 px-3.5 xs:mx-0 xs:px-0">
            {videos.map((video) => {
              const durText = formatDuration(video.durationSeconds) || formatDuration((video as any)?.duration);
              const discountPercent = (video.discountPrice && video.price && video.price > video.discountPrice)
                ? Math.round(((video.price - video.discountPrice) / video.price) * 100)
                : null;
              const currentPrice = video.discountPrice ?? video.price;

              return (
                <div
                  key={video.id}
                  className="w-[270px] xs:w-[300px] shrink-0 snap-start flex flex-col justify-between bg-card/90 dark:bg-card/70 border border-border/80 rounded-2xl xs:rounded-3xl p-3.5 xs:p-4 shadow-lg backdrop-blur-xl relative"
                >
                  {/* Top Thumbnail Box */}
                  <div className="relative aspect-video rounded-xl xs:rounded-2xl overflow-hidden bg-slate-950 mb-3 group">
                    <img 
                      src={video.thumbnailUrl || "https://image.qwenlm.ai/public_source/2d826fc3-d8ca-4fdd-afe7-1a198c300694/19903dcea-c171-465f-b4af-c85e8b69b3a5.png"} 
                      alt={video.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    
                    {/* Delete button */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-destructive text-white backdrop-blur-sm z-10"
                      onClick={() => removeVideo(video.id)}
                      title="Удалить из сравнения"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>

                    {/* Discount badge */}
                    {discountPercent && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md border border-white/20">
                        -{discountPercent}%
                      </div>
                    )}
                  </div>

                  {/* Course Title */}
                  <Link href={`/video/${video.id}`} className="font-extrabold text-sm xs:text-base leading-snug line-clamp-2 hover:text-amber-500 transition-colors mb-3">
                    {video.title}
                  </Link>

                  {/* Price Banner */}
                  <div className="p-2.5 xs:p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-primary/5 to-muted/40 border border-amber-500/20 mb-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Цена
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base xs:text-lg font-black text-foreground">
                          {currentPrice} ₽
                        </span>
                        {video.discountPrice && video.price && video.price > video.discountPrice && (
                          <span className="text-xs text-muted-foreground line-through font-semibold">
                            {video.price} ₽
                          </span>
                        )}
                      </div>
                    </div>
                    {video.categoryName && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-400/15 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold border border-amber-400/25">
                        {video.categoryName}
                      </span>
                    )}
                  </div>

                  {/* Structured Comparison Rows */}
                  <div className="space-y-2 text-xs font-semibold mb-4">
                    {/* Rating & Reviews */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Рейтинг:
                      </span>
                      <span className="font-bold text-foreground">
                        {video.averageRating ? Number(video.averageRating).toFixed(1) : "0.0"} ({video.reviewCount ?? 0} отз.)
                      </span>
                    </div>

                    {/* Difficulty */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Сложность:
                      </span>
                      <TrickDifficultyBadge difficulty={video.difficulty} size="xs" showIcon={false} />
                    </div>

                    {/* Duration */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-500" /> Длительность:
                      </span>
                      <span className="font-bold text-foreground">
                        {durText || "—"}
                      </span>
                    </div>

                    {/* Views */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-amber-500" /> Просмотры:
                      </span>
                      <span className="font-bold text-foreground">
                        {video.viewCount ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Action CTA Button */}
                  <Button className="w-full h-10 font-black rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs shadow-md shadow-amber-400/20 btn-glow" asChild>
                    <Link href={`/video/${video.id}`}>
                      Смотреть курс
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              );
            })}

            {/* Empty Slot Card on Mobile if < 3 */}
            {Array.from({ length: 3 - videos.length }).map((_, i) => (
              <div
                key={`empty-mob-${i}`}
                className="w-[240px] xs:w-[260px] shrink-0 snap-start flex flex-col items-center justify-center p-6 text-center bg-muted/10 border-2 border-dashed border-border/80 rounded-2xl xs:rounded-3xl hover:border-amber-400/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground mb-3">
                  <Plus className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-sm mb-1">Свободное место</h4>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Добавьте еще один курс из каталога для сравнения
                </p>
                <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs border-dashed" asChild>
                  <Link href="/catalog">Выбрать в каталоге</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            DESKTOP STRUCTURED COMPARISON TABLE (Block >= lg)
        ══════════════════════════════════════════════════════ */}
        <div className="hidden lg:block overflow-x-auto pb-8">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-4 gap-6">
              
              {/* Column 1: Feature Labels Column */}
              <div className="flex flex-col">
                {/* Header spacer matches video card height */}
                <div className="h-64 flex flex-col justify-end pb-4 font-bold text-sm text-muted-foreground">
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">Параметры</span>
                    <span className="text-sm font-black text-foreground">Сравнение характеристик</span>
                  </div>
                </div>

                {/* Attribute label rows */}
                <div className="space-y-4 pt-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  <div className="h-14 flex items-center px-4 rounded-2xl bg-muted/20 border border-border/40 gap-2">
                    <Flame className="h-4 w-4 text-amber-500" />
                    <span>Стоимость</span>
                  </div>
                  <div className="h-14 flex items-center px-4 rounded-2xl bg-muted/20 border border-border/40 gap-2">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span>Рейтинг учеников</span>
                  </div>
                  <div className="h-14 flex items-center px-4 rounded-2xl bg-muted/20 border border-border/40 gap-2">
                    <MessageSquare className="h-4 w-4 text-amber-500" />
                    <span>Количество отзывов</span>
                  </div>
                  <div className="h-14 flex items-center px-4 rounded-2xl bg-muted/20 border border-border/40 gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Уровень сложности</span>
                  </div>
                  <div className="h-14 flex items-center px-4 rounded-2xl bg-muted/20 border border-border/40 gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span>Длительность</span>
                  </div>
                  <div className="h-14 flex items-center px-4 rounded-2xl bg-muted/20 border border-border/40 gap-2">
                    <Eye className="h-4 w-4 text-amber-500" />
                    <span>Просмотры</span>
                  </div>
                  <div className="h-14 flex items-center px-4 rounded-2xl bg-muted/20 border border-border/40 gap-2">
                    <Layers className="h-4 w-4 text-amber-500" />
                    <span>Раздел каталога</span>
                  </div>
                </div>
              </div>

              {/* Columns 2, 3, 4: Active Videos & Empty Slots */}
              {videos.map((video) => {
                const durText = formatDuration(video.durationSeconds) || formatDuration((video as any)?.duration);
                const discountPercent = (video.discountPrice && video.price && video.price > video.discountPrice)
                  ? Math.round(((video.price - video.discountPrice) / video.price) * 100)
                  : null;
                const currentPrice = video.discountPrice ?? video.price;

                return (
                  <div key={video.id} className="flex flex-col">
                    {/* Header Top Card */}
                    <div className="h-64 relative bg-card/90 dark:bg-card/70 border border-border/80 rounded-3xl p-4 shadow-md flex flex-col justify-between group hover:border-amber-400/40 transition-all">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-3 right-3 h-8 w-8 rounded-full text-muted-foreground hover:text-destructive z-10 bg-background/70 backdrop-blur-md"
                        onClick={() => removeVideo(video.id)}
                        title="Удалить из сравнения"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 mb-2">
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        {discountPercent && (
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-amber-600 text-white text-[11px] font-black px-2 py-0.5 rounded-lg shadow-md border border-white/20">
                            -{discountPercent}%
                          </div>
                        )}
                      </div>

                      <Link href={`/video/${video.id}`} className="font-bold text-sm leading-snug line-clamp-2 hover:text-amber-500 transition-colors flex-1">
                        {video.title}
                      </Link>
                    </div>

                    {/* Data attribute rows */}
                    <div className="space-y-4 pt-4 font-semibold text-sm">
                      {/* Price */}
                      <div className="h-14 flex items-center px-4 rounded-2xl bg-card border border-border/70">
                        {video.discountPrice ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-amber-600 dark:text-amber-400 font-black text-base">{video.discountPrice} ₽</span>
                            <span className="text-xs text-muted-foreground line-through">{video.price} ₽</span>
                          </div>
                        ) : (
                          <span className="font-black text-base">{video.price} ₽</span>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="h-14 flex items-center px-4 rounded-2xl bg-card border border-border/70 text-amber-500 gap-1.5 font-bold">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-foreground">{video.averageRating ? Number(video.averageRating).toFixed(1) : "0.0"}</span>
                        <span className="text-xs text-muted-foreground">/ 5.0</span>
                      </div>

                      {/* Reviews */}
                      <div className="h-14 flex items-center px-4 rounded-2xl bg-card border border-border/70">
                        <span>{video.reviewCount ?? 0} отзывов</span>
                      </div>

                      {/* Difficulty */}
                      <div className="h-14 flex items-center px-4 rounded-2xl bg-card border border-border/70">
                        <TrickDifficultyBadge difficulty={video.difficulty} size="sm" showIcon={false} />
                      </div>

                      {/* Duration */}
                      <div className="h-14 flex items-center px-4 rounded-2xl bg-card border border-border/70 text-muted-foreground font-medium">
                        {durText || "—"}
                      </div>

                      {/* Views */}
                      <div className="h-14 flex items-center px-4 rounded-2xl bg-card border border-border/70">
                        <span>{video.viewCount ?? 0}</span>
                      </div>

                      {/* Category */}
                      <div className="h-14 flex items-center px-4 rounded-2xl bg-card border border-border/70">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-400/15 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-400/25">
                          {video.categoryName || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom CTA Button */}
                    <div className="mt-6">
                      <Button className="w-full h-11 font-black rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-400/20 btn-glow" asChild>
                        <Link href={`/video/${video.id}`}>
                          Смотреть курс
                          <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Empty Placeholder Slots if < 3 */}
              {Array.from({ length: 3 - videos.length }).map((_, i) => (
                <div key={`empty-desk-${i}`} className="flex flex-col">
                  <div className="h-64 bg-muted/10 border-2 border-dashed border-border/80 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground mb-3">
                      <Scale className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-sm text-foreground/80 mb-1">Место для обучения</span>
                    <span className="text-xs text-muted-foreground">До 3 позиций одновременно</span>
                  </div>

                  <div className="space-y-4 pt-4">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <div key={j} className="h-14 rounded-2xl bg-muted/10 border border-dashed border-border/50 flex items-center justify-center text-xs text-muted-foreground/40">
                        —
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Button variant="outline" className="w-full h-11 rounded-2xl border-dashed font-bold text-xs" asChild>
                      <Link href="/catalog">
                        <Plus className="h-4 w-4 mr-1 text-amber-500" />
                        Выбрать обучение
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

