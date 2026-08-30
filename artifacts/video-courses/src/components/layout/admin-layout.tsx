import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LayoutDashboard,
  Film,
  ShoppingCart,
  Users,
  ArrowLeft,
  Star,
  Menu,
  X,
  Camera,
  Tag,
  ShieldCheck,
  LayoutTemplate,
  Sun,
  Moon,
  ExternalLink,
  ChevronRight,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  Layers,
} from "lucide-react";

/** Maximum idle/inactivity time before automatic logout (30 minutes) */
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

/** Validates whether an admin JWT token exists, has admin role, and is not expired */
function checkAdminTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.role && payload.role !== "admin") return false;
    if (!payload.exp) return true;
    // Check if token has expired (with 10s buffer)
    return payload.exp * 1000 > Date.now() + 10000;
  } catch {
    return false;
  }
}

interface NavItem {
  href: string;
  icon: any;
  label: string;
  badge?: string;
  category?: string;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Главное управление",
    items: [
      { href: "/admm/dashboard", icon: LayoutDashboard, label: "Дашборд & Аналитика" },
      { href: "/admm/videos", icon: Film, label: "Видео и курсы" },
      { href: "/admm/orders", icon: ShoppingCart, label: "Заказы клиентов" },
      { href: "/admm/users", icon: Users, label: "Пользователи" },
    ],
  },
  {
    title: "Контент и оформление",
    items: [
      { href: "/admm/hero-section", icon: LayoutTemplate, label: "Главный экран (Hero)" },
      { href: "/admm/author-section", icon: Layers, label: "Секция автора & блоки" },
      { href: "/admm/events-gallery", icon: Camera, label: "Фото с мероприятий" },
      { href: "/admm/reviews-section", icon: Star, label: "Отзывы клиентов" },
    ],
  },
  {
    title: "Маркетинг & Реквизиты",
    items: [
      { href: "/admm/promocodes", icon: Tag, label: "Промокоды & Игра" },
      { href: "/admm/requisites", icon: ShieldCheck, label: "Реквизиты продавца" },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [location, setLocation] = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("admin_token");
      return checkAdminTokenValid(token);
    }
    return null;
  });

  const forceLogout = useCallback((reason?: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_last_activity");
      setIsAuthenticated(false);
      window.location.href = "/admm";
    }
  }, []);

  // 1. Activity tracking (resets inactivity timer on any user interaction)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const recordActivity = () => {
      localStorage.setItem("admin_last_activity", String(Date.now()));
    };

    // Record initial activity
    if (!localStorage.getItem("admin_last_activity")) {
      recordActivity();
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    let lastLogged = Date.now();
    const handleEvent = () => {
      const now = Date.now();
      if (now - lastLogged > 5000) {
        lastLogged = now;
        recordActivity();
      }
    };

    events.forEach((evt) => window.addEventListener(evt, handleEvent, { passive: true }));
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleEvent));
    };
  }, []);

  // 2. Continuous session & inactivity verification loop (checks every 4 seconds)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const verifySession = () => {
      const token = localStorage.getItem("admin_token");
      if (!token || !checkAdminTokenValid(token)) {
        forceLogout("expired_or_missing");
        return false;
      }

      const lastActivity = Number(localStorage.getItem("admin_last_activity") || 0);
      if (lastActivity && Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
        forceLogout("inactive");
        return false;
      }

      setIsAuthenticated(true);
      return true;
    };

    verifySession();

    const interval = setInterval(verifySession, 4000);
    return () => clearInterval(interval);
  }, [location, forceLogout]);

  // 3. Verify user role from /api/auth/me if returned
  useEffect(() => {
    if (user && user.role !== "admin") {
      forceLogout("forbidden_role");
    }
  }, [user, forceLogout]);

  // Find current active item title
  const allItems = navSections.flatMap((s) => s.items);
  const currentItem = allItems.find((i) => location === i.href) || {
    label: "Панель управления",
    icon: LayoutDashboard,
  };
  const CurrentIcon = currentItem.icon;

  if (isAuthenticated === false || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-4 select-none">
        <div className="flex flex-col items-center gap-4 bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl max-w-sm w-full text-center">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-slate-200">Проверка доступа</span>
            <p className="text-xs text-slate-500">Перенаправление на страницу входа...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    forceLogout("user_logout");
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0 bg-slate-950/60 backdrop-blur-md">
        <Link href="/admm/dashboard" className="flex items-center gap-3 group">
          <img
            src="/n13.webp"
            alt="CMS Logo"
            className="h-9 w-auto max-w-[80px] object-contain filter drop-shadow group-hover:scale-105 transition-transform shrink-0"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent font-black text-sm tracking-wider">
                  CMS АДМИН
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PRO
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium truncate max-w-[130px]">
                Панель управления
              </span>
            </div>
          )}
        </Link>

        {/* Mobile Close Button */}
        <button
          className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          onClick={() => setSidebarOpen(false)}
          aria-label="Закрыть меню"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map(({ href, icon: Icon, label }) => {
                const isActive = location === href;
                return (
                  <Link key={href} href={href}>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      title={collapsed ? label : undefined}
                      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/5 font-bold"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent"
                      } ${collapsed ? "justify-center px-2" : "justify-start"}`}
                    >
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? "bg-amber-500/20 text-amber-300"
                            : "text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-800"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                      </div>
                      {!collapsed && (
                        <span className="truncate flex-1 text-left">{label}</span>
                      )}
                      {!collapsed && isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400" />
                      )}
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Profile & Actions */}
      <div className="p-3 border-t border-slate-800/80 shrink-0 bg-slate-950/80 space-y-2">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className={`w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800/80 text-xs rounded-xl ${
              collapsed ? "justify-center px-0" : "px-3"
            }`}
            onClick={() => setSidebarOpen(false)}
            title="Перейти на сайт"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2 font-medium">Вернуться на сайт</span>}
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          className={`w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs rounded-xl ${
            collapsed ? "justify-center px-0" : "px-3"
          }`}
          onClick={handleLogout}
          title="Выйти из системы"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2 font-medium">Выйти из системы</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-100/90 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-in-out border-r border-slate-800/80 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity duration-300 animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] z-50 lg:hidden flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent collapsed={false} />
      </aside>

      {/* Main Content Wrap */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-colors">
          {/* Left: Mobile menu toggle + Desktop collapse toggle + Page Title */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              onClick={() => setSidebarOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop collapse toggle */}
            <button
              className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? "Развернуть меню" : "Свернуть меню"}
              title={sidebarCollapsed ? "Развернуть меню" : "Свернуть меню"}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>

            {/* Breadcrumb & Title */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <span>CMS</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="flex items-center gap-2 truncate">
                <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <CurrentIcon className="h-4 w-4" />
                </div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {currentItem.label}
                </h1>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Online Status Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Система в сети</span>
            </div>

            {/* Go to live site button */}
            <Link href="/" target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
              >
                <ExternalLink className="h-3.5 w-3.5 text-amber-500" />
                <span>На сайт</span>
              </Button>
            </Link>

            {/* Theme Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
              onClick={toggleTheme}
              title={theme === "dark" ? "Включить светлую тему" : "Включить темную тему"}
              aria-label="Сменить тему"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600 hover:-rotate-12 transition-transform" />
              )}
            </Button>

            {/* Admin User Info Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-bold flex items-center justify-center text-xs shadow-sm shadow-amber-500/20 shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user?.name || "Администратор"}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold leading-tight">
                  Главный админ
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
