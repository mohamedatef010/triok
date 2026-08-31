import { useGetAnalyticsOverview, useGetDailyVisitors, useGetVideoViewStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Eye,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Sparkles,
  Film,
  Tag,
  LayoutTemplate,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { LoadingSpinner } from "@/components/ui/states";
import { useSEO } from "@/hooks/use-seo";

export function AdminDashboard() {
  useSEO({ robots: "noindex, follow" });
  const { data: stats, isLoading: statsLoading } = useGetAnalyticsOverview();
  const { data: visitorsData, isLoading: visitorsLoading } = useGetDailyVisitors();
  const { data: viewsData, isLoading: viewsLoading } = useGetVideoViewStats();

  if (statsLoading || visitorsLoading || viewsLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      {/* Top Welcome & Quick Actions Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Панель управления CMS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Добро пожаловать в админ-панель
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
              Здесь представлена актуальная статистика по продажам, посетителям, заказам и популярным видеоурокам.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admm/videos">
              <Button className="h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-md shadow-amber-500/20 text-xs">
                <Plus className="h-4 w-4 mr-1.5" /> Добавить курс
              </Button>
            </Link>
            <Link href="/admm/orders">
              <Button
                variant="outline"
                className="h-10 px-4 rounded-xl border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                <ShoppingCart className="h-4 w-4 mr-1.5 text-amber-400" /> Заказы
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Revenue */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Общая выручка
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {Number(stats?.totalRevenue || 0).toLocaleString("ru-RU")} ₽
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Сегодня: +{Number(stats?.revenueToday || 0).toLocaleString("ru-RU")} ₽</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Orders */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Всего заказов
            </CardTitle>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats?.totalOrders || 0}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
              <Activity className="h-3.5 w-3.5" />
              <span>Сегодня: +{stats?.ordersToday || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Users */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Пользователи
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Зарегистрированных аккаунтов
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Views */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Просмотры видео
            </CardTitle>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Eye className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats?.totalViews || 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Посетителей сегодня: <span className="font-bold text-slate-800 dark:text-slate-200">{stats?.visitorsToday || 0}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link href="/admm/videos" className="group">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                <Film className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Видео и обучение</div>
                <div className="text-[11px] text-muted-foreground">Управление уроками</div>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </Link>

        <Link href="/admm/promocodes" className="group">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                <Tag className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Промокоды</div>
                <div className="text-[11px] text-muted-foreground">Скидки и игра</div>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </Link>

        <Link href="/admm/hero-section" className="group">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Главный экран</div>
                <div className="text-[11px] text-muted-foreground">Hero и баннеры</div>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </Link>

        <Link href="/admm/users" className="group">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Пользователи</div>
                <div className="text-[11px] text-muted-foreground">База клиентов</div>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </Link>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitors Chart */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-500" />
              <span>Посещаемость по дням (последние 30 дней)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Количество уникальных посетителей платформы за день
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] sm:h-[320px] p-2 sm:p-6 pt-0">
            {visitorsData && visitorsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visitorsData}>
                  <defs>
                    <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="date"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    stroke="#94a3b8"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #334155",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                    labelStyle={{ color: "#fbbf24", marginBottom: "4px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Посетители"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#visitorGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Activity className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                <span className="text-xs">Данные посещаемости еще накапливаются</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Courses Chart */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Film className="h-4 w-4 text-amber-500" />
              <span>Топ обучения по просмотрам</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Самые востребованные видеоматериалы платформы
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] sm:h-[320px] p-2 sm:p-6 pt-0">
            {viewsData && viewsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewsData.slice(0, 5)} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} stroke="#94a3b8" />
                  <YAxis
                    type="category"
                    dataKey="title"
                    width={110}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    stroke="#94a3b8"
                    tickFormatter={(value) => (value?.length > 15 ? value.substring(0, 15) + "..." : value)}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(245, 158, 11, 0.05)" }}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #334155",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                    labelStyle={{ color: "#fbbf24", marginBottom: "4px" }}
                  />
                  <Bar
                    dataKey="viewCount"
                    name="Просмотры"
                    fill="#f59e0b"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Film className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                <span className="text-xs">Данные просмотров еще накапливаются</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
