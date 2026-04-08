import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Flame, Clock } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { type MenuItem } from '../components/MenuCard';

const FOOD_CATS = [
  { id: 'all', label: 'Всё меню', emoji: '🍽️' },
  { id: 'Блюда с мангала', label: 'Блюда с мангала', emoji: '🔥' },
  { id: 'Шашлык на костях', label: 'Шашлык на костях', emoji: '🥩' },
  { id: 'Супы', label: 'Супы', emoji: '🍲' },
  { id: 'Горячие блюда', label: 'Горячие', emoji: '♨️' },
  { id: 'Паста', label: 'Паста', emoji: '🍝' },
  { id: 'Гарниры', label: 'Гарниры', emoji: '🍚' },
  { id: 'Салаты', label: 'Салаты', emoji: '🥗' },
  { id: 'Холодные закуски', label: 'Холодные', emoji: '🧀' },
  { id: 'Закуски', label: 'Закуски', emoji: '🍟' },
  { id: 'Соусы', label: 'Соусы', emoji: '🫙' },
  { id: 'Напитки', label: 'Напитки', emoji: '🥤' },
  { id: 'Авторские чаи', label: 'Чаи', emoji: '🍵' },
  { id: 'Десерты', label: 'Десерты', emoji: '🍰' },
  { id: 'Мороженое', label: 'Мороженое', emoji: '🍦' },
];

const BAR_CATS = [
  { id: 'all', label: 'Всё', emoji: '🍸' },
  { id: 'Коктейли', label: 'Коктейли', emoji: '🍹' },
  { id: 'Вино', label: 'Вино', emoji: '🍷' },
  { id: 'Пиво', label: 'Пиво', emoji: '🍺' },
  { id: 'Виски', label: 'Виски', emoji: '🥃' },
  { id: 'Текила', label: 'Текила', emoji: '🌵' },
  { id: 'Ром', label: 'Ром', emoji: '🍾' },
  { id: 'Безалкогольные', label: 'Без алк.', emoji: '🧃' },
];

function QrCard({ item }: { item: MenuItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col"
    >
      {item.image_url && (
        <div className="relative overflow-hidden">
          <img src={item.image_url} alt={item.name} className="w-full h-36 object-cover" />
          {item.is_special && (
            <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">⭐ Блюдо дня</span>
          )}
          <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{item.name}</h3>
        {item.description && (
          <p className="text-gray-400 text-xs leading-relaxed mb-2 line-clamp-2 flex-1">{item.description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          {item.calories && <span className="flex items-center gap-0.5"><Flame size={10} />{item.calories}</span>}
          {item.cook_time && <span className="flex items-center gap-0.5"><Clock size={10} />{item.cook_time} мин</span>}
          {item.is_gluten_free && <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded text-xs">Без глютена</span>}
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-orange-500 font-bold text-base">{item.price.toLocaleString('ru-RU')} ₽</span>
          {item.original_price && item.original_price > item.price && (
            <span className="text-gray-300 text-xs line-through">{item.original_price.toLocaleString('ru-RU')} ₽</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function QrMenu() {
  const [searchParams] = useSearchParams();
  const tableNum = searchParams.get('table') ?? '';

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'food' | 'bar'>('food');
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/menu?bar=${mode === 'bar'}`)
      .then(r => r.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [mode]);

  useEffect(() => { setCat('all'); }, [mode]);

  const cats = mode === 'bar' ? BAR_CATS : FOOD_CATS;

  const filtered = items.filter(i => {
    const mc = cat === 'all' || i.category === cat;
    const ms = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });

  // Group by category when "all" is selected
  const grouped = cat === 'all'
    ? cats.filter(c => c.id !== 'all').map(c => ({
        ...c,
        items: filtered.filter(i => i.category === c.id)
      })).filter(g => g.items.length > 0)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B1B2F] text-white sticky top-0 z-40 shadow-lg">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="font-bold text-lg tracking-wide">СОЛЬ · ПЕРЕЦ</div>
              <div className="text-white/50 text-xs">
                {tableNum ? `Стол №${tableNum}` : 'Меню'} · Только просмотр
              </div>
            </div>
            <a href="tel:+79257677778"
              className="flex items-center gap-1.5 bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              📞 Позвонить
            </a>
          </div>

          {/* Food / Bar toggle */}
          <div className="flex gap-2 mt-3 mb-2">
            <button onClick={() => setMode('food')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${mode==='food'?'bg-orange-500 text-white':'bg-white/10 text-white/60'}`}>
              🍽️ Кухня
            </button>
            <button onClick={() => setMode('bar')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${mode==='bar'?'bg-orange-500 text-white':'bg-white/10 text-white/60'}`}>
              🍸 Бар
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
            <input
              type="text" placeholder="Поиск по меню..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:bg-white/15 transition-colors"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          {cats.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                cat===c.id ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}>
              <span>{c.emoji}</span><span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({length:8}).map((_,i) => (
              <div key={i} className="bg-white rounded-2xl h-52 animate-pulse" />
            ))}
          </div>
        ) : grouped ? (
          <div className="flex flex-col gap-8">
            {grouped.map(group => (
              <div key={group.id}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-xl">{group.emoji}</span>
                  <h2 className="font-bold text-gray-800 text-base">{group.label}</h2>
                  <span className="text-gray-400 text-xs ml-1">{group.items.length} позиций</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {group.items.map(item => <QrCard key={item.id} item={item} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(item => <QrCard key={item.id} item={item} />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p>Ничего не найдено</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-[#1B1B2F] text-white/40 text-center text-xs py-6 mt-4 px-4">
        <p className="font-bold text-white/60 mb-1">Соль и Перец</p>
        <p>Московская обл., Химки, ул. Некрасова 15</p>
        <p className="mt-1">Пн–Пт 09:00–01:00 · Сб–Вс 09:00–05:00</p>
        <a href="tel:+79257677778" className="text-orange-400 font-semibold mt-2 block">+7 (925) 767-77-78</a>
      </div>
    </div>
  );
}
