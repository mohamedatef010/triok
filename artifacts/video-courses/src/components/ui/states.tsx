import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingSpinner({ className }: { className?: string } = {}) {
  return (
    <div className={`flex items-center justify-center ${className ? "" : "p-8"}`}>
      <div className={`animate-spin rounded-full border-b-2 border-primary ${className || "h-8 w-8"}`}></div>
    </div>
  );
}


export function ErrorState({ error, retry }: { error?: unknown; retry?: () => void }) {
  return (
    <Card className="border-destructive/50 bg-destructive/5 my-8">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Произошла ошибка</h3>
        <p className="text-muted-foreground mb-6">
          {error instanceof Error ? error.message : "Не удалось загрузить данные"}
        </p>
        {retry && (
          <Button variant="outline" onClick={retry}>Повторить попытку</Button>
        )}
      </CardContent>
    </Card>
  );
}

export function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-5 w-3/4 mt-2" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex justify-between items-center mt-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
