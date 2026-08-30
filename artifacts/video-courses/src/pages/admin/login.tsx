import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Sun, Moon, Lock, User, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { useTheme } from "@/hooks/use-theme";

export function AdminLogin() {
  useSEO({ robots: "noindex, follow" });
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const loginMut = useAdminLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    if (token) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.role === "admin" && (!payload.exp || payload.exp * 1000 > Date.now() + 10000)) {
            setLocation("/admm/dashboard");
            return;
          }
        }
      } catch {}
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_last_activity");
    }
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await loginMut.mutateAsync({ data: { username, password } });
      localStorage.setItem("admin_token", res.token);
      localStorage.setItem("admin_last_activity", String(Date.now()));
      setLocation("/admm/dashboard");
    } catch (err: any) {
      setError(err.message || "Неверный логин или пароль");
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center text-slate-900 dark:text-white p-4 sm:p-6 transition-colors overflow-hidden select-none">
      {/* High Quality Thematic Background Image with Optimized WebP (Crystal Clear - No Blur) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/admin_magic_bg.webp"
          alt="Magician Backdrop"
          className="w-full h-full object-cover object-center brightness-[0.85] dark:brightness-[0.75] transition-all duration-700"
        />
        {/* Subtle dark gradient overlay for text readability without any blur */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-slate-950/60" />
      </div>

      {/* Floating subtle ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Top Header bar with Site Link and Theme toggle */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between z-10 max-w-5xl mx-auto w-full">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-slate-200 hover:text-white rounded-xl bg-slate-900/70 hover:bg-slate-800/80 backdrop-blur-md border border-slate-700/60 text-xs shadow-lg transition"
          >
            <ArrowLeft className="h-4 w-4 text-amber-400" />
            <span>Вернуться на сайт</span>
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl text-slate-200 hover:text-white bg-slate-900/70 hover:bg-slate-800/80 backdrop-blur-md border border-slate-700/60 shadow-lg transition"
          onClick={toggleTheme}
          title={theme === "dark" ? "Включить светлую тему" : "Включить темную тему"}
          aria-label="Сменить тему"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-400 hover:-rotate-12 transition-transform" />
          )}
        </Button>
      </div>

      {/* Login Card with Frosted Glass Effect */}
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] relative z-10 transition-all duration-300">
        <div className="flex flex-col items-center text-center mb-8">
          {/* Standalone Logo with Soft Eye-Friendly Ambient Glow */}
          <div className="relative mb-5 flex items-center justify-center">
            <div className="absolute inset-0 bg-amber-400/15 rounded-full blur-2xl animate-pulse pointer-events-none" />
            <img
              src="/n13.webp"
              alt="CMS Logo"
              className="relative h-20 sm:h-24 w-auto max-w-[200px] object-contain filter drop-shadow-[0_6px_24px_rgba(245,158,11,0.2)] transition-transform duration-500 hover:scale-105"
            />
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Панель управления
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              CMS
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Введите учетные данные администратора
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Имя пользователя или Email
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="admin@example.com"
                className="pl-10 h-12 bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10 h-12 bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium text-center animate-in fade-in">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 mt-2 font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200"
            disabled={loginMut.isPending}
          >
            {loginMut.isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Вход в систему...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>Войти в CMS</span>
              </div>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Защищенная область администрирования. Все действия логируются.
          </p>
        </div>
      </div>
    </div>
  );
}
