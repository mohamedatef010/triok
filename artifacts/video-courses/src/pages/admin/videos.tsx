import { useState, useRef, useCallback } from "react";
import { useSEO } from "@/hooks/use-seo";
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

  // --- Category state ---
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("none");
  const [newCategoryName, setNewCategoryName] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    discountPrice: "",
    thumbnailUrl: "",
    description: "",
    previewDurationSeconds: "",
    videoUrl: "",
  });

  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  // --- Handlers ---
  const resetDialog = () => {
    setFormData({ title: "", price: "", discountPrice: "", thumbnailUrl: "", description: "", previewDurationSeconds: "", videoUrl: "" });
    setSelectedFile(null);
    setThumbnailFile(null);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    setThumbnailSource("url");
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
    refetch();
    toast({ title: "Курс удалён" });
  };

  const handleDiscount = async (id: number) => {
    const val = prompt("Введите новую цену со скидкой (или пустое для отмены скидки):");
    if (val === null) return;
    const dp = val ? Number(val) : null;
    await discountMut.mutateAsync({ id, data: { discountPrice: dp } });
    refetch();
    toast({ title: dp ? `Скидка установлена: ${dp} ₽` : "Скидка убрана" });
  };

  const handlePreviewDuration = async (id: number) => {
    const val = prompt("Длительность превью (секунды). Оставьте пустым для авто (20% видео):");
    if (val === null) return;
    const dp = val ? Number(val) : null;
    await updateMut.mutateAsync({ id, data: { previewDurationSeconds: dp } });
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

        // Get presigned upload URL from server (key ends with .webp)
        const imgRes = await fetch("/api/admin/upload-image-url", {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("admin_token") || localStorage.getItem("auth_token")}` },
        });
        if (!imgRes.ok) throw new Error("Не удалось получить ссылку для загрузки изображения");
        const { uploadUrl, url: publicUrl } = await imgRes.json() as { uploadUrl: string; url: string; key: string };

        // Upload WebP blob directly to S3 via presigned URL
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/webp" },
          body: webpBlob,
        });
        if (!uploadRes.ok) throw new Error("Ошибка загрузки миниатюры");

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

      const video = await createMut.mutateAsync({
        data: {
          title: formData.title,
          price: Number(formData.price),
          discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
          thumbnailUrl: resolvedThumbnailUrl,
          description: formData.description || undefined,
          previewDurationSeconds: formData.previewDurationSeconds ? Number(formData.previewDurationSeconds) : undefined,
          categoryId: resolvedCategoryId,
          isPublished: true,
          isFeatured: true,
          // If URL-based, set directly
          videoUrl: videoSource === "url" ? formData.videoUrl : undefined,
        }
      });

      if (videoSource === "url") {
        // URL source: no upload needed, just save and done
        setUploadStep("done");
        toast({ title: "✅ Курс создан с видео-ссылкой!", description: video.title });
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Видео и курсы</h1>
        <Button onClick={() => setIsOpen(true)} size="sm" className="shrink-0">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Добавить курс</span>
        </Button>
      </div>

      <div className="bg-white dark:bg-card border rounded-xl overflow-hidden shadow-sm overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead>Скидка</TableHead>
              <TableHead>Превью (сек)</TableHead>
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
                <TableCell>{(v as any).previewDurationSeconds || "Авто"}</TableCell>
                <TableCell>{v.viewCount}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handlePreviewDuration(v.id)} title="Длительность превью">
                      <Clock className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDiscount(v.id)} title="Скидка">
                      <Percent className="h-4 w-4" />
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
                  placeholder="4900"
                  disabled={isWorking}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Скидочная цена ₽</label>
                <Input
                  type="number"
                  value={formData.discountPrice}
                  onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                  placeholder="2900"
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

            {/* Video source selector */}
            <div className="grid gap-3">
              <label className="text-sm font-semibold">Видеофайл <span className="text-red-500">*</span></label>
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
