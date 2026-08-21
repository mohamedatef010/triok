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
import { ShieldCheck, User, Users as UsersIcon, Mail, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

export function AdminUsers() {
  useSEO({ robots: "noindex, follow" });
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminListUsers({ page, limit: 10 });

  if (isLoading) return <LoadingSpinner />;

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  // Avatar color generator based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
      "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <UsersIcon className="h-6 w-6" />
            </div>
            <span>Пользователи системы</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Список всех зарегистрированных клиентов и администраторов платформы
          </p>
        </div>

        {data && (
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 w-fit">
            Всего пользователей: <span className="text-amber-500 font-bold">{data.total}</span>
          </div>
        )}
      </div>

      {/* Users Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader className="bg-slate-50/80 dark:bg-slate-950/50">
              <TableRow className="border-b border-slate-200/80 dark:border-slate-800/80">
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400 w-20">
                  ID
                </TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400">
                  Имя пользователя
                </TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400">
                  Email
                </TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400">
                  Роль
                </TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400 text-right pr-6">
                  Дата регистрации
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.users && data.users.length > 0 ? (
                data.users.map((u) => (
                  <TableRow
                    key={u.id}
                    className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <TableCell className="font-bold text-xs text-amber-600 dark:text-amber-400">
                      #{u.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-xl border flex items-center justify-center font-bold text-xs shadow-sm ${getAvatarColor(
                            u.name || "U"
                          )}`}
                        >
                          {u.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {u.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Администратор</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                          <User className="h-3.5 w-3.5" />
                          <span>Клиент</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <div className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{new Date(u.createdAt).toLocaleDateString("ru-RU")}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400 text-xs">
                    Пользователей пока нет
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
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
