import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, MapPin, Clock, Info } from 'lucide-react';
import FloorPlan from '../components/FloorPlan';

interface Reservation {
  id: number;
  table_number: number | null;
  date: string;
  time: string;
  status: string;
  guests_count: number;
  guest_name: string;
}

const TIMES = [
  '09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00',
  '17:00','18:00','19:00','20:00','21:00','22:00','23:00','00:00',
];

export default function Reserve() {
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', guests: '2' });
  const [dayReservations, setDayReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Load ALL reservations for the selected date (regardless of time)
  const loadDay = useCallback(async (d: string) => {
    if (!d) return;
    try {
      const res = await fetch(`/api/reservations?date=${d}`);
      const data = await res.json();
      setDayReservations(
        Array.isArray(data)
          ? data.filter((r: Reservation) => r.status !== 'cancelled' && r.table_number !== null)
          : []
      );
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (date) loadDay(date);
    else setDayReservations([]);
  }, [date, loadDay]);

  // Tables booked at the EXACT selected time slot (exclude nulls)
  const bookedAtTime: number[] = (time
    ? dayReservations.filter(r => r.time === time && r.table_number !== null)
    : []
  ).map(r => r.table_number as number);

  // All tables with ANY booking today (exclude nulls)
  const bookedAnyTime: number[] = [...new Set(
    dayReservations
      .filter(r => r.table_number !== null)
      .map(r => r.table_number as number)
  )];

  const handleSelectTable = (n: number) => {
    if (n === 0) { setSelectedTable(null); return; }
    setSelectedTable(n);
    setShowFloorPlan(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !date || !time) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    if (selectedTable && bookedAtTime.includes(selectedTable)) {
      setError(`Стол №${selectedTable} уже занят в ${time}. Выберите другой стол или время.`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: form.name,
          guest_phone: form.phone,
          date,
          time,
          guests_count: parseInt(form.guests),
          table_number: selectedTable,
          status: 'pending',
        }),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
    } catch {
      setError('Ошибка при бронировании. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSuccess(false);
    setSelectedTable(null);
    setDate('');
    setTime('');
    setForm({ name: '', phone: '', guests: '2' });
    setError('');
    setDayReservations([]);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-sp-darkest pt-20 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-12 max-w-md"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-7xl mb-6"
          >🎉</motion.div>
          <h2 className="font-display text-3xl text-sp-orange mb-3">Стол забронирован!</h2>
          <p className="text-sp-cream/60 mb-2">Мы подтвердим бронь по телефону в ближайшее время.</p>
          {selectedTable && (
            <p className="text-sp-cream/40 text-sm mb-6">
              Стол №{selectedTable} · {date} · {time}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="btn-primary">Забронировать ещё</button>
            <a href="tel:+79257677778" className="btn-secondary">Позвонить</a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <FloorPlan
        open={showFloorPlan}
        onClose={() => setShowFloorPlan(false)}
        onSelectTable={handleSelectTable}
        selectedTable={selectedTable}
        bookedTables={time ? bookedAtTime : bookedAnyTime}
        softBookedTables={time ? bookedAnyTime.filter(n => !bookedAtTime.includes(n)) : []}
        date={date}
        time={time}
      />

      <div className="min-h-screen bg-sp-darkest pt-20">
        <div className="bg-sp-dark py-12">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-display text-4xl md:text-5xl text-sp-cream font-bold mb-2">
                Бронирование стола
              </h1>
              <p className="text-sp-cream/50">Выберите удобное место и забронируйте онлайн</p>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 max-w-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Date & Time */}
            <div className="bg-sp-dark rounded-2xl p-6 border border-white/5">
              <h2 className="text-sp-cream font-semibold mb-5 flex items-center gap-2">
                <Calendar size={18} className="text-sp-orange" />Дата и время
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Дата *</label>
                  <input
                    type="date"
                    min={today}
                    value={date}
                    onChange={e => {
                      setDate(e.target.value);
                      setSelectedTable(null);
                    }}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Время *</label>
                  <select
                    value={time}
                    onChange={e => {
                      setTime(e.target.value);
                      setSelectedTable(null);
                    }}
                    className="form-input"
                    required
                  >
                    <option value="">Выберите...</option>
                    {TIMES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Info about day bookings */}
              {date && dayReservations.length > 0 && (
                <div className="mt-4 flex items-start gap-2 bg-sp-orange/8 border border-sp-orange/15 rounded-xl px-3 py-2.5 text-sm">
                  <Info size={14} className="text-sp-orange mt-0.5 flex-shrink-0" />
                  <span className="text-sp-cream/60">
                    На {new Date(date + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}{' '}
                    уже <span className="text-sp-orange font-medium">
                      {dayReservations.length} {dayReservations.length === 1 ? 'бронь' : dayReservations.length < 5 ? 'брони' : 'броней'}
                    </span>.
                    {time && bookedAtTime.length > 0 && (
                      <> В {time} занято: <span className="text-red-400">столы {bookedAtTime.join(', ')}</span>.</>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Table selection */}
            <div className="bg-sp-dark rounded-2xl p-6 border border-white/5">
              <h2 className="text-sp-cream font-semibold mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-sp-orange" />Выбор стола
              </h2>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowFloorPlan(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  🗺️ {selectedTable ? `Стол №${selectedTable} (изменить)` : 'Открыть схему зала'}
                </button>
                {selectedTable && (
                  <button
                    type="button"
                    onClick={() => setSelectedTable(null)}
                    className="btn-secondary text-sm"
                  >
                    Сбросить
                  </button>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-sp-cream/40">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#2D2D2D] inline-block" />Свободен
                </span>
                {bookedAnyTime.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-red-500 inline-block" />Занят
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-green-500 inline-block" />Выбран
                </span>
              </div>

              {selectedTable && (
                <div className={`mt-3 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 border ${
                  bookedAtTime.includes(selectedTable)
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-green-500/10 border-green-500/20 text-green-400'
                }`}>
                  {bookedAtTime.includes(selectedTable)
                    ? `⚠️ Стол №${selectedTable} занят в ${time} — выберите другое время или стол`
                    : `✅ Выбран стол №${selectedTable}`
                  }
                </div>
              )}

              {!selectedTable && (
                <p className="text-sp-cream/30 text-xs mt-2">
                  Необязательно — если не выберете, мы подберём лучший стол
                </p>
              )}
            </div>

            {/* Guest info */}
            <div className="bg-sp-dark rounded-2xl p-6 border border-white/5">
              <h2 className="text-sp-cream font-semibold mb-5 flex items-center gap-2">
                <User size={18} className="text-sp-orange" />Ваши данные
              </h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="form-label">Ваше имя *</label>
                  <input
                    type="text"
                    placeholder="Иван Иванов"
                    value={form.name}
                    onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Телефон *</label>
                  <input
                    type="tel"
                    placeholder="+7 (999) 999-99-99"
                    value={form.phone}
                    onChange={e => setForm(v => ({ ...v, phone: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Количество гостей</label>
                  <select
                    value={form.guests}
                    onChange={e => setForm(v => ({ ...v, guests: e.target.value }))}
                    className="form-input"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,12,15,20].map(n => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'человек' : n < 5 ? 'человека' : 'человек'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Booked slots for the day */}
            {date && dayReservations.length > 0 && (
              <div className="bg-sp-dark rounded-2xl p-5 border border-white/5">
                <h3 className="text-sp-cream/60 text-sm font-medium mb-3 flex items-center gap-2">
                  <Clock size={14} className="text-sp-orange" />
                  Занятые столы на {new Date(date + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {dayReservations.map(r => (
                    <div key={r.id} className="flex items-center justify-between text-xs bg-white/3 rounded-lg px-3 py-1.5">
                      <span className="text-sp-cream/60">Стол №{r.table_number}</span>
                      <span className="text-sp-cream/40">{r.time} · {r.guests_count} чел.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary text-base py-4">
              {loading ? 'Отправляем...' : '🗓️ Забронировать стол'}
            </button>

            <p className="text-sp-cream/30 text-xs text-center">
              Нажимая кнопку, вы соглашаетесь с{' '}
              <a href="/privacy" className="underline">политикой конфиденциальности</a>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
