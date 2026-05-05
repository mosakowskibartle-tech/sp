import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, ChefHat, Receipt } from 'lucide-react'; // Убрали Flame и Clock
import { useSearchParams } from 'react-router-dom';
import { type MenuItem } from '../components/MenuCard';

// --- КАТЕГОРИИ (Как в Waiter и Menu) ---
const FOOD_CATS = [
  { id: 'all', label: 'Всё меню', emoji: '🍽️' },
  { id: 'Блюда с мангала', label: 'Мангал', emoji: '🔥' },
  { id: 'Шашлык на костях', label: 'Шашлык', emoji: '🥩' },
  { id: 'Супы', label: 'Супы', emoji: '🍲' },
  { id: 'Горячие блюда', label: 'Горячее', emoji: '♨️' },
  { id: 'Паста', label: 'Паста', emoji: '🍝' },
  { id: 'Гарниры', label: 'Гарниры', emoji: '🍚' },
  { id: 'Салаты', label: 'Салаты', emoji: '🥗' },
  { id: 'Холодные закуски', label: 'Закуски', emoji: '🧀' },
  { id: 'Напитки', label: 'Напитки', emoji: '🥤' },
  { id: 'Десерты', label: 'Десерты', emoji: '🍰' },
];

const BAR_CATS = [
  { id: 'all', label: 'Всё', emoji: '🍸' },
  { id: 'Коктейли', label: 'Коктейли', emoji: '🍹' },
  { id: 'Вино', label: 'Вино', emoji: '🍷' },
  { id: 'Пиво', label: 'Пиво', emoji: '🍺' },
  { id: 'Виски', label: 'Виски', emoji: '🥃' },
  { id: 'Безалкогольные', label: 'Б/А', emoji: '🧃' },
];

// --- ТИПЫ ЗАКАЗА ---
interface OrderItem {
  name: string;
  qty: number;
  price: number;
  status?: string;
}
interface TableOrder {
  waiterName: string;
  items: OrderItem[];
  total: number;
}

