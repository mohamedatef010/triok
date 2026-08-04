import { Link } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { 
  Menu, 
  Search, 
  Heart, 
  ShoppingCart, 
  User, 
  Sun, 
  Moon,
  Film,
  LogOut,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const cart = useCart();
  const favs = useFavorites();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* Left: Mobile Menu & Desktop Logo */}
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left font-bold flex items-center gap-2">
                  <Film className="h-5 w-5" /> ВИДЕОМОНТАЖ
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-4">
                <Link href="/catalog" className="text-lg font-medium">Каталог</Link>
                <Link href="/#about" className="text-lg font-medium">О компании</Link>
                <Link href="/compare" className="text-lg font-medium">Сравнение</Link>
                <Link href="/help" className="text-lg font-medium">Помощь и информация</Link>
                <Link href="/contacts" className="text-lg font-medium">Контакты</Link>
                <div className="my-2 border-t" />
                {isAuthenticated ? (
                  <>
                    <Link href="/profile" className="text-lg font-medium">Личный кабинет</Link>
                    <Link href="/cart" className="text-lg font-medium">Корзина</Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="text-lg font-medium">Войти</Link>
                    <Link href="/auth/register" className="text-lg font-medium">Регистрация</Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop Links (Optional if we just want Logo left) */}
          <Link href="/" className="hidden md:flex items-center gap-2 font-bold text-xl tracking-tight">
            <Film className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ВИДЕОМОНТАЖ</span>
          </Link>
        </div>

        {/* Center: Mobile Logo */}
        <Link href="/" className="flex md:hidden items-center gap-2 font-bold text-lg tracking-tight absolute left-1/2 -translate-x-1/2">
          <Film className="h-5 w-5 text-primary" />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ВИДЕОМОНТАЖ</span>
        </Link>

        {/* Right: Icons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Search className="h-5 w-5" />
            <span className="sr-only">Поиск</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Тема</span>
          </Button>

          <Link href="/favorites">
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" />
              {favs.count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {favs.count}
                </span>
              )}
            </Button>
          </Link>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cart.count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cart.count}
                </span>
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user?.name && <p className="font-medium">{user.name}</p>}
                      {user?.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" /> Личный кабинет
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admm/dashboard" className="w-full flex items-center cursor-pointer text-primary">
                        <Settings className="mr-2 h-4 w-4" /> Админ-панель
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onSelect={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" /> Выйти
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/login" className="w-full cursor-pointer">Войти</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/register" className="w-full cursor-pointer">Регистрация</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admm" className="w-full text-muted-foreground cursor-pointer text-xs">Вход для администратора</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  );
}
