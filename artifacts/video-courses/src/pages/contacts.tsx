import { Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import authorAvatar from "@assets/author-avatar.jpg";

export function ContactsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Контакты</h1>
      
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        
        <div className="flex-1 space-y-6">
          <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Свяжитесь со мной</h2>
                <p className="text-muted-foreground">
                  Отвечаю на вопросы по курсам, принимаю заказы на монтаж и всегда открыт к сотрудничеству.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium mb-1">Телефон / Мессенджеры</div>
                    <a href="tel:+79787176674" className="text-xl font-bold hover:text-primary transition-colors">
                      +7 978 717-66-74
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium mb-1">E-mail</div>
                    <a href="mailto:magik.777@mail.ru" className="text-xl font-bold hover:text-primary transition-colors">
                      magik.777@mail.ru
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium mb-1">Локация</div>
                    <div className="text-lg font-medium">
                      Россия (Онлайн по всему миру)
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-1/3">
          <div className="bg-slate-950 text-white rounded-3xl p-8 relative overflow-hidden h-full flex flex-col justify-end">
            <img 
              src={authorAvatar} 
              alt="Автор" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
            
            <div className="relative z-10">
              <blockquote className="text-lg italic border-l-2 border-accent pl-4 mb-4 text-slate-200">
                "Всем доброго времени суток, занимаюсь видеомонтажом около 10 лет. 
                Готов смонтировать пробный ролик с ваших исходников до 5 мин. бесплатно)"
              </blockquote>
              <div className="font-bold text-accent">Основатель платформы</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
