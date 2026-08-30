import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import {
  Menu, Search, Heart, ShoppingCart, User,
  Sun, Moon, LogOut, Settings, Sparkles, X, MoreHorizontal, Film,
} from "lucide-react";

import { SOCIAL_PLATFORMS, openSocialLink } from "@/components/ui/social-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { LogoWordmark } from "@/components/logo";
import { useQuery } from "@tanstack/react-query";
import { useListCategories } from "@workspace/api-client-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function useSiteContacts() {
  return useQuery({
    queryKey: ["site-settings", "author_section"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings/author_section");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      return json.value;
    },
    retry: false,
  });
}

function useRequisitesPhone() {
  return useQuery({
    queryKey: ["site-settings", "site_requisites"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings/site_requisites");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      return json?.value;
    },
    retry: false,
  });
}

interface VideoResult {
  id: number;
  title: string;
  thumbnailUrl: string;
  price: number;
}

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const cart = useCart();
  const favs = useFavorites();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: siteData, isLoading: siteLoading } = useSiteContacts();
  const { data: reqData, isLoading: reqLoading } = useRequisitesPhone();
  const { data: categoriesData } = useListCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  // Prefer phone from Реквизиты продавца (site_requisites), fallback to author_section, then 'Не указан'
  const rawPhone = (!reqLoading && reqData?.phone)
    ? reqData.phone
    : (!siteLoading && siteData?.phone) ? siteData.phone : null;
  const phone = rawPhone || "Не указан";
  const phoneHref = rawPhone ? `tel:${rawPhone.replace(/\s+/g, '')}` : undefined;

  const rawEmail = (!siteLoading && siteData?.email)
    ? siteData.email
    : (!siteLoading && siteData?.socialLinks?.mailru)
      ? siteData.socialLinks.mailru.replace('mailto:', '')
      : null;
  const email = rawEmail || "Не указан";
  const emailHref = rawEmail ? `mailto:${rawEmail}` : undefined;

  // Close side menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced live search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) { setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(API_BASE + `/api/videos?search=${encodeURIComponent(q)}&limit=6`);
        if (res.ok) {
          const json = await res.json();
          setSearchResults((json.videos ?? json).slice(0, 6));
        }
      } catch { }
      setSearchLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openSearch = () => {
    setSearchOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      return next;
    });
  };

  useEffect(() => {
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;

    const onScroll = () => {
      const currentScrollY = window.scrollY;

      setScrolled(currentScrollY > 8);

      if (currentScrollY <= 30) {
        // At the top of the page: always visible
        setVisible(true);
      } else {
        const diff = currentScrollY - lastScrollY;
        if (diff > 4) {
          // Scrolling DOWN: hide navbar smoothly
          setVisible(false);
        } else if (diff < -4) {
          // Scrolling UP: show navbar smoothly
          setVisible(true);
        }
      }

      lastScrollY = Math.max(0, currentScrollY);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* 72px Spacer so the fixed navbar doesn't overlap the top content on any screen */}
      <div className="h-[72px] w-full pointer-events-none" aria-hidden="true" />

      <header
        className={`
          fixed top-0 left-0 right-0 z-[1000] w-full border-b transition-transform duration-300 ease-in-out
          ${visible ? "translate-y-0" : "-translate-y-full"}
          ${scrolled
            ? "bg-background/85 shadow-lg shadow-black/5 backdrop-blur-xl border-border/80"
            : "bg-background/70 backdrop-blur-md border-border/40"
          }
        `}
      >
      <div className="container mx-auto flex h-[72px] items-center px-4 relative">

        {/* ── LEFT: Hamburger Menu ── */}
        <div className="flex-1 flex items-center justify-start">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost" size="icon"
                className="hover:bg-amber-400/10 hover:text-amber-500 transition-all duration-200"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] sm:w-[400px] bg-background/95 backdrop-blur-2xl overflow-y-auto z-[99999]">
              <SheetHeader>
                <SheetTitle className="text-left pt-2 font-black text-2xl">
                  Меню
                </SheetTitle>
              </SheetHeader>

              <div className="mt-8 flex flex-col gap-8 pb-10">
                {/* Тема оформления (Mobile friendly) */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/60 border border-border/60">
                  <div className="flex items-center gap-2.5">
                    {theme === "dark" ? (
                      <Moon className="h-5 w-5 text-amber-400" />
                    ) : (
                      <Sun className="h-5 w-5 text-amber-500" />
                    )}
                    <span className="text-sm font-bold">
                      {theme === "dark" ? "Тёмная тема" : "Светлая тема"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTheme}
                    className="rounded-xl text-xs font-bold border-border/80"
                  >
                    {theme === "dark" ? "Светлая" : "Тёмная"}
                  </Button>
                </div>

                {/* Верхнее меню */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1 border-b border-border/50 pb-2">Верхнее меню</h4>
                  <Link href="/catalog" onClick={() => setMenuOpen(false)} className="text-base font-bold hover:text-amber-500 transition-colors">Каталог</Link>

                  {/* Доступные разделы / категории видеокурсов */}
                  {categories.length > 0 && (
                    <div className="flex flex-col gap-1.5 pl-3 py-1 my-0.5 border-l-2 border-amber-400/40 dark:border-amber-500/30">
                      {categories.map((cat: any) => (
                        <Link
                          key={cat.id}
                          href={`/catalog?category=${cat.id}`}
                          onClick={() => setMenuOpen(false)}
                          className="text-sm font-semibold text-muted-foreground hover:text-amber-500 transition-colors flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-amber-400/10 group"
                        >
                          <span className="group-hover:translate-x-0.5 transition-transform">{cat.name}</span>
                          {typeof cat.videoCount === "number" && cat.videoCount > 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground group-hover:bg-amber-500/20 group-hover:text-amber-500 transition-colors">
                              {cat.videoCount}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex flex-col gap-3 pl-4 border-l-2 border-border/40">
                    <span className="text-sm font-semibold text-muted-foreground">Личные данные</span>
                    <Link href="/profile" onClick={() => setMenuOpen(false)} className="text-base font-bold hover:text-amber-500 transition-colors">Личный кабинет</Link>
                    <Link href="/cart" onClick={() => setMenuOpen(false)} className="text-base font-bold hover:text-amber-500 transition-colors">Корзина</Link>
                    <Link href="/compare" onClick={() => setMenuOpen(false)} className="text-base font-bold hover:text-amber-500 transition-colors">Сравнение</Link>
                  </div>
                </div>

                {/* Помощь и информация */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1 border-b border-border/50 pb-2">Помощь и информация</h4>
                  <Link href="/contacts" onClick={() => setMenuOpen(false)} className="text-base font-bold hover:text-amber-500 transition-colors">Контакты</Link>
                  <Link href="/delivery" onClick={() => setMenuOpen(false)} className="text-base font-bold hover:text-amber-500 transition-colors">Получение цифрового товара</Link>
                  <Link href="/help" onClick={() => setMenuOpen(false)} className="text-base font-bold hover:text-amber-500 transition-colors">Возврат и помощь</Link>
                  <Link href="/terms" onClick={() => setMenuOpen(false)} className="text-base font-bold hover:text-amber-500 transition-colors">Публичная оферта</Link>
                  <Link href="/requisites" onClick={() => setMenuOpen(false)} className="text-base font-bold hover:text-amber-500 transition-colors">Реквизиты</Link>
                </div>

                {/* Контакты */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1 border-b border-border/50 pb-2">Контакты</h4>
                  {phoneHref ? (
                    <a href={phoneHref} onClick={() => setMenuOpen(false)} className="text-lg font-black text-foreground hover:text-amber-500 transition-colors">{phone}</a>
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">{phone}</span>
                  )}
                  {emailHref ? (
                    <a href={emailHref} onClick={() => setMenuOpen(false)} className="text-base font-bold text-muted-foreground hover:text-amber-500 transition-colors">{email}</a>
                  ) : (
                    <span className="text-base font-medium text-muted-foreground/80">{email}</span>
                  )}

                  {!siteLoading && siteData?.socialLinks && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {SOCIAL_PLATFORMS.map(({ key, label, Icon, color, bg, border, hoverBg, hoverBorder }) => {
                        const url = (siteData.socialLinks as Record<string, string>)[key];
                        if (!url) return null;
                        return (
                          <button key={key} type="button" aria-label={label} title={label}
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); openSocialLink(url, key); }}
                            className={`h-9 w-9 rounded-xl ${bg} border ${border} flex items-center justify-center ${hoverBg} ${hoverBorder} transition-colors`}>
                            <Icon className={`h-4 w-4 ${color}`} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* ── CENTER: Logo ── */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
          <Link href="/">
            <LogoWordmark className="cursor-pointer" />
          </Link>
        </div>

        {/* ── RIGHT: Action Icons ── */}
        <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2.5">

          {/* Search — always visible */}
          <div ref={searchRef} className="flex relative items-center">
            <Button
              variant="ghost" size="icon"
              className="nav-icon-btn rounded-full"
              title="Поиск"
              onClick={openSearch}
            >
              <Search className="h-[19px] w-[19px]" />
            </Button>

            {/* Expandable search overlay */}
            {searchOpen && (
              <div className="fixed inset-x-3 top-[76px] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 w-auto sm:w-[380px] max-w-[calc(100vw-1.5rem)] sm:max-w-none rounded-2xl bg-background/98 dark:bg-slate-950/98 border border-border/80 shadow-2xl shadow-black/30 backdrop-blur-2xl overflow-hidden z-[99999] animate-in fade-in-0 zoom-in-95 duration-150">
                {/* Input row */}
                <div className="flex items-center gap-2 px-3.5 sm:px-4 py-3 border-b border-border/50 bg-muted/20">
                  <Search className="h-4 w-4 text-amber-500 shrink-0" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Найти курс или видео..."
                    className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
                    onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                  />
                  {searchQuery ? (
                    <button onClick={() => setSearchQuery("")} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="Очистить">
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <button onClick={() => setSearchOpen(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors sm:hidden" title="Закрыть">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Results */}
                <div className="max-h-[min(380px,58vh)] sm:max-h-[340px] overflow-y-auto">
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                      <div className="h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mr-2" />
                      Поиск...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-1.5">
                      {searchResults.map((video) => (
                        <Link
                          key={video.id}
                          href={`/video/${video.id}`}
                          onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                        >
                          <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors cursor-pointer group">
                            <div className="h-10 w-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                              {video.thumbnailUrl
                                ? <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><Film className="h-4 w-4 text-slate-400" /></div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">{video.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{video.price > 0 ? `${video.price} ₽` : "Бесплатно"}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : searchQuery.trim().length > 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      Ничего не найдено по запросу «{searchQuery}»
                    </div>
                  ) : (
                    <div className="py-6 text-center text-muted-foreground/60 text-sm">
                      Введите название курса или видео
                    </div>
                  )}
                </div>

                {/* Footer: go to catalog */}
                {searchQuery.trim().length > 0 && (
                  <Link
                    href={`/catalog?search=${encodeURIComponent(searchQuery.trim())}`}
                    onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  >
                    <div className="border-t border-border/50 px-4 py-3 text-sm text-amber-600 dark:text-amber-400 font-bold flex items-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors cursor-pointer">
                      <Search className="h-3.5 w-3.5" /> Показать все результаты в каталоге
                    </div>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ── Desktop-only icons (hidden on mobile) ── */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2.5">
            {/* Theme toggle */}
            <Button
              variant="ghost" size="icon"
              className="nav-icon-btn rounded-full"
              onClick={toggleTheme}
              title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            >
              {theme === "dark"
                ? <Sun className="h-[19px] w-[19px] text-amber-400 transition-transform duration-300 hover:rotate-45" />
                : <Moon className="h-[19px] w-[19px] text-slate-700 transition-transform duration-300 hover:-rotate-12" />
              }
            </Button>

            {/* Favorites */}
            <Link href="/favorites">
              <Button variant="ghost" size="icon" className="nav-icon-btn rounded-full relative" title="Избранное">
                <Heart className="h-[19px] w-[19px]" />
                {favs.count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-[19px] w-[19px] items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-md animate-in zoom-in-50 duration-200">
                    {favs.count}
                  </span>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="nav-icon-btn rounded-full relative" title="Корзина">
                <ShoppingCart className="h-[19px] w-[19px]" />
                {cart.count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-[19px] w-[19px] items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground shadow-md animate-in zoom-in-50 duration-200">
                    {cart.count}
                  </span>
                )}
              </Button>
            </Link>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="nav-icon-btn rounded-full" title="Аккаунт">
                  {isAuthenticated
                    ? (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-xs font-black shadow-md">
                        {user?.name?.charAt(0) ?? "U"}
                      </div>
                    )
                    : <User className="h-[19px] w-[19px]" />
                  }
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-2xl shadow-xl border-border bg-popover/95 backdrop-blur-xl p-1.5 z-[99999]">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl mb-1">
                      <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-black">
                        {user?.name?.charAt(0) ?? "U"}
                      </div>
                      <div className="flex flex-col leading-none">
                        {user?.name && <p className="text-sm font-bold">{user.name}</p>}
                        {user?.email && <p className="text-xs text-muted-foreground truncate max-w-[140px] mt-0.5">{user.email}</p>}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="w-full flex items-center cursor-pointer rounded-lg font-semibold">
                        <Settings className="mr-2.5 h-4 w-4" /> Личный кабинет
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer font-semibold rounded-lg"
                      onSelect={() => logout()}
                    >
                      <LogOut className="mr-2.5 h-4 w-4" /> Выйти
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/login" className="w-full cursor-pointer font-bold rounded-lg py-2.5">Войти</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/register" className="w-full cursor-pointer font-semibold rounded-lg py-2.5">Регистрация</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── Mobile-only: More button (⋯) with Radix DropdownMenu (Portaled, z-[99999]) ── */}
          <div className="flex sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost" size="icon"
                  className="nav-icon-btn rounded-full relative"
                  title="Ещё"
                >
                  <MoreHorizontal className="h-[19px] w-[19px]" />
                  {cart.count > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-background shadow-sm animate-in zoom-in-50 duration-200" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-2xl shadow-2xl border-border bg-popover/98 backdrop-blur-2xl p-2 z-[99999]">
                {/* Theme toggle */}
                <DropdownMenuItem
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer font-semibold text-sm focus:bg-accent focus:text-accent-foreground"
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleTheme();
                  }}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4 text-slate-700" />
                  )}
                  <span>{theme === "dark" ? "Светлая тема" : "Тёмная тема"}</span>
                </DropdownMenuItem>

                {/* Favorites */}
                <DropdownMenuItem asChild>
                  <Link href="/favorites" className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer font-semibold text-sm w-full">
                    <div className="relative">
                      <Heart className="h-4 w-4" />
                      {favs.count > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                          {favs.count}
                        </span>
                      )}
                    </div>
                    <span>Избранное</span>
                    {favs.count > 0 && <span className="ml-auto text-xs text-muted-foreground">{favs.count}</span>}
                  </Link>
                </DropdownMenuItem>

                {/* Cart */}
                <DropdownMenuItem asChild>
                  <Link href="/cart" className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer font-semibold text-sm w-full">
                    <div className="relative">
                      <ShoppingCart className="h-4 w-4" />
                      {cart.count > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground">
                          {cart.count}
                        </span>
                      )}
                    </div>
                    <span>Корзина</span>
                    {cart.count > 0 && <span className="ml-auto text-xs text-muted-foreground">{cart.count}</span>}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                {/* User */}
                {isAuthenticated ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer font-semibold text-sm w-full">
                        <Settings className="h-4 w-4" />
                        <span>Личный кабинет</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer font-semibold text-sm text-destructive focus:text-destructive focus:bg-destructive/10"
                      onSelect={() => logout()}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Выйти</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/login" className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer font-bold text-sm w-full">
                        <User className="h-4 w-4" />
                        <span>Войти</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/register" className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer font-semibold text-sm w-full">
                        <Sparkles className="h-4 w-4" />
                        <span>Регистрация</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </div>
      </div>
    </header>
    </>
  );
}

