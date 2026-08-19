import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

export function AdminLogin() {
  useSEO({ robots: "noindex, follow" });
  const [, setLocation] = useLocation();
  const loginMut = useAdminLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    if (token) {
      setLocation("/admm/dashboard");
    }
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await loginMut.mutateAsync({ data: { username, password } });
      localStorage.setItem("admin_token", res.token);
      setLocation("/admm/dashboard");
    } catch (err: any) {
      setError(err.message || "Неверные данные");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 transition-colors">

      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl transition-colors">
        <div className="flex flex-col items-center mb-8">
          <img src="/n13.webp" alt="CMS Logo" className="h-28 sm:h-32 w-auto max-w-[220px] object-contain mb-4 filter drop-shadow-xl" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Панель управления CMS</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Авторизация в системе управления</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input 
              placeholder="Имя пользователя" 
              className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white h-12"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div>
            <Input 
              type="password"
              placeholder="Пароль" 
              className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white h-12"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}
          <Button type="submit" className="w-full h-12 mt-4 font-bold bg-amber-500 hover:bg-amber-600 text-slate-950" disabled={loginMut.isPending}>
            {loginMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
}
