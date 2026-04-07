import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, Instagram, Send } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-sp-darkest border-t border-white/5 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="font-display text-2xl text-sp-orange font-bold mb-2">Соль&nbsp;&amp;&nbsp;Перец</div>
            <p className="text-sp-cream/50 text-sm leading-relaxed mb-4">Домашняя кухня и уютная атмосфера в самом сердце Сходни.</p>
            <div className="flex gap-3">
              <a href="#" className="social-btn"><Instagram size={16} /></a>
              <a href="#" className="social-btn"><Send size={16} /></a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sp-cream font-semibold mb-3 text-sm uppercase tracking-wider">Навигация</h4>
            <div className="flex flex-col gap-2">
              {[['/', 'Главная'], ['/menu', 'Меню'], ['/reserve', 'Бронирование'], ['/banquet', 'Банкеты'], ['/reviews', 'Отзывы'], ['/contacts', 'Контакты']].map(([to, label]) => (
                <Link key={to} to={to} className="text-sp-cream/50 hover:text-sp-orange transition-colors text-sm">{label}</Link>
              ))}
            </div>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="text-sp-cream font-semibold mb-3 text-sm uppercase tracking-wider">Контакты</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+79257677778" className="flex items-start gap-2 text-sp-cream/60 hover:text-sp-orange transition-colors text-sm">
                <Phone size={14} className="mt-0.5 flex-shrink-0" />
                +7 (925) 767-77-78
              </a>
              <div className="flex items-start gap-2 text-sp-cream/60 text-sm">
                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                Московская обл., Химки, ул. Некрасова 15
              </div>
              <div className="flex items-start gap-2 text-sp-cream/60 text-sm">
                <Clock size={14} className="mt-0.5 flex-shrink-0" />
                <div>
                  <div>Пн–Пт: 09:00–01:00</div>
                  <div>Сб–Вс: 09:00–05:00</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div>
            <h4 className="text-sp-cream font-semibold mb-3 text-sm uppercase tracking-wider">Быстрый заказ</h4>
            <div className="flex flex-col gap-2">
              <Link to="/menu" className="btn-outline-sm">Посмотреть меню</Link>
              <Link to="/reserve" className="btn-outline-sm">Забронировать стол</Link>
              <Link to="/banquet" className="btn-outline-sm">Заказать банкет</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-sp-cream/30">
          <p>© 2025 Кафе «Соль и Перец». Все права защищены.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-sp-cream/60 transition-colors">Политика конфиденциальности</Link>
            <Link to="/terms" className="hover:text-sp-cream/60 transition-colors">Пользовательское соглашение</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
