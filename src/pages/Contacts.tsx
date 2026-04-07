import { motion } from 'framer-motion';
import { Phone, MapPin, Clock, Navigation } from 'lucide-react';

export default function Contacts() {
  return (
    <div className="min-h-screen bg-sp-darkest pt-20">
      <div className="bg-sp-dark py-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl md:text-5xl text-sp-cream font-bold mb-2">Контакты</h1>
            <p className="text-sp-cream/50">Мы всегда рады вас видеть</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="contact-card">
              <div className="contact-icon"><Phone size={22} /></div>
              <div>
                <div className="text-sp-cream/50 text-sm mb-1">Телефон</div>
                <a href="tel:+79257677778" className="text-sp-cream text-xl font-semibold hover:text-sp-orange transition-colors">
                  +7 (925) 767-77-78
                </a>
                <div className="mt-3">
                  <a href="tel:+79257677778" className="btn-primary inline-flex items-center gap-2">
                    <Phone size={16} /> Позвонить
                  </a>
                </div>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon"><MapPin size={22} /></div>
              <div>
                <div className="text-sp-cream/50 text-sm mb-1">Адрес</div>
                <div className="text-sp-cream text-lg font-semibold">Московская обл., г. Химки</div>
                <div className="text-sp-cream/70">ул. Некрасова 15</div>
                <div className="text-sp-cream/50 text-sm mt-1">Рядом МЦД Сходня</div>
                <a
                  href="https://yandex.ru/maps/?text=Химки+ул+Некрасова+15"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center gap-2 mt-3"
                >
                  <Navigation size={16} /> Построить маршрут
                </a>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon"><Clock size={22} /></div>
              <div>
                <div className="text-sp-cream/50 text-sm mb-2">Часы работы</div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sp-cream">Понедельник — Пятница</span>
                    <span className="text-sp-orange font-semibold">09:00 — 01:00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sp-cream">Суббота — Воскресенье</span>
                    <span className="text-sp-orange font-semibold">09:00 — 05:00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp instead of banned socials */}
            <div className="contact-card">
              <div className="contact-icon"><Phone size={22} /></div>
              <div>
                <div className="text-sp-cream/50 text-sm mb-2">Написать нам</div>
                <a
                  href="https://wa.me/79257677778"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600/20 border border-green-600/30 text-green-400 rounded-xl text-sm font-medium hover:bg-green-600/30 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="rounded-2xl overflow-hidden h-96 lg:h-full min-h-96 bg-sp-dark border border-white/10">
              <iframe
                src="https://yandex.ru/map-widget/v1/?ll=37.392000%2C55.988000&z=16&pt=37.392000,55.988000,pm2rdm"
                width="100%"
                height="100%"
                frameBorder="0"
                title="Карта"
                style={{ minHeight: '400px' }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
