import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-md border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="text-6xl font-bold text-muted-foreground/30 mb-6">404</div>
          <h2 className="text-2xl font-bold mb-2">Страница не найдена</h2>
          <p className="text-muted-foreground mb-8">
            Возможно, она была удалена, либо вы перешли по неверной ссылке.
          </p>
          <Button size="lg" onClick={() => setLocation("/")}>
            На главную
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
