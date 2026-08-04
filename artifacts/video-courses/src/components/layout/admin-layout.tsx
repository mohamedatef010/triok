import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Film, ShoppingCart, Users, ArrowLeft } from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, logout } = useAuth();

  // If not admin and not loading, we should ideally redirect, but we'll handle that in components or a guard hook.
  // For now just render the sidebar.

  return (
    <div className="flex min-h-[100dvh] w-full bg-slate-100 dark:bg-slate-900 absolute top-0 left-0 z-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 font-bold text-white tracking-tight border-b border-slate-800">
          АДМИН-ПАНЕЛЬ
        </div>
        <nav className="flex-1 py-6 px-3 flex flex-col gap-1">
          <Link href="/admm/dashboard">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
              <LayoutDashboard className="mr-3 h-5 w-5" /> Дашборд
            </Button>
          </Link>
          <Link href="/admm/videos">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
              <Film className="mr-3 h-5 w-5" /> Видео и курсы
            </Button>
          </Link>
          <Link href="/admm/orders">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
              <ShoppingCart className="mr-3 h-5 w-5" /> Заказы
            </Button>
          </Link>
          <Link href="/admm/users">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
              <Users className="mr-3 h-5 w-5" /> Пользователи
            </Button>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white" asChild>
            <Link href="/">
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden text-foreground">
        <header className="h-16 bg-white dark:bg-slate-950 border-b flex items-center px-8 shrink-0 justify-end">
          <div className="text-sm font-medium">Администратор {user?.name}</div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
