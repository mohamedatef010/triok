import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Помощь и информация</h1>
      
      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1" className="border-b-0 bg-card rounded-2xl mb-4 px-6 shadow-sm">
          <AccordionTrigger className="hover:no-underline text-lg font-semibold py-6">
            Доставка
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
            Поскольку мы предоставляем цифровые продукты (онлайн-курсы и уроки по видеомонтажу), физическая доставка не осуществляется. Сразу после успешной оплаты вы получаете бессрочный доступ к материалам курса в вашем Личном кабинете на сайте. Все видео можно смотреть онлайн с любого устройства.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="border-b-0 bg-card rounded-2xl mb-4 px-6 shadow-sm">
          <AccordionTrigger className="hover:no-underline text-lg font-semibold py-6">
            Оплата
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
            Оплатить доступ к курсам можно двумя удобными способами:
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>ЮKassa:</strong> банковские карты (Visa, Mastercard, МИР), электронные кошельки и другие популярные способы.</li>
              <li><strong>СБП (Система быстрых платежей):</strong> моментальная оплата по QR-коду через приложение вашего банка без ввода реквизитов карты.</li>
            </ul>
            Все платежи проходят через защищенные шлюзы партнеров, мы не храним данные ваших карт.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3" className="border-b-0 bg-card rounded-2xl mb-4 px-6 shadow-sm">
          <AccordionTrigger className="hover:no-underline text-lg font-semibold py-6">
            Обмен и возврат
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
            В соответствии с законодательством о цифровых товарах, доступ к обучающим материалам предоставляется "как есть". 
            Если по техническим причинам вы не можете получить доступ к оплаченному курсу, свяжитесь с поддержкой в течение 14 дней с момента оплаты для решения проблемы или возврата средств. 
            Возврат по причинам "не понравилось" или "передумал" не предусмотрен, поэтому мы рекомендуем воспользоваться опцией "Первый монтаж бесплатно" или посмотреть демо-версию, чтобы оценить качество материалов.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4" className="border-b-0 bg-card rounded-2xl mb-4 px-6 shadow-sm">
          <AccordionTrigger className="hover:no-underline text-lg font-semibold py-6">
            Оферта
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
            Данный документ является публичной офертой. Оплачивая услуги на сайте, вы безоговорочно соглашаетесь с условиями предоставления доступа к цифровому контенту. 
            Полный текст оферты предоставляется по запросу или доступен при оформлении заказа. Мы оставляем за собой право вносить изменения в программу курсов в целях ее актуализации.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5" className="border-b-0 bg-card rounded-2xl mb-4 px-6 shadow-sm">
          <AccordionTrigger className="hover:no-underline text-lg font-semibold py-6">
            Пользовательское соглашение
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
            Пользователь обязуется использовать материалы платформы исключительно в личных целях. Запрещается копирование, распространение, перепродажа или передача доступов третьим лицам. 
            При выявлении фактов пиратства аккаунт нарушителя блокируется без права восстановления и возврата средств.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
