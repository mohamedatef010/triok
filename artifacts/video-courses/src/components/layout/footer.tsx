import { Link } from "wouter";
import { Film, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-200 py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Brand */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <Film className="h-6 w-6 text-accent" />
            <span>ВИДЕОМОНТАЖ</span>
          </Link>
          <p className="text-sm text-slate-400">
            Профессиональные онлайн-курсы по видеомонтажу. Обучайтесь искусству создавать захватывающие видео.
          </p>
        </div>

        {/* Links */}
        <div className="space-y-4">
          <h4 className="font-semibold text-white">Навигация</h4>
          <nav className="flex flex-col gap-2 text-sm text-slate-400">
            <Link href="/catalog" className="hover:text-accent transition-colors">Каталог курсов</Link>
            <Link href="/#about" className="hover:text-accent transition-colors">О компании</Link>
            <Link href="/compare" className="hover:text-accent transition-colors">Сравнение</Link>
          </nav>
        </div>

        {/* Support */}
        <div className="space-y-4">
          <h4 className="font-semibold text-white">Помощь</h4>
          <nav className="flex flex-col gap-2 text-sm text-slate-400">
            <Link href="/help" className="hover:text-accent transition-colors">Доставка и оплата</Link>
            <Link href="/help" className="hover:text-accent transition-colors">Обмен и возврат</Link>
            <Link href="/help" className="hover:text-accent transition-colors">Пользовательское соглашение</Link>
            <Link href="/help" className="hover:text-accent transition-colors">Оферта</Link>
          </nav>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h4 className="font-semibold text-white">Контакты</h4>
          <div className="flex flex-col gap-3 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-accent" />
              <a href="tel:+79787176674" className="hover:text-white transition-colors">+7 978 717-66-74</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent" />
              <a href="mailto:magik.777@mail.ru" className="hover:text-white transition-colors">magik.777@mail.ru</a>
            </div>
          </div>
        </div>

      </div>
      
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-sm text-slate-500 text-center">
        &copy; {new Date().getFullYear()} ВИДЕОМОНТАЖ. Все права защищены.
      </div>
    </footer>
  );
}
