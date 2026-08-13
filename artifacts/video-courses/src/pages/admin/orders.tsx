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

export function AdminOrders() {
  useSEO({ robots: "noindex, follow" });
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminListOrders({ page, limit: 10 });

  if (isLoading) return <LoadingSpinner />;

  const statusMap: Record<string, { label: string, badge: string }> = {
    pending: { label: "Ожидает", badge: "bg-amber-100 text-amber-800" },
    paid: { label: "Оплачен", badge: "bg-green-100 text-green-800" },
    failed: { label: "Ошибка", badge: "bg-red-100 text-red-800" },
    cancelled: { label: "Отменен", badge: "bg-slate-100 text-slate-800" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Заказы</h1>
      </div>

      <div className="bg-white dark:bg-card border rounded-xl overflow-hidden shadow-sm overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Клиент ID</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Способ</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">#{o.id}</TableCell>
                <TableCell>{new Date(o.createdAt).toLocaleString("ru-RU")}</TableCell>
                <TableCell>{o.userId}</TableCell>
                <TableCell className="font-bold">{o.total} ₽</TableCell>
                <TableCell>{o.paymentMethod || "-"}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusMap[o.status].badge}`}>
                    {statusMap[o.status].label}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && data.total > data.limit && (
        <div className="flex justify-between items-center bg-white dark:bg-card p-4 border rounded-xl">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Назад</Button>
          <span className="text-sm font-medium">Страница {page} из {Math.ceil(data.total / data.limit)}</span>
          <Button variant="outline" disabled={page >= Math.ceil(data.total / data.limit)} onClick={() => setPage(p => p + 1)}>Вперед</Button>
        </div>
      )}
    </div>
  );
}
