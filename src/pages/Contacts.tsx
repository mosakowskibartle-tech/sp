import { motion } from 'framer-motion';
import { Phone, MapPin, Clock, Send, Instagram, Navigation } from 'lucide-react';

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
                <a href="tel:+79257677778" className="text-sp-cream text-xl font-semibold hover:text-sp-orange transition-colors">+7 (925) 767-77-78</a>
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

            <div className="contact-card">
              <div className="contact-icon"><Send size={22} /></div>
              <div>
                <div className="text-sp-cream/50 text-sm mb-2">Социальные сети</div>
                <div className="flex gap-3">
                  <a href="#" className="social-btn-lg"><Instagram size={20} /> Instagram</a>
                  <a href="#" className="social-btn-lg"><Send size={20} /> Telegram</a>
                </div>
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
