import { Link } from "wouter";
import { useFavorites } from "@/hooks/use-favorites";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Play, Star, Trash2 } from "lucide-react";

export function FavoritesPage() {
  const { items, remove } = useFavorites();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Heart className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-4">В избранном пока пусто</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Добавляйте курсы в избранное, чтобы не потерять их и вернуться к ним позже.
        </p>
        <Button size="lg" asChild>
          <Link href="/catalog">В каталог</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Избранное</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((video) => (
          <Card key={video.id} className="group flex flex-col gap-3 overflow-hidden bg-card border shadow-sm relative">
            <Link href={`/video/${video.id}`} className="block relative aspect-video bg-muted overflow-hidden">
              <img 
                src={video.thumbnailUrl || undefined} 
                alt={video.title}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <Play className="h-5 w-5 fill-current ml-1" />
                </div>
              </div>
              {video.categoryName && (
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md font-medium">
                  {video.categoryName}
                </div>
              )}
            </Link>
            <div className="px-4 pb-4 flex flex-col flex-1">
              <Link href={`/video/${video.id}`} className="font-semibold line-clamp-2 leading-tight hover:text-primary transition-colors flex-1 mb-2">
                {video.title}
              </Link>
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <div className="flex items-center text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-current mr-1" />
                  <span className="font-medium text-foreground">{video.averageRating.toFixed(1)}</span>
                </div>
                <span>•</span>
                <span>{video.reviewCount} отзывов</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {video.discountPrice ? (
                    <>
                      <span className="font-bold text-lg text-primary">{video.discountPrice} ₽</span>
                    </>
                  ) : (
                    <span className="font-bold text-lg text-primary">{video.price} ₽</span>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 -mr-2"
                  onClick={(e) => {
                    e.preventDefault();
                    remove(video.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
