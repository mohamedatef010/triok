import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Film, ShoppingCart, Users, ArrowLeft, Star, Menu, X, Camera, Tag, ShieldCheck, LayoutTemplate } from "lucide-react";

const navItems = [
  { href: "/admm/dashboard", icon: LayoutDashboard, label: "Дашборд" },
  { href: "/admm/hero-section", icon: LayoutTemplate, label: "Главный экран (Hero)" },
  { href: "/admm/videos", icon: Film, label: "Видео и курсы" },
  { href: "/admm/orders", icon: ShoppingCart, label: "Заказы" },
  { href: "/admm/users", icon: Users, label: "Пользователи" },
  { href: "/admm/promocodes", icon: Tag, label: "Промокоды & Игра" },
  { href: "/admm/requisites", icon: ShieldCheck, label: "Реквизиты продавца" },
  { href: "/admm/author-section", icon: Film, label: "Контент сайта" },
  { href: "/admm/events-gallery", icon: Camera, label: "Фото с мероприятий" },
  { href: "/admm/reviews-section", icon: Star, label: "Отзывы" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    if (typeof window !== "undefined") {
      return Boolean(localStorage.getItem("admin_token"));
    }
    return null;
  });

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    if (!token) {
      setIsAuthenticated(false);
      setLocation("/admm");
    } else {
      setIsAuthenticated(true);
    }
  }, [location, setLocation]);

  if (isAuthenticated === false || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Проверка авторизации...</span>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center gap-3 px-4 font-bold text-white tracking-tight border-b border-slate-800 shrink-0">
        <img src="/n13.webp" alt="CMS Logo" className="h-9 w-auto max-w-[100px] object-contain shrink-0 filter drop-shadow" />
        <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent font-black text-sm tracking-wider">
          CMS АДМИН
        </span>
        {/* Close btn on mobile */}
        <button
          className="ml-auto lg:hidden text-slate-400 hover:text-white p-1"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}>
            <Button
              variant="ghost"
              className={`w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 ${
                location === href ? "bg-slate-800 text-white" : ""
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="mr-3 h-5 w-5 shrink-0" /> {label}
            </Button>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 shrink-0">
        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white" asChild>
          <Link href="/" onClick={() => setSidebarOpen(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> На сайт
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10 mt-2"
          onClick={() => {
            localStorage.removeItem("admin_token");
            window.location.href = "/admm";
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Выйти
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-[100dvh] w-full bg-slate-100 dark:bg-slate-900 absolute top-0 left-0 z-50">

      {/* ── Desktop Sidebar (hidden on mobile) ── */}
      <aside className="hidden lg:flex w-64 bg-slate-950 text-slate-300 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      {/* ── Mobile Sidebar Drawer ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-slate-950 text-slate-300 flex flex-col z-50 lg:hidden
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent />
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden text-foreground">
        {/* Header */}
        <header className="h-14 lg:h-16 bg-white dark:bg-slate-950 border-b flex items-center px-4 lg:px-8 shrink-0 gap-3">
          {/* Hamburger - mobile only */}
          <button
            className="lg:hidden text-foreground p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="lg:hidden text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
            CMS АДМИН
          </span>
          <div className="ml-auto text-xs lg:text-sm font-medium text-muted-foreground">
            {user?.name}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
