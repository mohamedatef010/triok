import { Link } from "wouter";
import { useGetFeaturedVideos } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Star, ChevronRight } from "lucide-react";
import heroBanner from "@assets/hero-banner.jpg";
import authorAvatar from "@assets/author-avatar.jpg";
import { VideoGridSkeleton, ErrorState } from "@/components/ui/states";
import { Card, CardContent } from "@/components/ui/card";

export function HomePage() {
  const { data: featuredVideos, isLoading, error } = useGetFeaturedVideos();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBanner} 
            alt="Video Editing Workspace" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/70 dark:bg-slate-950/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="container relative z-10 px-4 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight max-w-4xl mx-auto drop-shadow-sm">
            Освойте искусство <span className="text-accent">видеомонтажа</span> на профессиональном уровне
          </h1>
          <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl mx-auto font-medium">
            Практические уроки, реальные проекты и техники кинематографичного монтажа. 
            От основ до цветокоррекции и саунд-дизайна.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full" asChild>
              <Link href="/catalog">Смотреть курсы</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-md" asChild>
              <Link href="/#about">Первый монтаж бесплатно</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Videos */}
      <section className="py-24 bg-background">
        <div className="container px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Популярные курсы</h2>
              <p className="text-muted-foreground">Лучшие материалы для старта и прокачки навыков</p>
            </div>
            <Button variant="ghost" className="hidden sm:flex group" asChild>
              <Link href="/catalog">
                Все курсы <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <VideoGridSkeleton />
          ) : error ? (
            <ErrorState error={error} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredVideos?.slice(0, 8).map((video) => (
                <Link key={video.id} href={`/video/${video.id}`} className="group flex flex-col gap-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                    <img 
                      src={video.thumbnailUrl || undefined} 
                      alt={video.title}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                        <Play className="h-5 w-5 fill-current" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current mr-1" />
                        <span className="font-medium">{video.averageRating.toFixed(1)}</span>
                      </div>
                      <span>•</span>
                      <span>{video.reviewCount} отзывов</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {video.discountPrice ? (
                        <>
                          <span className="font-bold text-lg">{video.discountPrice} ₽</span>
                          <span className="text-sm text-muted-foreground line-through">{video.price} ₽</span>
                        </>
                      ) : (
                        <span className="font-bold text-lg">{video.price} ₽</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          <div className="mt-8 flex justify-center sm:hidden">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/catalog">Смотреть все курсы</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Author Section */}
      <section id="about" className="py-24 bg-slate-50 dark:bg-slate-900 border-y">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            <div className="w-full md:w-1/2 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary to-accent rounded-3xl blur-2xl opacity-20 dark:opacity-30"></div>
                <img 
                  src={authorAvatar} 
                  alt="Автор курсов" 
                  className="relative z-10 w-full max-w-md aspect-[4/5] object-cover rounded-3xl shadow-2xl"
                />
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm">
                Опыт более 10 лет
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Привет, я занимаюсь видеомонтажом профессионально
              </h2>
              <blockquote className="text-xl text-muted-foreground italic border-l-4 border-accent pl-6 py-2">
                "Всем доброго времени суток, занимаюсь видеомонтажом около 10 лет. 
                Готов смонтировать пробный ролик с ваших исходников до 5 мин. бесплатно) 
                Это не моя постоянная деятельность, а как творческое увлечение. 
                Жду ваших предложений"
              </blockquote>
              <div className="pt-4 flex items-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/contacts">Связаться со мной</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-background">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Отзывы учеников</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Узнайте, что говорят те, кто уже прошел обучение и начал создавать свои собственные проекты
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Александр В.", rating: 5, text: "Отличная подача материала. Без воды, всё по делу. Особенно понравился блок про цветокоррекцию — наконец-то понял, как работают кривые." },
              { name: "Елена С.", rating: 5, text: "Никогда не думала, что смогу сама монтировать такие крутые ролики. Автор объясняет сложные вещи очень простым языком." },
              { name: "Михаил Д.", rating: 5, text: "Воспользовался бесплатным пробным монтажом, результат превзошел ожидания! После этого сразу купил полный курс. Рекомендую!" }
            ].map((review, i) => (
              <Card key={i} className="bg-muted/50 border-none">
                <CardContent className="p-8">
                  <div className="flex items-center text-amber-500 mb-4">
                    {Array.from({length: 5}).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 line-clamp-4 leading-relaxed">
                    "{review.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                      {review.name.charAt(0)}
                    </div>
                    <div className="font-medium">{review.name}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
