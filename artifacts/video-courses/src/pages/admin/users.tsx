import { useState } from "react";
import { useAdminListUsers } from "@workspace/api-client-react";
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
import { ShieldCheck, User } from "lucide-react";

export function AdminUsers() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminListUsers({ page, limit: 10 });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Пользователи</h1>
      </div>

      <div className="bg-white dark:bg-card border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Пользователь</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Дата регистрации</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.id}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {u.name.charAt(0)}
                    </div>
                    {u.name}
                  </div>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  {u.role === 'admin' ? (
                    <span className="flex items-center text-primary text-xs font-semibold px-2 py-1 bg-primary/10 rounded w-fit">
                      <ShieldCheck className="h-3 w-3 mr-1" /> Админ
                    </span>
                  ) : (
                    <span className="flex items-center text-muted-foreground text-xs font-semibold px-2 py-1 bg-muted rounded w-fit">
                      <User className="h-3 w-3 mr-1" /> Клиент
                    </span>
                  )}
                </TableCell>
                <TableCell>{new Date(u.createdAt).toLocaleDateString("ru-RU")}</TableCell>
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
