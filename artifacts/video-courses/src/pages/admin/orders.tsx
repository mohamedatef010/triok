import { useState } from "react";
import { useAdminListOrders } from "@workspace/api-client-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Receipt,
  User,
  CreditCard,
} from "lucide-react";

export function AdminOrders() {
  useSEO({ robots: "noindex, follow" });
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminListOrders({ page, limit: 10 });

  if (isLoading) return <LoadingSpinner />;

  const statusMap: Record<string, { label: string; badge: string; icon: any }> = {
    pending: {
      label: "Ожидает",
      badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
      icon: Clock,
    },
    paid: {
      label: "Оплачен",
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
      icon: CheckCircle2,
    },
    failed: {
      label: "Ошибка",
      badge: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
      icon: AlertCircle,
    },
    cancelled: {
      label: "Отменен",
      badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20",
      icon: XCircle,
    },
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Receipt className="h-6 w-6" />
            </div>
            <span>Заказы клиентов</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            История покупок, платежей и статусов оформления заказов
          </p>
        </div>

        {data && (
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 w-fit">
            Всего заказов: <span className="text-amber-500 font-bold">{data.total}</span>
          </div>
        )}
      </div>

      {/* Orders Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader className="bg-slate-50/80 dark:bg-slate-950/50">
              <TableRow className="border-b border-slate-200/80 dark:border-slate-800/80">
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400 w-24">
                  ID Заказа
                </TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400">
                  Дата и время
                </TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400">
                  Клиент (ID)
                </TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400">
                  Сумма
                </TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400">
                  Способ оплаты
                </TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400 text-right pr-6">
                  Статус
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.orders && data.orders.length > 0 ? (
                data.orders.map((o) => {
                  const statusInfo = statusMap[o.status] || {
                    label: o.status,
                    badge: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
                    icon: Clock,
                  };
                  const StatusIcon = statusInfo.icon;

                  return (
                    <TableRow
                      key={o.id}
                      className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <TableCell className="font-bold text-xs text-amber-600 dark:text-amber-400">
                        #{o.id}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {new Date(o.createdAt).toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>Пользователь #{o.userId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-sm text-slate-900 dark:text-white">
                        {Number(o.total).toLocaleString("ru-RU")} ₽
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                          <span>{o.paymentMethod || "Онлайн"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.badge}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{statusInfo.label}</span>
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400 text-xs">
                    Заказов пока не найдено
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Container */}
      {data && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span>Назад</span>
          </Button>

          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Страница <span className="text-amber-500 font-bold">{page}</span> из {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold"
          >
            <span>Вперед</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