// --- КАРТОЧКА БЛЮДА ---
function QrCard({ item }: { item: MenuItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col"
    >
      {item.image_url && (
        <div className="relative overflow-hidden h-36">
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          {item.is_special && (
            <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">⭐ Хит</span>
          )}
        </div>
      )}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{item.name}</h3>
        {item.description && (
          <p className="text-gray-400 text-xs leading-relaxed mb-2 line-clamp-2 flex-1">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-orange-600 font-bold text-base">{item.price.toLocaleString('ru-RU')} ₽</span>
          {/* Используем any для weight, если его нет в типе MenuItem, чтобы не ломать сборку */}
          {(item as any).weight && <span className="text-gray-300 text-xs">{(item as any).weight} г</span>}
        </div>
      </div>
    </motion.div>
  );
}

// --- ВКЛАДКА "МОЙ СТОЛ" ---
function MyTableTab({ tableNum }: { tableNum: string }) {
  const [order, setOrder] = useState<TableOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orders?table=${tableNum}`)
      .then(r => r.json())
      .then(data => {
        setOrder({
          waiterName: data.waiterName || "Не назначен",
          items: data.items || [],
          total: data.total || 0
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tableNum]);

  if (loading) return <div className="text-center py-20 text-gray-400">Загрузка заказа...</div>;

  return (
    <div className="space-y-6 pb-10">
      {/* Официант */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
          <User size={24} />
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase font-bold">Ваш официант</p>
          <p className="text-lg font-bold text-gray-900">{order?.waiterName}</p>
        </div>
        <a href="tel:+79257677778" className="ml-auto bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-100">
          Позвать
        </a>
      </div>

      {/* Список блюд */}
      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Receipt size={18} className="text-orange-500" /> Текущий заказ
        </h3>
        
        {!order || order.items.length === 0 ? (
          <div className="bg-white/5 rounded-2xl p-8 text-center border border-white/10">
            <ChefHat className="mx-auto text-white/20 mb-2" size={32} />
            <p className="text-white/60 text-sm">Заказов пока нет.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start p-4 border-b border-gray-50 last:border-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded">{item.qty}x</span>
                    <span className="text-gray-900 font-medium text-sm">{item.name}</span>
                  </div>
                  {item.status && (
                    <span className={`text-[10px] ml-8 ${item.status === 'ready' ? 'text-green-600' : 'text-orange-500'}`}>
                      {item.status === 'ready' ? 'Готово' : 'Готовится'}
                    </span>
                  )}
                </div>
                <div className="font-bold text-gray-900 text-sm">
                  {(item.price * item.qty).toLocaleString()} ₽
                </div>
              </div>
            ))}
            <div className="bg-gray-50 p-4 flex justify-between items-center border-t border-gray-100">
              <span className="text-gray-500 text-sm font-medium">Итого:</span>
              <span className="text-orange-600 font-bold text-xl">{order.total.toLocaleString()} ₽</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- ОСНОВНОЙ КОМПОНЕНТ QR МЕНЮ ---
export default function QrMenu() {
  const [searchParams] = useSearchParams();
  const tableNum = searchParams.get('table') ?? '';

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'menu' | 'table'>('menu');
  const [mode, setMode] = useState<'food' | 'bar'>('food');
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (activeTab === 'table') return;
    setLoading(true);
    fetch(`/api/menu?bar=${mode === 'bar'}`)
      .then(r => r.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [mode, activeTab]);

  useEffect(() => { setCat('all'); }, [mode]);

  const cats = mode === 'bar' ? BAR_CATS : FOOD_CATS;

  const filtered = items.filter(i => {
    const mc = cat === 'all' || i.category === cat;
    const ms = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });

  const grouped = cat === 'all'
    ? cats.filter(c => c.id !== 'all').map(c => ({
        ...c,
        items: filtered.filter(i => i.category === c.id)
      })).filter(g => g.items.length > 0)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      
      {/* HEADER */}
      <div className="bg-[#1B1B2F] text-white sticky top-0 z-40 shadow-lg">
        <div className="px-4 pt-4 pb-2">
          
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold text-lg tracking-wide text-orange-500">СОЛЬ · ПЕРЕЦ</div>
              <div className="text-white/50 text-xs flex items-center gap-1">
                {tableNum ? `Стол №${tableNum}` : 'Меню'}
                {tableNum && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>}
              </div>
            </div>
            <a href="tel:+79257677778" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors">
               📞 Позвонить
            </a>
          </div>

          {/* Переключатель Вкладок */}
          <div className="flex gap-2 mb-2 bg-black/20 p-1 rounded-xl">
             <button 
               onClick={() => setActiveTab('menu')}
               className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'menu' ? 'bg-orange-500 text-white shadow-md' : 'text-white/60 hover:text-white'}`}
             >
               Меню
             </button>
             {tableNum && (
               <button 
                 onClick={() => setActiveTab('table')}
                 className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'table' ? 'bg-green-600 text-white shadow-md' : 'text-white/60 hover:text-white'}`}
               >
                 Мой стол
               </button>
             )}
          </div>

          {/* Поиск и переключение Кухня/Бар */}
          {activeTab === 'menu' && (
            <>
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

              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
                <input
                  type="text" placeholder="Поиск по меню..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:bg-white/15 transition-colors"
                />
              </div>
            </>
          )}
        </div>

        {/* Категории */}
        {activeTab === 'menu' && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide mask-linear-fade">
            {cats.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  cat===c.id ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}>
                <span>{c.emoji}</span><span>{c.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="px-3 py-4 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          
          {activeTab === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({length:6}).map((_,i) => <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />)}
                </div>
              ) : grouped ? (
                <div className="flex flex-col gap-8">
                  {grouped.map(group => (
                    <div key={group.id}>
                      <div className="flex items-center gap-2 mb-3 px-1 sticky top-[130px] bg-gray-50/95 backdrop-blur py-2 z-10">
                        <span className="text-xl">{group.emoji}</span>
                        <h2 className="font-bold text-gray-800 text-base">{group.label}</h2>
                        <span className="text-gray-400 text-xs ml-1 bg-gray-200 px-1.5 py-0.5 rounded-full">{group.items.length}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {group.items.map(item => <QrCard key={item.id} item={item} />)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <div className="text-4xl mb-3">🔍</div>
                  <p>Ничего не найдено</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'table' && tableNum && (
            <motion.div key="table" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <MyTableTab tableNum={tableNum} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* FOOTER */}
      <div className="bg-[#1B1B2F] text-white/40 text-center text-xs py-6 mt-4 px-4 border-t border-white/5">
        <p className="font-bold text-white/60 mb-1">Соль и Перец</p>
        <p>Московская обл., Химки, ул. Некрасова 15</p>
        <p className="mt-1">Пн–Пт 09:00–01:00 · Сб–Вс 09:00–05:00</p>
        <a href="tel:+79257677778" className="text-orange-400 font-semibold mt-2 block">+7 (925) 767-77-78</a>
      </div>
    </div>
  );
}