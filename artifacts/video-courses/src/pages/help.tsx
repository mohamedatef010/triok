import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSEO } from "@/hooks/use-seo";
import { useQuery } from "@tanstack/react-query";

export function HelpPage() {
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

  const phone = requisitesData?.phone || "Не указан";
  const phoneHref = phone && phone !== "Не указан" ? `tel:${phone.replace(/\s+/g, '')}` : undefined;
  const email = requisitesData?.email || "Не указан";
  const emailHref = email && email !== "Не указан" ? `mailto:${email}` : undefined;
  useSEO({
    title: "Помощь и информация",
    description: "Ответы на вопросы об оплате, доступе к курсам, возврате средств и использовании учебных материалов на платформе Классный Фокус.",
    canonical: "/help",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Как получить доступ к курсу?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "После успешной оплаты выбранного курса доступ к учебным материалам предоставляется в вашем Личном кабинете на сайте. Вы сможете просматривать видеоуроки и другие материалы курса онлайн с компьютера, планшета или мобильного устройства."
          }
        },
        {
          "@type": "Question",
          "name": "Как можно оплатить курс?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Оплата курса осуществляется онлайн через защищённую платёжную систему ЮKassa. Вы можете использовать банковскую карту или другие способы, предоставляемые платёжной системой."
          }
        },
        {
          "@type": "Question",
          "name": "Как я получу купленный курс?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Курсы и уроки являются цифровыми образовательными материалами, физическая доставка не осуществляется. После подтверждения оплаты доступ к приобретённому курсу предоставляется в Личном кабинете пользователя."
          }
        },
        {
          "@type": "Question",
          "name": "Возврат денежных средств",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Если после оплаты по техническим причинам доступ к приобретённому курсу не был предоставлен, пожалуйста, свяжитесь с нами. Каждое обращение рассматривается индивидуально."
          }
        },
        {
          "@type": "Question",
          "name": "Если у меня возникла проблема с доступом",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Если после оплаты вы не видите приобретённый курс в Личном кабинете или столкнулись с технической проблемой, свяжитесь с поддержкой по электронной почте: cool-trick@mail.ru"
          }
        }
      ]
    }
  });

  return (

    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Помощь и информация
        </h1>

        <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Здесь вы найдёте ответы на основные вопросы об обучении,
          оплате, доступе к курсам и использовании материалов сайта.
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        className="w-full"
        defaultValue="item-1"
      >
        {/* Доступ к курсам */}
        <AccordionItem
          value="item-1"
          className="border-b-0 bg-card rounded-2xl mb-4 px-6 shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline text-lg font-semibold py-6">
            Как получить доступ к курсу?
          </AccordionTrigger>

          <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
            После успешной оплаты выбранного курса доступ к учебным материалам
            предоставляется в вашем Личном кабинете на сайте. Вы сможете
            просматривать видеоуроки и другие материалы курса онлайн с
            компьютера, планшета или мобильного устройства.
          </AccordionContent>
        </AccordionItem>

        {/* Оплата */}
        <AccordionItem
          value="item-2"
          className="border-b-0 bg-card rounded-2xl mb-4 px-6 shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline text-lg font-semibold py-6">
            Как можно оплатить курс?
          </AccordionTrigger>

          <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
            Оплата курса осуществляется онлайн через защищённую платёжную
            систему ЮKassa. В зависимости от доступных способов оплаты вы
            можете использовать банковскую карту или другие способы,
            предоставляемые платёжной системой.
            <br />
            <br />
            Данные банковской карты обрабатываются платёжной системой и не
            передаются нам в полном виде. Мы не храним данные банковских карт
            пользователей на своих серверах.
          </AccordionContent>
        </AccordionItem>

        {/* Получение цифрового продукта */}
        <AccordionItem
          value="item-3"
          className="border-b-0 bg-card rounded-2xl mb-4 px-6 shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline text-lg font-semibold py-6">
            Как я получу купленный курс?
          </AccordionTrigger>

          <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
            Курсы и уроки являются цифровыми образовательными материалами,
            поэтому физическая доставка не осуществляется.
            <br />
            <br />
            После подтверждения оплаты доступ к приобретённому курсу
            предоставляется в Личном кабинете пользователя. Вы сможете
            открыть курс и начать обучение непосредственно на сайте.
          </AccordionContent>
        </AccordionItem>

        {/* Возврат */}
        <AccordionItem
          value="item-4"
          className="border-b-0 bg-card rounded-2xl mb-4 px-6 shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline text-lg font-semibold py-6">
            Возврат денежных средств
          </AccordionTrigger>

          <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
            Если после оплаты по техническим причинам доступ к приобретённому
            курсу не был предоставлен или возникла проблема с доступом к
            материалам, пожалуйста, свяжитесь с нами по контактным данным,
            указанным на сайте.
            <br />
            <br />
            Каждое обращение рассматривается индивидуально в соответствии с
            условиями публичной оферты и применимым законодательством
            Российской Федерации.
            <br />
            <br />
            Для решения вопроса, пожалуйста, укажите адрес электронной почты,
            использованный при регистрации, и информацию о совершённом
            платеже.
          </AccordionContent>
        </AccordionItem>

        {/* Оферта */}
        <AccordionItem
          value="item-5"
          className="border-b-0 bg-card rounded-2xl mb-4 px-6 shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline text-lg font-semibold py-6">
            Публичная оферта и договор
          </AccordionTrigger>

          <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
            Приобретая курс или другой цифровой образовательный материал на
            сайте, пользователь знакомится и соглашается с условиями
            предоставления доступа к приобретённому контенту.
            <br />
            <br />
            Условия покупки, оплаты, предоставления доступа, использования
            материалов и другие существенные условия изложены в{" "}
            <a href="/terms" className="text-primary font-bold hover:underline">
              Публичной оферте
            </a>.
          </AccordionContent>
        </AccordionItem>

        {/* Пользовательское соглашение */}
        <AccordionItem
          value="item-6"
          className="border-b-0 bg-card rounded-2xl mb-4 px-6 shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline text-lg font-semibold py-6">
            Пользовательское соглашение и правила доступа
          </AccordionTrigger>

          <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
            Пользователь обязуется использовать сайт и приобретённые
            образовательные материалы только в соответствии с их назначением.
            <br />
            <br />
            Подробный порядок активации и предоставления доступа описан на странице{" "}
            <a href="/delivery" className="text-primary font-bold hover:underline">
              Получение цифрового товара
            </a>.
          </AccordionContent>
        </AccordionItem>

        {/* Поддержка */}
        <AccordionItem
          value="item-7"
          className="border-b-0 bg-card rounded-2xl mb-4 px-6 shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline text-lg font-semibold py-6">
            Если у меня возникла проблема с доступом
          </AccordionTrigger>

          <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
            Если после оплаты вы не видите приобретённый курс в Личном
            кабинете или столкнулись с технической проблемой, свяжитесь со
            службой поддержки:
            <br />
            <br />
            <div className="flex flex-wrap gap-4 font-bold">
              {emailHref ? (
                <a
                  href={emailHref}
                  className="text-primary hover:underline"
                >
                  Email: {email}
                </a>
              ) : (
                <span className="text-muted-foreground font-semibold">Email: {email}</span>
              )}
              {phoneHref ? (
                <a
                  href={phoneHref}
                  className="text-foreground hover:text-primary hover:underline"
                >
                  Тел: {phone}
                </a>
              ) : (
                <span className="text-muted-foreground font-semibold">Тел: {phone}</span>
              )}
            </div>
            <br />
            В обращении укажите ваш email при регистрации и номер заказа. 
            Также вы можете ознакомиться с нашими юридическими данными на странице{" "}
            <a href="/requisites" className="text-primary font-bold hover:underline">
              Реквизиты
            </a>.
          </AccordionContent>
        </AccordionItem>

        {/* Авторские права */}
        <AccordionItem
          value="item-8"
          className="border-b-0 bg-card rounded-2xl mb-4 px-6 shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline text-lg font-semibold py-6">
            Использование учебных материалов и авторские права
          </AccordionTrigger>

          <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
            Все видеоуроки, изображения, тексты, методические материалы и
            другие элементы курсов предназначены исключительно для личного некоммерческого обучения
            пользователя.
            <br />
            <br />
            Запрещается размещать материалы в открытом доступе, копировать и
            распространять их, передавать доступ к аккаунту другим лицам или
            использовать приобретённый контент для коммерческого
            распространения.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-10 text-center text-sm text-muted-foreground">
        Если вы не нашли ответ на свой вопрос, свяжитесь с нами по электронной почте{" "}
        {emailHref ? (
          <a
            href={emailHref}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {email}
          </a>
        ) : (
          <span className="font-medium text-foreground">{email}</span>
        )}
        {" "}или по телефону{" "}
        {phoneHref ? (
          <a
            href={phoneHref}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {phone}
          </a>
        ) : (
          <span className="font-medium text-foreground">{phone}</span>
        )}
        .
      </div>
    </div>
  );
}