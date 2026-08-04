import { Link } from "wouter";
import { useCompareStore } from "@/hooks/use-compare";
import { Button } from "@/components/ui/button";
import { Scale, Trash2, ArrowRight, Star, Play } from "lucide-react";

export function ComparePage() {
  const { videos, removeVideo, clear } = useCompareStore();

  if (videos.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Scale className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Сравнение курсов</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Вы пока не добавили курсы для сравнения. Откройте каталог и добавьте курсы (до 3 штук), чтобы выбрать лучший.
        </p>
        <Button size="lg" asChild>
          <Link href="/catalog">Перейти в каталог</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Сравнение</h1>
        <Button variant="ghost" onClick={clear} className="text-muted-foreground">
          Очистить список
        </Button>
      </div>

      <div className="overflow-x-auto pb-8">
        <div className="min-w-[800px] flex">
          {/* Attributes Column */}
          <div className="w-48 shrink-0 flex flex-col font-medium text-muted-foreground mt-48 space-y-6 pt-6">
            <div className="h-14 flex items-center">Цена</div>
            <div className="h-14 flex items-center">Рейтинг</div>
            <div className="h-14 flex items-center">Отзывы</div>
            <div className="h-14 flex items-center">Просмотры</div>
            <div className="h-14 flex items-center">Категория</div>
          </div>

          {/* Videos Columns */}
          <div className="flex-1 flex gap-6">
            {videos.map(video => (
              <div key={video.id} className="flex-1 min-w-[250px] max-w-[350px] flex flex-col">
                {/* Header card */}
                <div className="relative bg-card border rounded-2xl p-4 shadow-sm mb-6 flex flex-col h-48 group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive z-10 bg-background/50 backdrop-blur-sm"
                    onClick={() => removeVideo(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="relative h-24 mb-3 rounded-lg overflow-hidden bg-muted">
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                  </div>
                  <Link href={`/video/${video.id}`} className="font-semibold line-clamp-2 hover:text-primary transition-colors flex-1">
                    {video.title}
                  </Link>
                </div>

                {/* Attributes data */}
                <div className="space-y-6 pt-6 font-medium">
                  <div className="h-14 flex items-center px-4 rounded-xl bg-muted/30">
                    {video.discountPrice ? (
                      <div className="flex flex-col">
                        <span className="text-primary font-bold">{video.discountPrice} ₽</span>
                        <span className="text-xs text-muted-foreground line-through">{video.price} ₽</span>
                      </div>
                    ) : (
                      <span>{video.price} ₽</span>
                    )}
                  </div>
                  <div className="h-14 flex items-center px-4 rounded-xl bg-muted/30 text-amber-500 gap-1">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-foreground">{video.averageRating.toFixed(1)}</span>
                  </div>
                  <div className="h-14 flex items-center px-4 rounded-xl bg-muted/30">
                    {video.reviewCount}
                  </div>
                  <div className="h-14 flex items-center px-4 rounded-xl bg-muted/30">
                    {video.viewCount}
                  </div>
                  <div className="h-14 flex items-center px-4 rounded-xl bg-muted/30">
                    {video.categoryName || "—"}
                  </div>
                </div>

                <div className="mt-8">
                  <Button className="w-full" asChild>
                    <Link href={`/video/${video.id}`}>Подробнее</Link>
                  </Button>
                </div>
              </div>
            ))}

            {/* Empty slots if < 3 */}
            {Array.from({ length: 3 - videos.length }).map((_, i) => (
              <div key={i} className="flex-1 min-w-[250px] max-w-[350px] flex flex-col">
                <div className="bg-muted/20 border border-dashed rounded-2xl h-48 mb-6 flex flex-col items-center justify-center text-muted-foreground/50">
                  <Scale className="h-8 w-8 mb-2" />
                  <span>Место для курса</span>
                </div>
                <div className="space-y-6 pt-6">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-14 rounded-xl bg-muted/10 border border-dashed" />
                  ))}
                </div>
                <div className="mt-8">
                  <Button variant="outline" className="w-full border-dashed" asChild>
                    <Link href="/catalog">Выбрать курс</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
