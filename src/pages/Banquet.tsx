import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { createBanquet } from '../lib/db';

const PACKAGES = [
  { id: 'econom', name: 'Эконом', price: 3000, color: 'border-blue-500/40 bg-blue-500/5', activeColor: 'border-blue-500 bg-blue-500/15', badge: 'bg-blue-500',
    includes: ['Холодные закуски: Чабан салат, Оливье, Мимоза','Горячее на выбор: Отбивная (свинина / говядина / курица)','Садж на выбор: Цыплёнок / Баранина / Говядина / Свинина','Шашлык на выбор: Курица / Свинина','Напитки: Морс / Лимонад / Вода','Хлебная корзинка','🎵 Живая музыка и DJ'] },
  { id: 'standard', name: 'Стандарт', price: 4000, color: 'border-sp-orange/40 bg-sp-orange/5', activeColor: 'border-sp-orange bg-sp-orange/15', badge: 'bg-sp-orange',
    includes: ['Всё из пакета Эконом','Сельдь под шубой','Бакинский букет','Гнездо глухаря','Сырная и мясная тарелка','Ассорти из солений','Жульен','🎵 Живая музыка и DJ'] },
  { id: 'premium', name: 'Премиум', price: 5000, color: 'border-yellow-500/40 bg-yellow-500/5', activeColor: 'border-yellow-500 bg-yellow-500/15', badge: 'bg-yellow-500',
    includes: ['Всё из пакета Стандарт','Шах-плов','Шашлык из баранины на выбор','Сок натуральный','🎵 Живая музыка и DJ'] },
];

const EXTRA = [
  { id: 'Декор зала', label: '🎀 Декор зала', price: 5000 },
  { id: 'Ростовые куклы', label: '🤡 Ростовые куклы', price: 8000 },
  { id: 'Салют', label: '🎆 Салют', price: 15000 },
  { id: 'Шах-плов', label: '🍚 Шах-плов (доп.)', price: 3500 },
  { id: 'Оформление зала', label: '🌟 Оформление зала', price: 7000 },
  { id: 'Фотозона', label: '📸 Фотозона', price: 5000 },
];

