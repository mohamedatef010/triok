import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Camera,
  Sparkles,
  ArrowRight,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  PartyPopper,
  Flame,
  Award
} from 'lucide-react';

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

export function EventsGallerySection() {
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery<EventsGallerySectionData>({
    queryKey: ['site-settings', 'events_gallery_section'],
    queryFn: async () => {
      const res = await fetch('/api/site-settings/events_gallery_section');
      if (!res.ok) throw new Error('Failed to fetch events gallery');
      const json = await res.json();
      return json.value;
    },
    retry: false,
  });

  const hasData = !isLoading && !isError && data != null;
  const sectionData = data ?? {
    badgeText: 'Живые выступления и магия',
    heading: 'Фото с мероприятий и шоу',
    subheading: 'Корпоративы, свадьбы, закрытые VIP-вечеринки и праздники. Настоящие эмоции и восторг гостей!',
    ctaText: 'Заказать выступление на праздник',
    ctaLink: '/contacts',
    photos: [],
  };

  const photos: EventPhoto[] = sectionData.photos || [];

  // Extract unique tags for filter tabs
  const availableTags = Array.from(
    new Set(photos.map((p) => p.tag?.trim()).filter(Boolean) as string[])
  );

  const filteredPhotos =
    selectedTag === 'all'
      ? photos
      : photos.filter((p) => p.tag?.trim().toLowerCase() === selectedTag.toLowerCase());

  // Lightbox keyboard navigation
  const handlePrev = useCallback(() => {
    if (lightboxIndex === null || filteredPhotos.length === 0) return;
    setLightboxIndex((prev) => (prev === 0 ? filteredPhotos.length - 1 : (prev ?? 0) - 1));
  }, [lightboxIndex, filteredPhotos.length]);

  const handleNext = useCallback(() => {
    if (lightboxIndex === null || filteredPhotos.length === 0) return;
    setLightboxIndex((prev) => (prev === filteredPhotos.length - 1 ? 0 : (prev ?? 0) + 1));
  }, [lightboxIndex, filteredPhotos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handlePrev, handleNext]);

  // If no photos exist yet, we still render a tasteful marketing placeholder
  return (
    <section
      id="events-gallery"
      className="py-24 bg-[#faf9f6] dark:bg-[#09080e] text-slate-900 dark:text-white relative overflow-hidden border-t border-amber-200/40 dark:border-amber-500/10 transition-colors duration-500"
    >
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-amber-300/30 dark:bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-indigo-300/25 dark:bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container px-4 mx-auto relative z-10">
        {/* Section Header */}
        <div className="sr sr-fade-up text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-xs uppercase tracking-widest mb-4 border border-amber-200 dark:border-amber-500/20 shadow-sm">
            <Camera className="h-4 w-4 text-amber-500" />
            {sectionData.badgeText || 'Живые выступления и магия'}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            {sectionData.heading || 'Фото с мероприятий и шоу'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
            {sectionData.subheading ||
              'Корпоративы, свадьбы, закрытые VIP-вечеринки и праздники. Настоящие эмоции и восторг гостей!'}
          </p>

          {/* Filter Tabs */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold tracking-wide transition-all ${
                  selectedTag === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-105'
                    : 'bg-white dark:bg-[#14121a] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
                }`}
              >
                Все фото ({photos.length})
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold tracking-wide transition-all ${
                    selectedTag.toLowerCase() === tag.toLowerCase()
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-105'
                      : 'bg-white dark:bg-[#14121a] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="aspect-[4/3] rounded-3xl bg-slate-200 dark:bg-slate-800/60 animate-pulse border border-slate-200/60 dark:border-amber-500/10"
              />
            ))}
          </div>
        )}

        {/* Photos Grid */}
        {!isLoading && filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo, idx) => (
              <div
                key={photo.id || idx}
                onClick={() => setLightboxIndex(idx)}
                data-sr-delay={String([0, 100, 200, 100, 200, 300][idx % 6])}
                className="sr sr-fade-up group relative rounded-3xl overflow-hidden bg-white dark:bg-[#14121c] border border-slate-200/90 dark:border-amber-500/15 shadow-md hover:shadow-2xl hover:shadow-amber-900/15 hover:-translate-y-2 transition-all duration-400 cursor-pointer"
              >
                {/* Photo Image with WebP format */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                  {/* Tag badge (top-left) */}
                  {photo.tag && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-400/40 text-amber-400 text-xs font-black tracking-wider uppercase shadow-lg">
                        <Sparkles className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {photo.tag}
                      </span>
                    </div>
                  )}

                  {/* Zoom indicator icon (top-right) */}
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                    <div className="h-9 w-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Card Content Overlay (bottom) */}
                  <div className="absolute bottom-0 inset-x-0 p-5 z-10 text-white space-y-1.5">
                    <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-300/90">
                      {photo.eventDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-amber-400" />
                          {photo.eventDate}
                        </span>
                      )}
                      {photo.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-amber-400" />
                          {photo.location}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors duration-300 line-clamp-1">
                      {photo.title}
                    </h3>

                    {photo.description && (
                      <p className="text-xs text-slate-300/80 line-clamp-2 leading-relaxed">
                        {photo.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#121018]/50 max-w-2xl mx-auto">
              <Camera className="h-12 w-12 mx-auto mb-4 text-amber-500/40" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Галерея ярких событий
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Здесь скоро появятся свежие фотографии и кадры с корпоративных шоу, свадебных программ и праздников.
              </p>
            </div>
          )
        )}
      </div>

      {/* Fullscreen Interactive Lightbox Modal */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-300 select-none"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-5 right-5 z-20 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition backdrop-blur-md"
            aria-label="Закрыть"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation Buttons */}
          {filteredPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-4 z-20 h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition backdrop-blur-md"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 z-20 h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition backdrop-blur-md"
                aria-label="Следующее фото"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}

          {/* Lightbox Main Box */}
          <div
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col rounded-3xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image View Area */}
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] max-h-[68vh] overflow-hidden">
              <img
                src={filteredPhotos[lightboxIndex].imageUrl}
                alt={filteredPhotos[lightboxIndex].title}
                className="max-w-full max-h-[68vh] w-auto h-auto object-contain"
              />
            </div>

            {/* Photo Metadata Footer */}
            <div className="p-6 bg-slate-900 border-t border-white/10 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  {filteredPhotos[lightboxIndex].tag && (
                    <span className="px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold">
                      {filteredPhotos[lightboxIndex].tag}
                    </span>
                  )}
                  {filteredPhotos[lightboxIndex].location && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-amber-400" />
                      {filteredPhotos[lightboxIndex].location}
                    </span>
                  )}
                  {filteredPhotos[lightboxIndex].eventDate && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-amber-400" />
                      {filteredPhotos[lightboxIndex].eventDate}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold">{filteredPhotos[lightboxIndex].title}</h3>

                {filteredPhotos[lightboxIndex].description && (
                  <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                    {filteredPhotos[lightboxIndex].description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-slate-400 px-3 py-1.5 rounded-lg bg-slate-800">
                  {lightboxIndex + 1} / {filteredPhotos.length}
                </span>
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
                  asChild
                >
                  <Link href="/contacts">Заказать шоу</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default EventsGallerySection;
