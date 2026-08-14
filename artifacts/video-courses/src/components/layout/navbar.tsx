import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import {
  Menu, Search, Heart, ShoppingCart, User,
  Sun, Moon, LogOut, Settings, Clapperboard, Sparkles, X, Film, MoreHorizontal,
  Send, MessageCircle, Instagram, Mail
} from "lucide-react";
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

interface VideoResult {
  id: number;
  title: string;
  thumbnailUrl: string;
  price: number;
}

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const cart = useCart();
  const favs = useFavorites();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: siteData, isLoading: siteLoading } = useSiteContacts();
  const phone = (!siteLoading && siteData?.phone) ? siteData.phone : "+7 978 717-66-74";
  const phoneHref = (!siteLoading && siteData?.phone)
    ? `tel:${siteData.phone.replace(/\s+/g, '')}`
    : "tel:+79787176674";
  const email = (!siteLoading && siteData?.email)
    ? siteData.email
    : (!siteLoading && siteData?.socialLinks?.mailru)
      ? siteData.socialLinks.mailru.replace('mailto:', '')
      : "magik.777@mail.ru";
  const emailHref = (!siteLoading && siteData?.email)
    ? `mailto:${siteData.email}`
    : (!siteLoading && siteData?.socialLinks?.mailru)
      ? siteData.socialLinks.mailru
      : "mailto:magik.777@mail.ru";

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
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
      } catch {}
      setSearchLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 8);
      if (currentScrollY > lastScrollY && currentScrollY > 90) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`
        sticky top-0 z-50 w-full border-b transition-transform duration-300 ease-in-out
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
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost" size="icon"
                className="hover:bg-amber-400/10 hover:text-amber-500 transition-all duration-200"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] sm:w-[400px] bg-background/95 backdrop-blur-2xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-left pt-2 font-black text-2xl">
                  Меню
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-8 flex flex-col gap-8 pb-10">
                {/* Верхнее меню */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1 border-b border-border/50 pb-2">Верхнее меню</h4>
                  <Link href="/catalog" className="text-base font-bold hover:text-amber-500 transition-colors">Каталог</Link>
                  <Link href="/#about" className="text-base font-bold hover:text-amber-500 transition-colors">Обо мне</Link>
                  <Link href="/#events-gallery" className="text-base font-bold hover:text-amber-500 transition-colors">Мероприятия</Link>
                  
                  <div className="mt-2 flex flex-col gap-3 pl-4 border-l-2 border-border/40">
                    <span className="text-sm font-semibold text-muted-foreground">Личные данные</span>
                    <Link href="/profile" className="text-base font-bold hover:text-amber-500 transition-colors">Личный кабинет</Link>
                    <Link href="/cart" className="text-base font-bold hover:text-amber-500 transition-colors">Корзина</Link>
                    <Link href="/compare" className="text-base font-bold hover:text-amber-500 transition-colors">Сравнение</Link>
                  </div>
                </div>

                {/* Помощь и информация */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1 border-b border-border/50 pb-2">Помощь и информация</h4>
                  <Link href="/contacts" className="text-base font-bold hover:text-amber-500 transition-colors">Контакты</Link>
                  <Link href="/help" className="text-base font-bold hover:text-amber-500 transition-colors">Как проходит обучение</Link>
                  <Link href="/help" className="text-base font-bold hover:text-amber-500 transition-colors">Возврат и оплата</Link>
                  <Link href="/terms" className="text-base font-bold hover:text-amber-500 transition-colors">Пользовательское соглашение</Link>
                  <Link href="/requisites" className="text-base font-bold hover:text-amber-500 transition-colors">Реквизиты</Link>
                </div>

                 {/* Контакты */}
                 <div className="flex flex-col gap-3">
                   <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1 border-b border-border/50 pb-2">Контакты</h4>
                   <a href={phoneHref} className="text-lg font-black text-foreground hover:text-amber-500 transition-colors">{phone}</a>
                   <a href={emailHref} className="text-base font-bold text-muted-foreground hover:text-amber-500 transition-colors">{email}</a>

                   {!siteLoading && siteData?.socialLinks && (
                     <div className="flex flex-wrap gap-2 pt-2">
                       {siteData.socialLinks.telegram && (
                         <a href={siteData.socialLinks.telegram} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center hover:bg-sky-500/20 hover:border-sky-500/40 transition-colors">
                           <Send className="h-4 w-4 text-sky-400" />
                         </a>
                       )}
                       {siteData.socialLinks.whatsapp && (
                         <a href={siteData.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                           <MessageCircle className="h-4 w-4 text-emerald-400" />
                         </a>
                       )}
                       {siteData.socialLinks.instagram && (
                         <a href={siteData.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center hover:bg-pink-500/20 hover:border-pink-500/40 transition-colors">
                           <Instagram className="h-4 w-4 text-pink-400" />
                         </a>
                       )}
                       {siteData.socialLinks.vk && (
                         <a href={siteData.socialLinks.vk} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/40 transition-colors">
                           <Film className="h-4 w-4 text-blue-400" />
                         </a>
                       )}
                       {siteData.socialLinks.mailru && (
                         <a href={siteData.socialLinks.mailru} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center hover:bg-orange-500/20 hover:border-orange-500/40 transition-colors">
                           <Mail className="h-4 w-4 text-orange-400" />
                         </a>
                       )}
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
              <div className="absolute right-0 top-full mt-3 w-[min(380px,calc(100vw-2rem))] rounded-2xl bg-background/98 dark:bg-slate-950/98 border border-border/60 shadow-2xl shadow-black/20 backdrop-blur-xl overflow-hidden z-[100]">
                {/* Input row */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Найти курс или видео..."
                    className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
                    onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Results */}
                <div className="max-h-[340px] overflow-y-auto">
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
                ? <Sun  className="h-[19px] w-[19px] text-amber-400 transition-transform duration-300 hover:rotate-45" />
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
              <DropdownMenuContent align="end" className="w-60 rounded-2xl shadow-xl border-border bg-popover/95 backdrop-blur-xl p-1.5">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl mb-1">
                      <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-black">
                        {user?.name?.charAt(0) ?? "U"}
                      </div>
                      <div className="flex flex-col leading-none">
                        {user?.name  && <p className="text-sm font-bold">{user.name}</p>}
                        {user?.email && <p className="text-xs text-muted-foreground truncate max-w-[140px] mt-0.5">{user.email}</p>}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="w-full flex items-center cursor-pointer rounded-lg font-semibold">
                        <Settings className="mr-2.5 h-4 w-4" /> Личный кабинет
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admm/dashboard" className="w-full flex items-center cursor-pointer text-amber-500 font-bold rounded-lg">
                          <Clapperboard className="mr-2.5 h-4 w-4" /> Админ-панель
                        </Link>
                      </DropdownMenuItem>
                    )}
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admm" className="w-full text-muted-foreground cursor-pointer text-xs rounded-lg py-2">Вход для администратора</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── Mobile-only: More button (⋯) ── */}
          <div ref={mobileMenuRef} className="relative flex sm:hidden">
            <Button
              variant="ghost" size="icon"
              className="nav-icon-btn rounded-full"
              title="Ещё"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <MoreHorizontal className="h-[19px] w-[19px]" />
            </Button>

            {mobileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 rounded-2xl bg-background/98 dark:bg-slate-950/98 border border-border/60 shadow-2xl shadow-black/20 backdrop-blur-xl z-[100] p-2 flex flex-col gap-1 min-w-[180px]">
                {/* Theme toggle */}
                <button
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-sm font-semibold w-full text-left"
                  onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                >
                  {theme === "dark"
                    ? <Sun className="h-4 w-4 text-amber-400" />
                    : <Moon className="h-4 w-4 text-slate-700" />
                  }
                  {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
                </button>

                {/* Favorites */}
                <Link href="/favorites" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-sm font-semibold">
                    <div className="relative">
                      <Heart className="h-4 w-4" />
                      {favs.count > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                          {favs.count}
                        </span>
                      )}
                    </div>
                    Избранное
                    {favs.count > 0 && <span className="ml-auto text-xs text-muted-foreground">{favs.count}</span>}
                  </div>
                </Link>

                {/* Cart */}
                <Link href="/cart" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-sm font-semibold">
                    <div className="relative">
                      <ShoppingCart className="h-4 w-4" />
                      {cart.count > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground">
                          {cart.count}
                        </span>
                      )}
                    </div>
                    Корзина
                    {cart.count > 0 && <span className="ml-auto text-xs text-muted-foreground">{cart.count}</span>}
                  </div>
                </Link>

                <div className="my-1 border-t border-border/40" />

                {/* User */}
                {isAuthenticated ? (
                  <>
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-sm font-semibold">
                        <Settings className="h-4 w-4" /> Личный кабинет
                      </div>
                    </Link>
                    {isAdmin && (
                      <Link href="/admm/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors text-sm font-bold text-amber-500">
                          <Clapperboard className="h-4 w-4" /> Админ-панель
                        </div>
                      </Link>
                    )}
                    <button
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm font-semibold text-destructive w-full text-left"
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                    >
                      <LogOut className="h-4 w-4" /> Выйти
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-sm font-bold">
                        <User className="h-4 w-4" /> Войти
                      </div>
                    </Link>
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-sm font-semibold">
                        <Sparkles className="h-4 w-4" /> Регистрация
                      </div>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

