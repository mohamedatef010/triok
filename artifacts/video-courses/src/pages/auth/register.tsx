import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Film, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  email: z.string().email("Неверный формат email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

export function RegisterPage() {
  const [, setLocation] = useLocation();
  const { refetch } = useAuth();
  const registerMut = useRegister();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const res = await registerMut.mutateAsync({ data: values });
      localStorage.setItem("auth_token", res.token);
      await refetch();
      setLocation("/profile");
    } catch (err: any) {
      form.setError("root", { message: err.message || "Ошибка регистрации" });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-2">
            <Film className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Создать аккаунт</CardTitle>
          <CardDescription>
            Присоединяйтесь и начните обучаться видеомонтажу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ваше имя</FormLabel>
                    <FormControl>
                      <Input placeholder="Иван Иванов" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <div className="text-sm font-medium text-destructive mt-2 text-center">
                  {form.formState.errors.root.message}
                </div>
              )}
              <Button type="submit" className="w-full h-12 text-lg mt-6" disabled={registerMut.isPending}>
                {registerMut.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Зарегистрироваться
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center border-t p-6">
          <div className="text-sm text-muted-foreground text-center">
            Уже есть аккаунт?{" "}
            <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              Войти
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
