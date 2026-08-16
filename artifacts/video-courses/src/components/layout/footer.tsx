import { Link } from "wouter";
import { Phone, Mail, Send, MessageCircle, ShieldCheck } from "lucide-react";
import { LogoWordmark } from "@/components/logo";
import { useQuery } from "@tanstack/react-query";

// Fetch author section settings
function useSocialLinks() {
  return useQuery({
    queryKey: ["site-settings", "author_section"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings/author_section");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      return json.value;
    },
    retry: false,
  });
}

// Fetch requisites (phone set by admin in Реквизиты продавца)
function useRequisitesPhone() {
  return useQuery({
    queryKey: ["site-settings", "site_requisites"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings/site_requisites");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      return json?.value;
    },
    retry: false,
  });
}

export function Footer() {
  const { data, isLoading } = useSocialLinks();
  const { data: reqData, isLoading: reqLoading } = useRequisitesPhone();
  const socialLinks = (!isLoading && data?.socialLinks) ? data.socialLinks : {};
  
  // Real contact information — prefer phone from Реквизиты продавца (site_requisites)
  const rawPhone = (!reqLoading && reqData?.phone)
    ? reqData.phone
    : (!isLoading && data?.phone) ? data.phone : "+7 978 717-66-74";
  const phone = rawPhone;
  const phoneHref = rawPhone && rawPhone !== "+7 978 717-66-74"
    ? `tel:${rawPhone.replace(/\s+/g, '')}`
    : (!isLoading && data?.phone)
      ? `tel:${data.phone.replace(/\s+/g, '')}`
      : "tel:+79787176674";
  
  const email = (!isLoading && data?.email) 
    ? data.email 
    : (!isLoading && socialLinks.mailru)
      ? socialLinks.mailru.replace('mailto:', '')
      : "cool-trick@mail.ru";
  const emailHref = (!isLoading && data?.email)
    ? `mailto:${data.email}`
    : (!isLoading && socialLinks.mailru)
      ? socialLinks.mailru
      : "mailto:cool-trick@mail.ru";

  return (
    <footer className="bg-slate-950 text-slate-200 pt-16 pb-12 border-t border-slate-800">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        
        {/* Brand */}
        <div className="space-y-4 flex flex-col items-center md:items-start text-center md:text-left">
          <Link href="/">
            <LogoWordmark className="text-white" />
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed pt-2">
            Профессиональные онлайн-курсы по фокусам и иллюзионному искусству. Учитесь удивлять — пошаговые видеоуроки от профессионального фокусника Максима Берестнева.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Безопасная оплата через ЮKassa</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-4">
          <h4 className="font-extrabold text-white text-base tracking-tight">Навигация</h4>
          <nav className="flex flex-col gap-2.5 text-sm text-slate-400 font-medium">
            <Link href="/catalog" className="hover:text-amber-400 transition-colors">Каталог курсов</Link>
            <Link href="/contacts" className="hover:text-amber-400 transition-colors">Контакты</Link>
            <Link href="/compare" className="hover:text-amber-400 transition-colors">Сравнение курсов</Link>
            <Link href="/favorites" className="hover:text-amber-400 transition-colors">Избранное</Link>
          </nav>
        </div>

        {/* Legal & Info */}
        <div className="space-y-4">
          <h4 className="font-extrabold text-white text-base tracking-tight">Информация</h4>
          <nav className="flex flex-col gap-2.5 text-sm text-slate-400 font-medium">
            <Link href="/terms" className="hover:text-amber-400 transition-colors">Публичная оферта</Link>
            <Link href="/delivery" className="hover:text-amber-400 transition-colors">Получение цифрового товара</Link>
            <Link href="/requisites" className="hover:text-amber-400 transition-colors">Реквизиты</Link>
            <Link href="/help" className="hover:text-amber-400 transition-colors">Помощь и возврат</Link>
          </nav>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h4 className="font-extrabold text-white text-base tracking-tight">Контакты</h4>
          <div className="flex flex-col gap-3.5 text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-amber-400" />
              </div>
              <a href={phoneHref} className="font-bold hover:text-amber-400 transition-colors">{phone}</a>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-cyan-400" />
              </div>
              <a href={emailHref} className="font-medium hover:text-cyan-400 transition-colors">{email}</a>
            </div>

            {/* Dynamic Social Links from CMS */}
            {!isLoading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {socialLinks.telegram && (
                  <a
                    href={socialLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Telegram"
                    className="h-9 w-9 rounded-xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center hover:bg-sky-400/20 hover:border-sky-400/40 transition-colors"
                  >
                    <Send className="h-4 w-4 text-sky-400" />
                  </a>
                )}
                {socialLinks.whatsapp && (
                  <a
                    href={socialLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp"
                    className="h-9 w-9 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center hover:bg-emerald-400/20 hover:border-emerald-400/40 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Instagram"
                    className="h-9 w-9 rounded-xl bg-pink-400/10 border border-pink-400/20 flex items-center justify-center hover:bg-pink-400/20 hover:border-pink-400/40 transition-colors"
                  >
                    <svg className="h-4 w-4 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.vk && (
                  <a
                    href={socialLinks.vk}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="VKontakte"
                    className="h-9 w-9 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center hover:bg-blue-400/20 hover:border-blue-400/40 transition-colors"
                  >
                    <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1.01-1.49-.946-1.49.302v1.411H12.1s.041-.037 0 0c-3.086 0-6.218-1.88-6.218-6.49 0 0-.037-1.492.663-1.544h1.72c.66 0 .895.303 1.07.688.657 1.568 1.977 2.698 2.45 2.698.22 0 .33-.1.33-.638v-2.49c-.066-.918-.537-.999-.537-.999h2.87s1.463-.087 1.463 1.356v2.47c0 .52.22.686.373.686.44 0 1.43-1.136 1.936-2.773.174-.495.353-1.024.537-1.542.147-.412.46-.617.847-.617h1.77c.604 0 .734.32.604.816-.22.907-2.307 3.948-2.307 3.948-.175.285-.24.418 0 .74.175.235 1.51 1.445 1.51 1.445.933.89 1.63 1.64 1.63 2.117 0 .47-.24.7-.77.7z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.mailru && (
                  <a
                    href={socialLinks.mailru}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Mail.ru"
                    className="h-9 w-9 rounded-xl bg-orange-400/10 border border-orange-400/20 flex items-center justify-center hover:bg-orange-400/20 hover:border-orange-400/40 transition-colors"
                  >
                    <Mail className="h-4 w-4 text-orange-400" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
      
      <div className="container mx-auto px-4 mt-14 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div className="text-center sm:text-left">
          &copy; {new Date().getFullYear()} Максим Берестнев. Все права защищены.
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-slate-400">
          <Link href="/terms" className="hover:text-amber-400 transition-colors">Публичная оферта</Link>
          <Link href="/delivery" className="hover:text-amber-400 transition-colors">Получение цифрового товара</Link>
          <Link href="/requisites" className="hover:text-amber-400 transition-colors">Реквизиты</Link>
          <Link href="/help" className="hover:text-amber-400 transition-colors">Помощь</Link>
        </div>
      </div>
    </footer>
  );
}