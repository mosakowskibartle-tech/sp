import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, User, ChefHat, Receipt, DivideCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { type MenuItem } from '../components/MenuCard';

interface OrderItem {
  name: string;
  qty: number;
  price: number | string;
  status?: string;
}

interface TableOrder {
  waiterName: string;
  items: OrderItem[];
  total: number | string;
}

function QrCard({ item }: { item: MenuItem }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col mb-3 last:mb-0">
      <div className="flex p-3 gap-3">
        {item.image_url && (
          <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0 bg-gray-100" />
        )}
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1">{item.name}</h3>
            {item.description && (
              <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{item.description}</p>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-orange-600 font-bold text-lg">
              {Number(item.price).toLocaleString('ru-RU')} ₽
            </span>
            {(item as any).weight && <span className="text-gray-400 text-xs">{(item as any).weight} г</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function MyTableTab({ tableNum }: { tableNum: string }) {
  const [order, setOrder] = useState<TableOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [splitCount, setSplitCount] = useState<number>(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orders?table=${tableNum}`)
      .then(r => r.json())
      .then(data => {
        setOrder({
          waiterName: data.waiterName || "Не назначен",
          items: data.items || [],
          total: Number(data.total) || 0
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tableNum]);

  if (loading) return <div className="text-center py-20 text-gray-400">Загрузка...</div>;

  const totalNum = Number(order?.total) || 0;
  const perPerson = splitCount > 1 ? Math.ceil(totalNum / splitCount) : totalNum;

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

      {/* Разделение счета */}
      <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-orange-800 font-bold text-sm flex items-center gap-2">
            <DivideCircle size={16} /> Счет на компанию
          </h3>
          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg shadow-sm">
            <button onClick={() => setSplitCount(Math.max(1, splitCount - 1))} className="w-6 h-6 flex items-center justify-center text-orange-600 font-bold hover:bg-orange-50 rounded">-</button>
            <span className="font-bold text-gray-900 w-6 text-center">{splitCount}</span>
            <button onClick={() => setSplitCount(splitCount + 1)} className="w-6 h-6 flex items-center justify-center text-orange-600 font-bold hover:bg-orange-50 rounded">+</button>
          </div>
        </div>
        <div className="flex justify-between items-end border-t border-orange-100 pt-2 mt-2">
           <span className="text-xs text-gray-500">Сумма с человека:</span>
           <span className="text-xl font-bold text-orange-600">{perPerson.toLocaleString()} ₽</span>
        </div>
      </div>

      {/* Список блюд */}
      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-lg">
          <Receipt size={20} className="text-orange-500" /> Заказ
        </h3>
        
        {!order || order.items.length === 0 ? (
          <div className="bg-white/5 rounded-2xl p-8 text-center border border-white/10">
            <ChefHat className="mx-auto text-white/20 mb-2" size={32} />
            <p className="text-white/60 text-sm">Пока пусто. Позовите официанта.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">{item.qty}x</span>
                  <span className="text-gray-900 font-medium">{item.name}</span>
                </div>
                <div className="font-bold text-gray-900">
                  {(Number(item.price) * item.qty).toLocaleString()} ₽
                </div>
              </div>
            ))}
            <div className="bg-gray-50 p-4 flex justify-between items-center border-t border-gray-100">
              <span className="text-gray-500 font-medium">Итого:</span>
              <span className="text-orange-600 font-bold text-2xl">{totalNum.toLocaleString()} ₽</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QrMenu() {
  const [searchParams] = useSearchParams();
  const tableNum = searchParams.get('table') ?? '';

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'table'>('menu');
  const [search, setSearch] = useState('');

  // Загружаем ВСЕ блюда сразу
  useEffect(() => {
    if (activeTab === 'table') return;
    setLoading(true);
    // Запрашиваем всё меню (bar=false вернет кухню, можно сделать два запроса или один общий)
    // Для простоты грузим кухню, если нужно бар - можно добавить переключатель внутри вкладки меню, но пока сделаем просто список
    fetch(`/api/menu`) 
      .then(r => r.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeTab]);

  const filtered = items.filter(i => 
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  );

  // Группируем по категориям для красивого списка с заголовками
  const grouped = (() => {
    const groups: Record<string, MenuItem[]> = {};
    filtered.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0])); // Сортировка по алфавиту
  })();

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      
      {/* HEADER */}
      <div className="bg-[#1B1B2F] text-white sticky top-0 z-40 shadow-lg">
        <div className="px-4 pt-4 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-xl tracking-wide text-orange-500">СОЛЬ · ПЕРЕЦ</div>
              <div className="text-white/50 text-xs flex items-center gap-1">
                {tableNum ? `Стол №${tableNum}` : 'Меню'}
              </div>
            </div>
            <a href="tel:+79257677778" className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors">
               📞
            </a>
          </div>

          {/* Переключатель Вкладок */}
          <div className="flex gap-2 bg-black/20 p-1 rounded-xl">
             <button 
               onClick={() => setActiveTab('menu')}
               className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'menu' ? 'bg-orange-500 text-white shadow-md' : 'text-white/60 hover:text-white'}`}
             >
               Меню
             </button>
             {tableNum && (
               <button 
                 onClick={() => setActiveTab('table')}
                 className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'table' ? 'bg-green-600 text-white shadow-md' : 'text-white/60 hover:text-white'}`}
               >
                 Мой стол
               </button>
             )}
          </div>
        </div>

        {/* Поиск (Только в меню) */}
        {activeTab === 'menu' && (
          <div className="px-4 pb-4">
             <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
                <input
                  type="text" placeholder="Найти блюдо..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl pl-10 pr-3 py-3 text-base outline-none focus:bg-white/15 transition-colors"
                />
              </div>
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        
        {activeTab === 'menu' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-xl animate-pulse"></div>)}
              </div>
            ) : (
              <div className="space-y-8">
                {grouped.map(([catName, catItems]) => (
                  <div key={catName}>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 sticky top-[140px] bg-gray-50/95 backdrop-blur py-2 z-10 border-b border-gray-200">
                      {catName}
                    </h2>
                    <div>
                      {catItems.map(item => <QrCard key={item.id} item={item} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'table' && tableNum && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <MyTableTab tableNum={tableNum} />
          </motion.div>
        )}

      </div>
    </div>
  );
}