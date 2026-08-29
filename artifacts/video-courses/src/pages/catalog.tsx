import { useState } from "react";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "wouter";
import { useListVideos, useListCategories, ListVideosSort } from "@workspace/api-client-react";
import { Search, Filter, SlidersHorizontal, Play, Star, Sparkles, Clock } from "lucide-react";
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
import { formatDuration } from "@/lib/utils";
import { TrickDifficultyBadge } from "@/components/ui/trick-difficulty";

export function CatalogPage() {
  useSEO({
    title: "Каталог курсов по фокусам",
    description: "Обучайтесь фокусам и трюкам с профессиональными видеокурсами. Иллюзии, карточные трюки, ментальная магия и многое другое — всё в одном месте.",
    canonical: "/catalog",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Каталог курсов по фокусам — Классный Фокус",
      "description": "Обучайтесь фокусам и трюкам с профессиональными видеокурсами.",
      "url": "https://xn----7sb1acdcpkxafxk9g.xn--p1ai/catalog"
    }
  });

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState<ListVideosSort>("newest");
  const [page, setPage] = useState(1);

  const { data: categories } = useListCategories();
  const categoryList = Array.isArray(categories) ? categories : [];
  
  const { data: videosData, isLoading, error } = useListVideos({
    search: debouncedSearch || undefined,
    categoryId,
    sort,
    page,
    limit: 12
  });
  const rawVideoList = Array.isArray(videosData?.videos) ? videosData.videos : [];
  const videoList: any[] = rawVideoList;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/10 text-amber-500 font-bold text-xs uppercase tracking-widest w-fit border border-amber-400/20">
          <Sparkles className="h-3.5 w-3.5" /> Обучение
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">Каталог курсов</h1>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-10 items-start md:items-center justify-between bg-card p-5 rounded-3xl border shadow-md">
        
        <div className="relative w-full md:w-96 flex-shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск по курсам..." 
            className="pl-10 h-11 bg-background border-border shadow-sm rounded-xl"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Categories Tab (Desktop) */}
          <div className="hidden lg:block">
            <Tabs defaultValue="all" value={categoryId ? String(categoryId) : "all"} onValueChange={(v) => { setCategoryId(v === "all" ? undefined : Number(v)); setPage(1); }}>
              <TabsList className="bg-muted/50 p-1 border shadow-sm rounded-xl">
                <TabsTrigger value="all" className="rounded-lg font-semibold text-xs px-4">Все</TabsTrigger>
                {categoryList.map(cat => (
                  <TabsTrigger key={cat.id} value={String(cat.id)} className="rounded-lg font-semibold text-xs px-4">{cat.name}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Categories Select (Mobile) */}
          <div className="lg:hidden w-full sm:w-auto">
            <Select value={categoryId ? String(categoryId) : "all"} onValueChange={(v) => { setCategoryId(v === "all" ? undefined : Number(v)); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background h-11 rounded-xl">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categoryList.map(cat => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={sort} onValueChange={(v: ListVideosSort) => { setSort(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background h-11 rounded-xl">
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
      ) : videoList.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-3xl border border-dashed shadow-sm">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-500 mb-4 border border-amber-400/20">
            <Filter className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Курсы не найдены</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Попробуйте изменить параметры поиска или сбросить фильтры</p>
          <Button variant="outline" className="rounded-full px-6" onClick={() => { setSearch(""); setCategoryId(undefined); }}>
            Сбросить фильтры
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7">
            {videoList.map((video, vIdx) => {
              const durationText = formatDuration(video.durationSeconds) || formatDuration(video.duration);
              return (
                <Link 
                  key={video.id} 
                  href={`/video/${video.id}`} 
                  data-sr-delay={String([0, 80, 160, 240][vIdx % 4])}
                  className="sr sr-fade-up group flex flex-col glass-card-hover rounded-3xl bg-card border shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300"
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-950">
                    <img 
                      src={video.thumbnailUrl || undefined} 
                      alt={video.title}
                      loading="lazy"
                      decoding="async"
                      className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-108"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300 flex items-center justify-center">
                      <div className="h-13 w-13 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-400/40 group-hover:scale-110 transition-transform duration-300">
                        <Play className="h-6 w-6 fill-current ml-0.5" />
                      </div>
                    </div>
                    {video.categoryName && (
                      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-amber-400 text-[11px] font-bold px-2.5 py-1 rounded-md border border-amber-400/30">
                        {video.categoryName}
                      </div>
                    )}
                    {durationText && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-semibold text-white/90 bg-slate-950/70 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                        <Clock className="h-3 w-3 text-amber-400" /> {durationText}
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="font-bold text-base line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200 mb-2">
                        {video.title}
                      </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                        <Star className="h-3.5 w-3.5 fill-current mr-1 text-amber-400" />
                        <span className="text-foreground">{video.averageRating ? Number(video.averageRating).toFixed(1) : "0.0"}</span>
                      </div>
                      <span>•</span>
                      <TrickDifficultyBadge difficulty={video.difficulty} size="xs" showScore={false} />
                    </div>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      {video.discountPrice ? (
                        <>
                          <span className="font-black text-lg text-primary">{video.discountPrice} ₽</span>
                          <span className="text-xs text-muted-foreground line-through">{video.price} ₽</span>
                        </>
                      ) : (
                        <span className="font-black text-lg text-primary">{video.price} ₽</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-amber-500 group-hover:underline">Подробнее &rarr;</span>
                  </div>
                </div>
              </Link>
            );
          })}
          </div>

          {/* Pagination */}
          {videosData && videosData.total > videosData.limit && (
            <div className="flex justify-center mt-12 gap-3 items-center">
              <Button 
                variant="outline" 
                className="rounded-full px-6"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Назад
              </Button>
              <div className="flex items-center px-4 font-bold text-sm text-muted-foreground">
                Страница {page} из {Math.ceil(videosData.total / videosData.limit)}
              </div>
              <Button 
                variant="outline" 
                className="rounded-full px-6"
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
