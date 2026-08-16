import { useSEO } from "@/hooks/use-seo";
import { Link } from "wouter";
import { ShieldCheck, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export function TermsPage() {
  const { data: requisitesData } = useQuery({
    queryKey: ["site-settings", "site_requisites"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings/site_requisites");
      if (!res.ok) return null;
      const json = await res.json();
      return json?.value;
    },
    retry: false,
  });

  const phone = requisitesData?.phone || "+7 978 717-66-74";
  const phoneHref = `tel:${phone.replace(/\s+/g, '')}`;
  useSEO({
    title: "Публичная оферта и условия предоставления услуг",
    description: "Договор публичной оферты на приобретение доступа к цифровым обучающим видеокурсам на платформе Классный Фокус.",
    canonical: "/terms",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Публичная оферта — Классный Фокус",
      "description": "Условия публичного договора-оферты на предоставление доступа к цифровым видеокурсам.",
      "url": "https://xn----7sb1acdcpkxafxk9g.xn--p1ai/terms"
    }
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 flex-1">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-4 border border-amber-400/20">
          <FileText className="h-3.5 w-3.5" />
          Юридический документ
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
          Публичная оферта
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto text-sm sm:text-base">
          Договор-оферта на предоставление электронного доступа к цифровым образовательным материалам и видеокурсам на платформе «Классный Фокус»
        </p>
      </div>

      <div className="space-y-10 text-foreground/90 leading-relaxed bg-card p-6 sm:p-10 rounded-3xl border shadow-sm">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">1. Общие положения</h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            1.1. Настоящий документ в соответствии со статьей 437 Гражданского кодекса Российской Федерации (ГК РФ) является официальным публичным предложением (публичной офертой) самозанятого гражданина РФ <strong>Берестнева Максима Геннадьевича</strong> (ИНН 482506027919), именуемого в дальнейшем «Исполнитель», адресованным любому дееспособному физическому лицу, именуемому в дальнейшем «Пользователь» или «Заказчик».
          </p>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            1.2. Полным и безоговорочным принятием (акцептом) настоящей публичной оферты в соответствии со статьей 438 ГК РФ признается совершение Пользователем любого из действий: регистрация на сайте, оформление заказа или оплата выбранного видеокурса на сайте <strong>классный-фокус.рф</strong>.
          </p>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            1.3. Осуществляя акцепт оферты, Пользователь подтверждает, что ознакомлен и полностью согласен со всеми условиями настоящего Договора, а также с Политикой обработки персональных данных.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/60 pt-8">
          <h2 className="text-xl font-bold text-foreground">2. Предмет оферты</h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            2.1. Исполнитель обязуется предоставить Пользователю платный неисключительный электронный доступ к обучающим цифровым видеоматериалам (видеокурсам, видеоурокам и практическим разборам фокусов), размещённым на сайте, а Пользователь обязуется оплатить данный доступ в порядке и на условиях, установленных настоящей Офертой.
          </p>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            2.2. Обучающие материалы являются 100% цифровым товаром. Физическая доставка материальных носителей не осуществляется.
          </p>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            2.3. Доступ к приобретённым материалам предоставляется в Личном кабинете Пользователя на сайте для индивидуального просмотра в режиме онлайн.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/60 pt-8">
          <h2 className="text-xl font-bold text-foreground">3. Порядок оформления заказа и предоставления доступа</h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            3.1. Пользователь самостоятельно знакомится с описанием, программой и стоимостью видеокурсов в каталоге сайта и оформляет заказ через интерфейс корзины / страницы курса.
          </p>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            3.2. Доступ к видеоматериалам открывается автоматически в Личном кабинете Пользователя в течение <strong>1–5 минут</strong> после подтверждения успешного зачисления оплаты от платёжной системы.
          </p>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            3.3. В случае задержки активации по техническим причинам Пользователь может обратиться в службу поддержки по адресу <a href="mailto:cool-trick@mail.ru" className="text-primary font-bold hover:underline">cool-trick@mail.ru</a>.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/60 pt-8">
          <h2 className="text-xl font-bold text-foreground">4. Стоимость и порядок расчетов</h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            4.1. Стоимость видеокурсов указывается в рублях РФ (₽) на соответствующих страницах каталога и включает все применимые налоги.
          </p>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            4.2. Оплата производится в безналичном порядке через сервис интернет-эквайринга <strong>ЮKassa</strong>. Принимаются банковские карты (МИР, Visa, MasterCard), Система быстрых платежей (СБП) и иные способы, доступные в платёжном шлюзе.
          </p>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            4.3. Исполнитель не собирает и не хранит полные реквизиты банковских карт Пользователя. Безопасность обработки платежей обеспечивается сертифицированным платёжным шлюзом ЮKassa по стандарту PCI DSS.
          </p>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            4.4. Моментом оплаты считается момент поступления подтверждения от платёжной системы о совершении операции.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/60 pt-8">
          <h2 className="text-xl font-bold text-foreground">5. Интеллектуальная собственность</h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            5.1. Все видеокурсы, текстовые описания, методики, графика и дизайн сайта являются объектами интеллектуальной собственности Исполнителя и защищены законодательством РФ об авторском праве.
          </p>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            5.2. Пользователю предоставляется право личного некоммерческого просмотра материалов. Запрещается копирование, запись экрана, распространение, передача логина и пароля третьим лицам, публичный показ или перепродажа курсов.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/60 pt-8">
          <h2 className="text-xl font-bold text-foreground">6. Условия возврата и гарантии</h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            6.1. В соответствии с законодательством РФ, приобретение доступа к цифровому контенту надлежащего качества не подлежит возврату после предоставления фактического доступа в Личном кабинете, если иное не установлено соглашением сторон.
          </p>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            6.2. Если по технической вине Исполнителя доступ к оплаченному курсу не был предоставлен и проблема не была устранена в разумный срок, Пользователь вправе потребовать возврата денежных средств.
          </p>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            6.3. Заявление о возврате направляется на email: <a href="mailto:cool-trick@mail.ru" className="text-primary font-bold hover:underline">cool-trick@mail.ru</a> с указанием номера заказа, даты оплаты и описания проблемы. Возврат осуществляется тем же способом, которым была произведена оплата.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/60 pt-8">
          <h2 className="text-xl font-bold text-foreground">7. Конфиденциальность и персональные данные</h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            7.1. Обработка персональных данных Пользователя (ФИО, Email, телефон) осуществляется исключительно в целях исполнения настоящего Договора в соответствии с Федеральным законом № 152-ФЗ «О персональных данных».
          </p>
        </section>

        <section className="space-y-4 border-t border-border/60 pt-8">
          <h2 className="text-xl font-bold text-foreground">8. Реквизиты и контакты Исполнителя</h2>
          <div className="p-6 rounded-2xl bg-muted/40 border text-sm space-y-2">
            <div><strong>Исполнитель:</strong> Берестнев Максим Геннадьевич</div>
            <div><strong>Статус:</strong> Плательщик налога на профессиональный доход (Самозанятый)</div>
            <div><strong>ИНН:</strong> 482506027919</div>
            <div><strong>Телефон:</strong> <a href={phoneHref} className="hover:underline text-foreground font-bold">{phone}</a></div>
            <div><strong>Email:</strong> <a href="mailto:cool-trick@mail.ru" className="hover:underline text-primary font-bold">cool-trick@mail.ru</a></div>
            <div><strong>Сайт:</strong> классный-фокус.рф</div>
            <div><strong>Служба поддержки:</strong> <a href="mailto:magik.777@mail.ru" className="hover:underline text-primary font-bold">magik.777@mail.ru</a></div>
          </div>
        </section>
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <Button variant="outline" className="rounded-2xl font-bold px-6" asChild>
          <Link href="/requisites">
            Смотреть реквизиты
          </Link>
        </Button>
        <Button variant="outline" className="rounded-2xl font-bold px-6" asChild>
          <Link href="/delivery">
            Получение цифрового товара
          </Link>
        </Button>
      </div>
    </div>
  );
}
