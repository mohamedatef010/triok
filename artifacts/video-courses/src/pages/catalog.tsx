import { useState } from "react";
import { Link } from "wouter";
import { useListVideos, useListCategories, ListVideosSort } from "@workspace/api-client-react";
import { Search, Filter, SlidersHorizontal, Play, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoGridSkeleton, ErrorState } from "@/components/ui/states";
import { useDebounce } from "@/hooks/use-debounce";

export function CatalogPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState<ListVideosSort>("newest");
  const [page, setPage] = useState(1);

  const { data: categories } = useListCategories();
  
  const { data: videosData, isLoading, error } = useListVideos({
    search: debouncedSearch || undefined,
    categoryId,
    sort,
    page,
    limit: 12
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">Каталог курсов</h1>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between bg-muted/30 p-4 rounded-2xl border">
        
        <div className="relative w-full md:w-96 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск по курсам..." 
            className="pl-9 bg-background border-none shadow-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Categories Tab (Desktop) */}
          <div className="hidden lg:block">
            <Tabs defaultValue="all" value={categoryId ? String(categoryId) : "all"} onValueChange={(v) => { setCategoryId(v === "all" ? undefined : Number(v)); setPage(1); }}>
              <TabsList className="bg-background border shadow-sm">
                <TabsTrigger value="all">Все</TabsTrigger>
                {categories?.map(cat => (
                  <TabsTrigger key={cat.id} value={String(cat.id)}>{cat.name}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Categories Select (Mobile) */}
          <div className="lg:hidden w-full sm:w-auto">
            <Select value={categoryId ? String(categoryId) : "all"} onValueChange={(v) => { setCategoryId(v === "all" ? undefined : Number(v)); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories?.map(cat => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={sort} onValueChange={(v: ListVideosSort) => { setSort(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Новые</SelectItem>
                <SelectItem value="popular">Популярные</SelectItem>
                <SelectItem value="rating">Рейтинг</SelectItem>
                <SelectItem value="price_asc">Цена (дешевле)</SelectItem>
                <SelectItem value="price_desc">Цена (дороже)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <VideoGridSkeleton />
      ) : error ? (
        <ErrorState error={error} />
      ) : videosData?.videos.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 rounded-3xl border border-dashed">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Filter className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Курсы не найдены</h3>
          <p className="text-muted-foreground mb-6">Попробуйте изменить параметры поиска или фильтры</p>
          <Button variant="outline" onClick={() => { setSearch(""); setCategoryId(undefined); }}>
            Сбросить фильтры
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videosData?.videos.map((video) => (
              <Link key={video.id} href={`/video/${video.id}`} className="group flex flex-col gap-3 bg-card rounded-2xl p-3 border shadow-sm hover:shadow-md transition-all">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
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
                </div>
                <div className="px-1 pb-1 flex flex-col flex-1">
                  <h3 className="font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors flex-1">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current mr-1" />
                      <span className="font-medium text-foreground">{video.averageRating.toFixed(1)}</span>
                    </div>
                    <span>•</span>
                    <span>{video.reviewCount} отзывов</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {video.discountPrice ? (
                      <>
                        <span className="font-bold text-lg text-primary">{video.discountPrice} ₽</span>
                        <span className="text-sm text-muted-foreground line-through">{video.price} ₽</span>
                      </>
                    ) : (
                      <span className="font-bold text-lg text-primary">{video.price} ₽</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {videosData && videosData.total > videosData.limit && (
            <div className="flex justify-center mt-12 gap-2">
              <Button 
                variant="outline" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Назад
              </Button>
              <div className="flex items-center px-4 font-medium">
                Страница {page} из {Math.ceil(videosData.total / videosData.limit)}
              </div>
              <Button 
                variant="outline" 
                disabled={page >= Math.ceil(videosData.total / videosData.limit)}
                onClick={() => setPage(p => p + 1)}
              >
                Вперед
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