export default function Banquet() {
  const [selectedPkg, setSelectedPkg] = useState('');
  const [guests, setGuests] = useState(20);
  const [services, setServices] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [occasion, setOccasion] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', comment: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);

  const pkg = PACKAGES.find(p => p.id === selectedPkg);
  const pkgTotal = pkg ? pkg.price * guests : 0;
  const svcTotal = EXTRA.filter(s => services.includes(s.id)).reduce((sum, s) => sum + s.price, 0);
  const total = pkgTotal + svcTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !date) { setError('Заполните имя, телефон и дату'); return; }
    setLoading(true); setError('');
    try {
      await createBanquet({
        contact_name: form.name, contact_phone: form.phone,
        event_type: occasion || 'Не указан', package_name: selectedPkg || 'Не выбран',
        guests_count: guests, event_date: date,
        extra_services: services, estimated_total: total,
        comment: form.comment, status: 'new'
      });
      setSuccess(true);
    } catch { setError('Ошибка. Попробуйте ещё раз.'); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-sp-darkest pt-20 flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center p-12">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="font-display text-3xl text-sp-orange mb-3">Заявка отправлена!</h2>
          <p className="text-sp-cream/60 mb-6">Наш менеджер свяжется с вами в ближайшее время.</p>
          <button onClick={() => { setSuccess(false); setSelectedPkg(''); setServices([]); setOccasion(''); setForm({ name: '', phone: '', comment: '' }); }} className="btn-primary">Отправить ещё</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sp-darkest pt-20">
      <div className="relative bg-sp-dark py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'url(/images/banquet.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl md:text-5xl text-sp-cream font-bold mb-3">Банкеты и мероприятия</h1>
            <p className="text-sp-cream/60 max-w-xl">Организуем любое мероприятие — от камерного ужина до большой свадьбы</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-7">

          {/* Повод */}
          <div className="bg-sp-dark rounded-2xl p-6 border border-white/5">
            <h2 className="text-sp-cream font-semibold text-lg mb-4">🎊 Повод (по желанию)</h2>
            <input type="text" placeholder="День рождения, Корпоратив, Свадьба..." value={occasion} onChange={e => setOccasion(e.target.value)} className="form-input" />
          </div>

          {/* Пакеты */}
          <div className="bg-sp-dark rounded-2xl p-6 border border-white/5">
            <h2 className="text-sp-cream font-semibold text-lg mb-1">📦 Пакет обслуживания</h2>
            <p className="text-sp-cream/40 text-sm mb-5">Цена за одного гостя</p>
            <div className="flex flex-col gap-3">
              {PACKAGES.map(p => (
                <div key={p.id} className={`rounded-2xl border-2 transition-all overflow-hidden ${selectedPkg === p.id ? p.activeColor : p.color}`}>
                  <button type="button" onClick={() => setSelectedPkg(selectedPkg === p.id ? '' : p.id)} className="w-full flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedPkg === p.id ? `${p.badge} border-transparent` : 'border-white/20'}`}>
                        {selectedPkg === p.id && <Check size={11} className="text-white" />}
                      </div>
                      <div className="text-left">
                        <div className="text-sp-cream font-semibold">{p.name}</div>
                        <div className="text-sp-cream/40 text-xs">{p.includes.length} позиций включено</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sp-orange font-bold text-lg">{p.price.toLocaleString('ru-RU')} ₽/чел</span>
                      <button type="button" onClick={e => { e.stopPropagation(); setExpandedPkg(expandedPkg === p.id ? null : p.id); }} className="text-sp-cream/40 hover:text-sp-cream transition-colors">
                        {expandedPkg === p.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </button>
                  {expandedPkg === p.id && (
                    <div className="px-4 pb-4 border-t border-white/10 pt-3">
                      {p.includes.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-sp-cream/70 mb-1.5">
                          <span className="text-sp-orange mt-0.5 flex-shrink-0">✓</span>{item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Гости */}
          <div className="bg-sp-dark rounded-2xl p-6 border border-white/5">
            <h2 className="text-sp-cream font-semibold text-lg mb-5 flex items-center gap-2">
              <Users size={18} className="text-sp-orange" />Количество гостей: <span className="text-sp-orange font-bold ml-1">{guests}</span>
            </h2>
            <input type="range" min={10} max={200} step={5} value={guests} onChange={e => setGuests(parseInt(e.target.value))} className="w-full accent-sp-orange" />
            <div className="flex justify-between text-xs text-sp-cream/40 mt-1"><span>10 чел.</span><span>200 чел.</span></div>
          </div>

          {/* Доп. услуги */}
          <div className="bg-sp-dark rounded-2xl p-6 border border-white/5">
            <h2 className="text-sp-cream font-semibold text-lg mb-4">✨ Дополнительные услуги</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXTRA.map(s => (
                <label key={s.id} className={`flex items-center justify-between cursor-pointer p-3 rounded-xl border transition-all ${services.includes(s.id) ? 'border-sp-orange/40 bg-sp-orange/10' : 'border-white/5 hover:border-white/15 bg-white/3'}`}>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={services.includes(s.id)} onChange={() => setServices(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])} className="accent-sp-orange w-4 h-4" />
                    <span className="text-sp-cream/80 text-sm">{s.label}</span>
                  </div>
                  <span className="text-sp-orange text-sm font-medium">+{s.price.toLocaleString('ru-RU')} ₽</span>
                </label>
              ))}
            </div>
          </div>

          {/* Расчёт */}
          <div className="bg-sp-orange/10 border border-sp-orange/25 rounded-2xl p-6">
            <h3 className="text-sp-cream font-semibold mb-4">💰 Расчёт стоимости</h3>
            <div className="flex flex-col gap-2 text-sm">
              {pkg ? <div className="flex justify-between text-sp-cream/60"><span>Пакет «{pkg.name}» ({guests} чел. × {pkg.price.toLocaleString('ru-RU')} ₽)</span><span>{pkgTotal.toLocaleString('ru-RU')} ₽</span></div>
                   : <div className="text-sp-cream/40">Выберите пакет для расчёта</div>}
              {EXTRA.filter(s => services.includes(s.id)).map(s => <div key={s.id} className="flex justify-between text-sp-cream/60"><span>{s.label}</span><span>{s.price.toLocaleString('ru-RU')} ₽</span></div>)}
              <div className="border-t border-white/10 pt-3 flex justify-between text-sp-cream font-bold text-xl">
                <span>Ориентировочно:</span>
                <span className="text-sp-orange">{total > 0 ? `${total.toLocaleString('ru-RU')} ₽` : '—'}</span>
              </div>
            </div>
          </div>

          {/* Контакты */}
          <div className="bg-sp-dark rounded-2xl p-6 border border-white/5">
            <h2 className="text-sp-cream font-semibold text-lg mb-5">📞 Контактные данные</h2>
            <div className="flex flex-col gap-4">
              <div><label className="form-label"><Calendar size={13} className="inline mr-1" />Дата мероприятия *</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" required /></div>
              <div><label className="form-label">Ваше имя *</label><input type="text" placeholder="Иван Иванов" value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} className="form-input" required /></div>
              <div><label className="form-label">Телефон *</label><input type="tel" placeholder="+7 (999) 999-99-99" value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))} className="form-input" required /></div>
              <div><label className="form-label">Комментарий</label><textarea placeholder="Особые пожелания..." value={form.comment} onChange={e => setForm(v => ({ ...v, comment: e.target.value }))} className="form-input resize-none h-20" /></div>
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary text-base py-4">{loading ? 'Отправляем...' : '🎉 Отправить заявку на банкет'}</button>
          <p className="text-sp-cream/30 text-xs text-center">Нажимая кнопку, вы соглашаетесь с <a href="/privacy" className="underline">политикой конфиденциальности</a></p>
        </form>
      </div>
    </div>
  );
}
