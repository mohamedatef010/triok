import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Film, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(1, "Введите пароль"),
});

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { refetch } = useAuth();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const res = await loginMutation.mutateAsync({ data: values });
      localStorage.setItem("auth_token", res.token);
      await refetch();
      
      // Handle redirect
      const url = new URL(window.location.href);
      const redirect = url.searchParams.get("redirect") || "/profile";
      setLocation(redirect);
    } catch (err: any) {
      form.setError("root", { message: err.message || "Неверный email или пароль" });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-2">
            <Film className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">С возвращением</CardTitle>
          <CardDescription>
            Войдите в аккаунт, чтобы продолжить обучение
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Button type="submit" className="w-full h-12 text-lg mt-6" disabled={loginMutation.isPending}>
                {loginMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Войти
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center border-t p-6">
          <div className="text-sm text-muted-foreground text-center">
            Нет аккаунта?{" "}
            <Link href="/auth/register" className="font-semibold text-primary hover:underline">
              Зарегистрироваться
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
