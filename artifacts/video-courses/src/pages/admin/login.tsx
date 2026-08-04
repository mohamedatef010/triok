import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Loader2 } from "lucide-react";

export function AdminLogin() {
  const [, setLocation] = useLocation();
  const loginMut = useAdminLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Панель управления</h1>
          <p className="text-slate-400 text-sm mt-1">Доступ только для администратора</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input 
              placeholder="Имя пользователя" 
              className="bg-slate-950 border-slate-800 text-white h-12"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div>
            <Input 
              type="password"
              placeholder="Пароль" 
              className="bg-slate-950 border-slate-800 text-white h-12"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}
          <Button type="submit" className="w-full h-12 mt-4" disabled={loginMut.isPending}>
            {loginMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
}
