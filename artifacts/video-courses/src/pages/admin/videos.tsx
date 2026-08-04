import { useState } from "react";
import { 
  useAdminListVideos, 
  useDeleteVideo, 
  useSetVideoDiscount 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/states";
import { Plus, Trash2, Edit2, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Very simplified version. Real app would have modals for Create/Edit.
export function AdminVideos() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useAdminListVideos({ page, limit: 10 });
  const deleteMut = useDeleteVideo();
  const discountMut = useSetVideoDiscount();
  const { toast } = useToast();

  if (isLoading) return <LoadingSpinner />;

  const handleDelete = async (id: number) => {
    if (!confirm("Точно удалить?")) return;
    await deleteMut.mutateAsync({ id });
    refetch();
  };

  const handleDiscount = async (id: number) => {
    const val = prompt("Введите новую цену (или оставьте пустым для отмены скидки):");
    if (val === null) return;
    const dp = val ? Number(val) : null;
    await discountMut.mutateAsync({ id, data: { discountPrice: dp } });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Видео и курсы</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Добавить курс
        </Button>
      </div>

      <div className="bg-white dark:bg-card border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead>Скидка</TableHead>
              <TableHead>Просмотры</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.videos.map((v) => (
              <TableRow key={v.id}>
                <TableCell>{v.id}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <img src={v.thumbnailUrl || undefined} alt="" className="w-12 h-8 object-cover rounded bg-muted" />
                    <span className="line-clamp-1">{v.title}</span>
                  </div>
                </TableCell>
                <TableCell>{v.price} ₽</TableCell>
                <TableCell>
                  {v.discountPrice ? (
                    <span className="text-primary font-bold">{v.discountPrice} ₽</span>
                  ) : "-"}
                </TableCell>
                <TableCell>{v.viewCount}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleDiscount(v.id)} title="Скидка">
                      <Percent className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Редактировать">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(v.id)} title="Удалить">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
