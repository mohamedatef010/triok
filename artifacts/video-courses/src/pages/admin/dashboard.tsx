import { useGetAnalyticsOverview, useGetDailyVisitors, useGetVideoViewStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Eye } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { LoadingSpinner } from "@/components/ui/states";

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAnalyticsOverview();
  const { data: visitorsData, isLoading: visitorsLoading } = useGetDailyVisitors();
  const { data: viewsData, isLoading: viewsLoading } = useGetVideoViewStats();

  if (statsLoading || visitorsLoading || viewsLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Обзор</h1>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Общая выручка</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRevenue} ₽</div>
            <p className="text-xs text-muted-foreground mt-1">Сегодня: +{stats?.revenueToday} ₽</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего заказов</CardTitle>
            <ShoppingCart className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Сегодня: +{stats?.ordersToday}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Пользователи</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Просмотры</CardTitle>
            <Eye className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalViews}</div>
            <p className="text-xs text-muted-foreground mt-1">Посетителей сегодня: {stats?.visitorsToday}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Посещаемость по дням (последние 30 дней)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {visitorsData && visitorsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visitorsData}>
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="count" name="Посетители" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">Нет данных</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Топ курсов по просмотрам</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {viewsData && viewsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewsData.slice(0, 5)} layout="vertical" margin={{ left: 50 }}>
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="title" width={100} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => value.substring(0, 15) + '...'} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="viewCount" name="Просмотры" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">Нет данных</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
