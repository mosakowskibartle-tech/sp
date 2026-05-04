import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-sp-darkest border-t border-white/5 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & About */}
          <div>
            <div className="font-display text-2xl text-sp-orange font-bold mb-2">Соль&nbsp;&amp;&nbsp;Перец</div>
            <p className="text-sp-cream/50 text-sm leading-relaxed mb-4">
              Домашняя кухня и уютная атмосфера в самом сердце Сходни.
            </p>
            <a href="tel:+79257677778" className="inline-flex items-center gap-2 text-sp-orange text-sm font-medium hover:underline transition-colors">
              <Phone size={14} /> +7 (925) 767-77-78
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sp-cream font-semibold mb-3 text-sm uppercase tracking-wider">Навигация</h4>
            <div className="flex flex-col gap-2">
              {[
                ['/', 'Главная'], 
                ['/menu', 'Меню'], 
                ['/reserve', 'Бронирование'], 
                ['/banquet', 'Банкеты'], 
                ['/reviews', 'Отзывы'], 
                ['/contacts', 'Контакты']
              ].map(([to, label]) => (
                <Link 
                  key={to} 
                  to={to} 
                  className="text-sp-cream/50 hover:text-sp-orange transition-colors text-sm w-fit"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="text-sp-cream font-semibold mb-3 text-sm uppercase tracking-wider">Контакты</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+79257677778" className="flex items-start gap-2 text-sp-cream/60 hover:text-sp-orange transition-colors text-sm group">
                <Phone size={14} className="mt-0.5 flex-shrink-0 group-hover:text-sp-orange transition-colors" />
                <span>+7 (925) 767-77-78</span>
              </a>
              
              <a href="mailto:fine.ehtibar@yandex.ru" className="flex items-start gap-2 text-sp-cream/60 hover:text-sp-orange transition-colors text-sm group">
                <Mail size={14} className="mt-0.5 flex-shrink-0 group-hover:text-sp-orange transition-colors" />
                <span>fine.ehtibar@yandex.ru</span>
              </a>

              <div className="flex items-start gap-2 text-sp-cream/60 text-sm">
                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                <span>Московская обл., Химки,<br />ул. Некрасова 15</span>
              </div>

              <div className="flex items-start gap-2 text-sp-cream/60 text-sm">
                <Clock size={14} className="mt-0.5 flex-shrink-0" />
                <div className="leading-tight">
                  <div>Пн–Пт: 09:00–01:00</div>
                  <div>Сб–Вс: 09:00–05:00</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA / Actions */}
          <div>
            <h4 className="text-sp-cream font-semibold mb-3 text-sm uppercase tracking-wider">Клиентам</h4>
            <div className="flex flex-col gap-2">
              <Link to="/menu" className="btn-outline-sm justify-center">Посмотреть меню</Link>
              <Link to="/reserve" className="btn-outline-sm justify-center">Забронировать стол</Link>
              <Link to="/banquet" className="btn-outline-sm justify-center">Заказать банкет</Link>
            </div>
          </div>
        </div>

        {/* Legal Bottom Bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-sp-cream/30">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-1 md:gap-3 text-center md:text-left">
            <p>© {currentYear} Ресторан «Соль и Перец». Все права защищены.</p>
            <p className="hidden md:inline">|</p>
            <p>ИП Алиев Эхтибар Джахид оглы</p>
            <p className="hidden md:inline">|</p>
            <p>ИНН 502413316035</p>
            <p className="hidden md:inline">|</p>
            <p>ОГРНИП 326774600287612</p>
          </div>
          
          <div className="flex gap-4 whitespace-nowrap">
            <Link to="/privacy" className="hover:text-sp-cream/60 transition-colors">Политика конфиденциальности</Link>
            <Link to="/terms" className="hover:text-sp-cream/60 transition-colors">Оферта</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}