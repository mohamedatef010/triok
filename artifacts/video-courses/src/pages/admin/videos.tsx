import { useState, useRef, useCallback } from "react";
import { useSEO } from "@/hooks/use-seo";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAdminListVideos,
  useDeleteVideo,
  useSetVideoDiscount,
  useUpdateVideo,
  useCreateVideo,
  useGetVideoUploadUrl,
  useProcessVideo,
  useListCategories,
  useCreateCategory,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/states";
import {
  Plus,
  Trash2,
  Percent,
  Clock,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Film,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ThumbnailSource = "url" | "file";
type PreviewVideoSource = "url" | "file";

/** Конвертация любого изображения в WebP с помощью Canvas API в браузере */
async function convertImageToWebP(file: File, quality = 0.88): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to convert image to WebP"));
        },
        "image/webp",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Failed to load image")); };
    img.src = objectUrl;
  });
}

type UploadStep = "idle" | "creating" | "uploading" | "processing" | "done" | "error";
type VideoSource = "file" | "url";


export function AdminVideos() {
  useSEO({ robots: "noindex, follow" });
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useAdminListVideos({ page, limit: 10 });
  const deleteMut = useDeleteVideo();
  const discountMut = useSetVideoDiscount();
  const updateMut = useUpdateVideo();
  const createMut = useCreateVideo();
  const getUploadUrlMut = useGetVideoUploadUrl();
  const processVideoMut = useProcessVideo();
  const { data: categories, refetch: refetchCategories } = useListCategories();
  const createCategoryMut = useCreateCategory();
  const { toast } = useToast();

  const invalidateVideoCaches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    queryClient.invalidateQueries({ queryKey: ["/api/videos/featured"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/videos"] });
  }, [queryClient]);

  // --- Dialog state ---
  const [isOpen, setIsOpen] = useState(false);
  const [videoSource, setVideoSource] = useState<VideoSource>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Thumbnail state ---
  const [thumbnailSource, setThumbnailSource] = useState<ThumbnailSource>("url");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailDragOver, setThumbnailDragOver] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // --- Demo/preview video (URL or file from device) ---
  const [previewVideoSource, setPreviewVideoSource] = useState<PreviewVideoSource>("url");
  const [previewVideoFile, setPreviewVideoFile] = useState<File | null>(null);
  const [previewVideoDragOver, setPreviewVideoDragOver] = useState(false);
  const previewVideoInputRef = useRef<HTMLInputElement>(null);

  // --- Category state ---
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("none");
  const [newCategoryName, setNewCategoryName] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    discountPercent: "",
    thumbnailUrl: "",
    description: "",
    previewDurationSeconds: "",
    videoUrl: "",
    previewVideoUrl: "",
  });

  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  // --- Handlers ---
  const resetDialog = () => {
    setFormData({ title: "", price: "", discountPercent: "", thumbnailUrl: "", description: "", previewDurationSeconds: "", videoUrl: "", previewVideoUrl: "" });
    setSelectedFile(null);
    setThumbnailFile(null);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    setThumbnailSource("url");
    setPreviewVideoSource("url");
    setPreviewVideoFile(null);
    setSelectedCategoryId("none");
    setNewCategoryName("");
    setUploadStep("idle");
    setUploadProgress(0);
    setVideoSource("file");
    setIsOpen(false);
  };

  const handleThumbnailFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Выбранный файл не является изображением", variant: "destructive" });
      return;
    }
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Точно удалить этот курс?")) return;
    await deleteMut.mutateAsync({ id });
    invalidateVideoCaches();
    refetch();
    toast({ title: "Курс удалён" });
  };

  const handleDiscount = async (id: number, currentPrice: number, currentDiscountPrice?: number | null) => {
    const currentPct = currentDiscountPrice && currentPrice ? Math.round((1 - currentDiscountPrice / currentPrice) * 100) : "";
    const val = prompt(
      `Введите процент скидки для курса (текущая цена: ${currentPrice} ₽).\nНапример: введите 20 для скидки 20% (цена со скидкой станет ${Math.round(currentPrice * 0.8)} ₽).\nОставьте пустым для отмены скидки:`,
      currentPct ? String(currentPct) : ""
    );
    if (val === null) return;
    const trimmed = val.trim();
    if (!trimmed) {
      await discountMut.mutateAsync({ id, data: { discountPrice: null } });
      invalidateVideoCaches();
      refetch();
      toast({ title: "Скидка убрана" });
      return;
    }
    const pct = Number(trimmed);
    if (isNaN(pct) || pct <= 0 || pct >= 100) {
      toast({ title: "Введите корректный процент скидки (от 1 до 99)", variant: "destructive" });
      return;
    }
    const dp = Math.round(currentPrice * (1 - pct / 100));
    await discountMut.mutateAsync({ id, data: { discountPrice: dp } });
    invalidateVideoCaches();
    refetch();
    toast({ title: `Скидка ${pct}% установлена! Новая цена: ${dp} ₽ (было ${currentPrice} ₽)` });
  };

  const handlePreviewDuration = async (id: number) => {
    const val = prompt("Длительность превью (секунды). Оставьте пустым для авто (20% видео):");
    if (val === null) return;
    const dp = val ? Number(val) : null;
    await updateMut.mutateAsync({ id, data: { previewDurationSeconds: dp } });
    invalidateVideoCaches();
    refetch();
    toast({ title: dp ? `Превью: ${dp} сек` : "Превью: авто" });
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
    } else {
      toast({ title: "Только видеофайлы", variant: "destructive" });
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.price) {
      toast({ title: "Заполните обязательные поля: Название и Цена", variant: "destructive" });
      return;
    }
    if (videoSource === "file" && !selectedFile) {
      toast({ title: "Выберите видеофайл для загрузки", variant: "destructive" });
      return;
    }
    if (videoSource === "url" && !formData.videoUrl) {
      toast({ title: "Введите ссылку на видео", variant: "destructive" });
      return;
    }

    try {
      // Step 0: Upload thumbnail file if provided (convert to WebP first)
      let resolvedThumbnailUrl = formData.thumbnailUrl || undefined;
      if (thumbnailSource === "file" && thumbnailFile) {
        // Convert image to WebP in the browser via Canvas API
        const webpBlob = await convertImageToWebP(thumbnailFile);

        // Upload WebP directly to server (which puts it in MinIO reliably)
        const uploadRes = await fetch("/api/admin/upload-image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token") || localStorage.getItem("auth_token")}`,
            "Content-Type": "image/webp",
          },
          body: webpBlob,
        });
        if (!uploadRes.ok) throw new Error("Ошибка загрузки миниатюры");
        const { url: publicUrl } = await uploadRes.json() as { url: string };

        resolvedThumbnailUrl = publicUrl;
      }


      // Step 1: Create course record in DB
      setUploadStep("creating");

      let resolvedCategoryId: number | undefined = undefined;
      if (selectedCategoryId !== "none") {
        resolvedCategoryId = Number(selectedCategoryId);
      } else if (newCategoryName.trim()) {
        const slug = newCategoryName.trim().toLowerCase().replace(/\s+/g, "-");
        const cat = await createCategoryMut.mutateAsync({
          data: {
            name: newCategoryName.trim(),
            slug: slug,
          }
        });
        resolvedCategoryId = cat.id;
        refetchCategories();
      }

      const numPrice = Number(formData.price) || 0;
      const numDiscountPercent = Number(formData.discountPercent) || 0;
      const calculatedDiscountPrice = (numPrice > 0 && numDiscountPercent > 0 && numDiscountPercent < 100)
        ? Math.round(numPrice * (1 - numDiscountPercent / 100))
        : undefined;

      const video = await createMut.mutateAsync({
        data: {
          title: formData.title,
          price: numPrice,
          discountPrice: calculatedDiscountPrice,
          thumbnailUrl: resolvedThumbnailUrl,
          description: formData.description || undefined,
          previewDurationSeconds: formData.previewDurationSeconds ? Number(formData.previewDurationSeconds) : undefined,
          categoryId: resolvedCategoryId,
          isPublished: true,
          isFeatured: true,
          // Full course video URL (shown only to buyers in their profile)
          videoUrl: videoSource === "url" ? formData.videoUrl : undefined,
          // Preview/demo video URL (shown to all visitors for free)
          previewVideoUrl: formData.previewVideoUrl || undefined,
        }
      });

      if (previewVideoSource === "file" && previewVideoFile) {
        setUploadStep("uploading");
        const token = localStorage.getItem("admin_token") || localStorage.getItem("auth_token");
        const previewRes = await fetch(`/api/videos/${video.id}/preview-upload-url`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ contentType: previewVideoFile.type || "video/mp4" }),
        });
        if (!previewRes.ok) throw new Error("Не удалось получить ссылку для загрузки демо-видео");
        const { uploadUrl: previewUploadUrl, publicUrl: previewPublicUrl } = await previewRes.json() as { uploadUrl: string; publicUrl: string };

        const putPreview = await fetch(previewUploadUrl, {
          method: "PUT",
          headers: { "Content-Type": previewVideoFile.type || "video/mp4" },
          body: previewVideoFile,
        });
        if (!putPreview.ok) throw new Error("Ошибка загрузки демо-видео");

        const completeRes = await fetch(`/api/videos/${video.id}/preview-complete`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ previewVideoUrl: previewPublicUrl }),
        });
        if (!completeRes.ok) throw new Error("Не удалось сохранить демо-видео");
      }

      if (videoSource === "url") {
        // URL source: no upload needed, just save and done
        setUploadStep("done");
        toast({ title: "✅ Курс создан с видео-ссылкой!", description: video.title });
        invalidateVideoCaches();
        refetch();
        setTimeout(resetDialog, 1500);
        return;
      }

      // Step 2: Get presigned S3 upload URL
      setUploadStep("uploading");
      const { uploadUrl } = await getUploadUrlMut.mutateAsync({ id: video.id });

      // Step 3: Upload file directly to S3 (not through our server!)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", selectedFile!.type || "video/mp4");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(selectedFile);
      });

      // Step 4: Trigger HLS processing on the server
      setUploadStep("processing");
      await processVideoMut.mutateAsync({ id: video.id });

      setUploadStep("done");
      toast({ title: "✅ Видео загружено и обрабатывается!", description: "HLS-превью будет готово через несколько минут." });
      invalidateVideoCaches();
      refetch();
      setTimeout(resetDialog, 2000);

    } catch (err: any) {
      setUploadStep("error");
      toast({ title: "Ошибка!", description: err.message || "Что-то пошло не так", variant: "destructive" });
    }
  };

  const stepLabels: Record<UploadStep, string> = {
    idle: "",
    creating: "Создание записи в базе...",
    uploading: "Загрузка файла в облако...",
    processing: "Запуск HLS-обработки...",
    done: "Готово!",
    error: "Произошла ошибка",
  };

  const isWorking = ["creating", "uploading", "processing"].includes(uploadStep);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Film className="h-6 w-6" />
            </div>
            <span>Видео и курсы</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Загрузка новых видеокурсов, настройка скидок и управление каталогом
          </p>
        </div>

        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          className="h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-md shadow-amber-500/20 text-xs shrink-0 w-fit"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Добавить курс</span>
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[750px]">
            <TableHeader className="bg-slate-50/80 dark:bg-slate-950/50">
              <TableRow className="border-b border-slate-200/80 dark:border-slate-800/80">
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400 w-16">ID</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400">Название курса</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400">Цена</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400">Скидка</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400">Превью (сек)</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400">Просмотры</TableHead>
                <TableHead className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400 text-right pr-6">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.videos.map((v) => (
                <TableRow key={v.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-bold text-xs text-amber-600 dark:text-amber-400">#{v.id}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <img src={v.thumbnailUrl || undefined} alt="" className="w-14 h-9 object-cover rounded-lg bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-800" />
                      <span className="line-clamp-1 text-xs font-bold text-slate-900 dark:text-white">{v.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold">{v.price} ₽</TableCell>
                  <TableCell>
                    {v.discountPrice ? (
                      <div className="flex flex-col">
                        <span className="text-amber-500 font-bold text-xs">{v.discountPrice} ₽</span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                          -{Math.round((1 - v.discountPrice / v.price) * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-400">{(v as any).previewDurationSeconds || "Авто"}</TableCell>
                  <TableCell className="text-xs font-medium text-slate-600 dark:text-slate-400">{v.viewCount}</TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400" onClick={() => handlePreviewDuration(v.id)} title="Длительность превью">
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400" onClick={() => handleDiscount(v.id, v.price, v.discountPrice)} title="Скидка %">
                        <Percent className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleDelete(v.id)} title="Удалить">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {data && data.total > data.limit && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold">Назад</Button>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Страница <span className="text-amber-500 font-bold">{page}</span> из {Math.ceil(data.total / data.limit)}</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / data.limit)} onClick={() => setPage(p => p + 1)} className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold">Вперед</Button>
        </div>
      )}

      {/* ── Create/Upload Dialog ── */}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!isWorking) { if (!open) resetDialog(); else setIsOpen(true); } }}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="h-5 w-5 text-amber-500" />
              Добавить новый курс
            </DialogTitle>
          </DialogHeader>

          {/* Progress Steps */}
          {uploadStep !== "idle" && (
            <div className={`rounded-xl p-4 border text-sm font-medium flex items-center gap-3 ${uploadStep === "done" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" :
                uploadStep === "error" ? "bg-red-500/10 border-red-500/30 text-red-600" :
                  "bg-amber-500/10 border-amber-500/30 text-amber-600"
              }`}>
              {uploadStep === "done" && <CheckCircle2 className="h-5 w-5 shrink-0" />}
              {uploadStep === "error" && <AlertCircle className="h-5 w-5 shrink-0" />}
              {isWorking && <Loader2 className="h-5 w-5 shrink-0 animate-spin" />}
              <div className="flex-1">
                <div>{stepLabels[uploadStep]}</div>
                {uploadStep === "uploading" && (
                  <div className="mt-2">
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-right mt-1">{uploadProgress}%</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {/* Course info */}
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Название курса <span className="text-red-500">*</span></label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Например: Полный курс по Premiere Pro"
                disabled={isWorking}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Описание курса</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Опишите чему научатся студенты..."
                rows={3}
                disabled={isWorking}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Цена ₽ <span className="text-red-500">*</span></label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="5000"
                  disabled={isWorking}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Скидка %</label>
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                  placeholder="20 (т.е. 20%)"
                  disabled={isWorking}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Превью (секунды)</label>
                <Input
                  type="number"
                  value={formData.previewDurationSeconds}
                  onChange={(e) => setFormData({ ...formData, previewDurationSeconds: e.target.value })}
                  placeholder="180 (авто: 20%)"
                  disabled={isWorking}
                />
              </div>
            </div>

            {/* Helper preview when discount percent is entered */}
            {Number(formData.price) > 0 && Number(formData.discountPercent) > 0 && Number(formData.discountPercent) < 100 && (
              <div className="text-xs bg-amber-400/10 border border-amber-400/30 text-amber-600 dark:text-amber-400 p-2.5 rounded-lg flex items-center justify-between font-medium">
                <span>🎯 Скидка: <strong>{Number(formData.discountPercent)}%</strong> (экономия {(Number(formData.price) - Math.round(Number(formData.price) * (1 - Number(formData.discountPercent) / 100))).toLocaleString("ru-RU")} ₽)</span>
                <span className="font-bold text-sm">Итоговая цена: {Math.round(Number(formData.price) * (1 - Number(formData.discountPercent) / 100)).toLocaleString("ru-RU")} ₽</span>
              </div>
            )}

            {/* Category selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Раздел (Категория)</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    if (e.target.value !== "none") {
                      setNewCategoryName("");
                    }
                  }}
                  disabled={isWorking}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="none">Без раздела</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Или создать новый раздел</label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Например: Карточные трюки"
                  disabled={isWorking || selectedCategoryId !== "none"}
                />
              </div>
            </div>

            {/* Thumbnail source selector */}
            <div className="grid gap-3">
              <label className="text-sm font-semibold">Обложка курса (миниатюра)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setThumbnailSource("url")}
                  disabled={isWorking}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${thumbnailSource === "url"
                      ? "border-amber-400 bg-amber-400/10 text-amber-600"
                      : "border-border hover:border-amber-400/50"
                    }`}
                >
                  <LinkIcon className="h-4 w-4" />
                  Ссылка URL
                </button>
                <button
                  type="button"
                  onClick={() => setThumbnailSource("file")}
                  disabled={isWorking}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${thumbnailSource === "file"
                      ? "border-amber-400 bg-amber-400/10 text-amber-600"
                      : "border-border hover:border-amber-400/50"
                    }`}
                >
                  <Upload className="h-4 w-4" />
                  Загрузить файл
                </button>
              </div>

              {thumbnailSource === "url" ? (
                <Input
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  disabled={isWorking}
                />
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setThumbnailDragOver(true); }}
                  onDragLeave={() => setThumbnailDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setThumbnailDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleThumbnailFileSelect(file);
                  }}
                  onClick={() => !isWorking && thumbnailInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${thumbnailDragOver ? "border-amber-400 bg-amber-400/10" :
                      thumbnailFile ? "border-emerald-400 bg-emerald-400/10" :
                        "border-border hover:border-amber-400/60"
                    } ${isWorking ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbnailFileSelect(f); }}
                    className="hidden"
                    disabled={isWorking}
                  />
                  {thumbnailFile && thumbnailPreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={thumbnailPreview}
                        alt="preview"
                        className="w-16 h-10 object-cover rounded border bg-muted shrink-0"
                      />
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-sm text-emerald-600 truncate">{thumbnailFile.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(thumbnailFile.size / 1024).toFixed(0)} KB · Будет автоматически конвертирована в WebP
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setThumbnailFile(null); if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview); setThumbnailPreview(null); }}
                        className="ml-auto text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <div className="font-semibold text-sm mb-1">Перетащите изображение сюда</div>
                      <div className="text-xs text-muted-foreground">или нажмите для выбора (JPG, PNG, WEBP...)</div>
                      <div className="text-xs text-muted-foreground mt-1 text-amber-600 font-medium">⚡ Автоматически конвертируется в WebP</div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Preview Video URL — visible to all visitors for free */}
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold">🎬 Ссылка на демо-видео (превью для всех посетителей)</label>
                <span className="text-xs text-amber-600 font-semibold bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">Бесплатный просмотр</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewVideoSource("url")}
                  disabled={isWorking}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${previewVideoSource === "url"
                      ? "border-amber-400 bg-amber-400/10 text-amber-600"
                      : "border-border hover:border-amber-400/50"
                    }`}
                >
                  <LinkIcon className="h-4 w-4" />
                  Ссылка
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewVideoSource("file")}
                  disabled={isWorking}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${previewVideoSource === "file"
                      ? "border-amber-400 bg-amber-400/10 text-amber-600"
                      : "border-border hover:border-amber-400/50"
                    }`}
                >
                  <Upload className="h-4 w-4" />
                  Загрузить файл
                </button>
              </div>
              {previewVideoSource === "url" ? (
                <Input
                  value={formData.previewVideoUrl}
                  onChange={(e) => setFormData({ ...formData, previewVideoUrl: e.target.value })}
                  placeholder="https://vimeo.com/... (ссылка на демо-видео)"
                  disabled={isWorking}
                />
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setPreviewVideoDragOver(true); }}
                  onDragLeave={() => setPreviewVideoDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setPreviewVideoDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith("video/")) {
                      setPreviewVideoFile(file);
                    } else {
                      toast({ title: "Только видеофайлы", variant: "destructive" });
                    }
                  }}
                  onClick={() => !isWorking && previewVideoInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${previewVideoDragOver ? "border-amber-400 bg-amber-400/10" :
                      previewVideoFile ? "border-emerald-400 bg-emerald-400/10" :
                        "border-border hover:border-amber-400/60"
                    } ${isWorking ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input
                    ref={previewVideoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreviewVideoFile(f); }}
                    className="hidden"
                    disabled={isWorking}
                  />
                  {previewVideoFile ? (
                    <div className="flex items-center gap-3">
                      <Film className="h-8 w-8 text-emerald-600 shrink-0" />
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-sm text-emerald-600 truncate">{previewVideoFile.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(previewVideoFile.size / (1024 * 1024)).toFixed(1)} MB
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setPreviewVideoFile(null); }}
                        className="ml-auto text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <div className="font-semibold text-sm mb-1">Перетащите демо-видео сюда</div>
                      <div className="text-xs text-muted-foreground">или нажмите для выбора с устройства (MP4, WEBM...)</div>
                    </>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Это видео будут видеть <strong>все посетители</strong> бесплатно. После покупки покупатель получает доступ к полному видео ниже.
              </p>
            </div>

            {/* Video source selector — full course video for buyers only */}
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold">🔒 Полный видеокурс <span className="text-red-500">*</span></label>
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded-full">Только для покупателей</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVideoSource("file")}
                  disabled={isWorking}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${videoSource === "file"
                      ? "border-amber-400 bg-amber-400/10 text-amber-600"
                      : "border-border hover:border-amber-400/50"
                    }`}
                >
                  <Upload className="h-4 w-4" />
                  Загрузить файл
                </button>
                <button
                  type="button"
                  onClick={() => setVideoSource("url")}
                  disabled={isWorking}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${videoSource === "url"
                      ? "border-amber-400 bg-amber-400/10 text-amber-600"
                      : "border-border hover:border-amber-400/50"
                    }`}
                >
                  <LinkIcon className="h-4 w-4" />
                  Ссылка на видео
                </button>
              </div>

              {videoSource === "file" ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => !isWorking && fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? "border-amber-400 bg-amber-400/10" :
                      selectedFile ? "border-emerald-400 bg-emerald-400/10" :
                        "border-border hover:border-amber-400/60"
                    } ${isWorking ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isWorking}
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      <div className="text-left">
                        <div className="font-semibold text-sm text-emerald-600">{selectedFile.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                      <div className="font-semibold text-sm mb-1">Перетащите видео сюда</div>
                      <div className="text-xs text-muted-foreground">или нажмите для выбора файла</div>
                      <div className="text-xs text-muted-foreground mt-2">MP4, MOV, AVI, MKV...</div>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid gap-2">
                  <Input
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://vimeo.com/... или https://youtube.com/..."
                    disabled={isWorking}
                  />
                  <p className="text-xs text-muted-foreground">
                    Вставьте прямую ссылку на видео. Файл не будет скачан — ссылка сохраняется как есть.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={resetDialog} disabled={isWorking}>Отмена</Button>
            <Button onClick={handleCreate} disabled={isWorking} className="min-w-[140px]">
              {isWorking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadStep === "uploading" ? `${uploadProgress}%` : "Загрузка..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Создать курс
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
