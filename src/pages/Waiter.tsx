import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Send, Settings, Trash2 } from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
  comment?: string;
}

const CATS = ['Все', 'Мангал', 'Шашлык', 'Горячее', 'Салаты', 'Закуски', 'Напитки'];

export default function Waiter() {
  // Состояние
  const [waiterName, setWaiterName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNum, setTableNum] = useState('');
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('Все');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Инициализация
  useEffect(() => {
    const savedName = localStorage.getItem('sp_waiter_name');
    if (savedName) setWaiterName(savedName);
    
    fetch('/api/menu')
      .then(r => r.json())
      .then(d => setMenu(Array.isArray(d) ? d : []))
      .catch(e => console.error('Menu fetch error:', e));
  }, []);

  const saveName = () => {
    localStorage.setItem('sp_waiter_name', waiterName);
    setShowSettings(false);
  };

  // Корзина
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      return ex ? prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const updateComment = (id: number, txt: string) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, comment: txt } : i));
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = cart.reduce((s, i) => s + i.quantity, 0);

  // Отправка на кухню
  const sendOrder = async () => {
    if (!tableNum || cart.length === 0) return setStatusMsg('❌ Укажите стол и добавьте блюда');
    if (!waiterName) return setStatusMsg('❌ Введите имя в ⚙️ настройках');
    
    setSending(true);
    setStatusMsg('⏳ Отправка...');
    
    try {
      const payload = {
        customer_name: `Стол ${tableNum}`,
        customer_phone: '',
        delivery_address: `Зал, Стол ${tableNum}`,
        comment: `Официант: ${waiterName}`,
        items: cart.map(i => ({ 
          id: i.id, 
          name: i.name, 
          price: i.price, 
          quantity: i.quantity, 
          comment: i.comment || '' 
        })),
        total_amount: total,
        status: 'confirmed',
        table_number: parseInt(tableNum) || 0,
        waiter_name: waiterName
      };

      console.log('📤 Отправляем заказ:', payload);

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log('📥 Ответ сервера:', data);

      if (!res.ok) throw new Error(data.error || 'Ошибка сервера');

      setStatusMsg('✅ Успешно отправлено!');
      setCart([]);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e: any) {
      console.error('❌ Ошибка отправки:', e);
      setStatusMsg('❌ ' + e.message);
    } finally {
      setSending(false);
    }
  };

  // Фильтрация меню
  const filtered = menu.filter(i => 
    (activeCat === 'Все' || i.category.includes(activeCat)) && 
    (!search || i.name.toLowerCase().includes(search.toLowerCase()))
  );

  // Экран настроек
  if (showSettings) {
    return (
      <div className="min-h-screen bg-sp-darkest flex items-center justify-center p-4">
        <div className="bg-sp-dark p-6 rounded-2xl w-full max-w-sm border border-white/10">
          <h2 className="text-white text-xl font-bold mb-4">Настройки</h2>
          <label className="block text-sp-cream/60 text-sm mb-2">Ваше имя</label>
          <input 
            type="text" 
            value={waiterName} 
            onChange={e => setWaiterName(e.target.value)}
            className="w-full bg-black/20 text-white p-3 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-sp-orange"
            placeholder="Например: Сахиб"
          />
          <button onClick={saveName} className="w-full bg-sp-orange text-white font-bold py-3 rounded-xl mb-2">Сохранить</button>
          <button onClick={() => setShowSettings(false)} className="w-full text-sp-cream/50 py-2">Отмена</button>
        </div>
      </div>
    );
  }

  // Основной экран
  return (
    <div className="min-h-screen bg-sp-darkest flex flex-col">
      
      {/* ВЕРХНЯЯ ПАНЕЛЬ: Стол, Имя, Статус */}
      <header className="bg-sp-dark border-b border-white/8 p-3 flex-shrink-0 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-sp-cream font-bold text-lg">🍽️ Официант</h1>
          <button onClick={() => setShowSettings(true)} className="p-2 bg-white/5 rounded-full text-sp-cream/60"><Settings size={18}/></button>
        </div>
        <div className="flex gap-2">
          <input 
            type="number" 
            placeholder="№ Стола" 
            value={tableNum} 
            onChange={e => setTableNum(e.target.value)} 
            className="flex-1 bg-black/20 text-white p-2 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-sp-orange" 
          />
          <input 
            type="text" 
            placeholder="Ваше имя" 
            value={waiterName} 
            onChange={e => setWaiterName(e.target.value)} 
            className="flex-1 bg-black/20 text-white p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sp-orange" 
          />
        </div>
        {statusMsg && (
          <div className={`mt-2 text-center text-sm font-bold p-1.5 rounded ${statusMsg.includes('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {statusMsg}
          </div>
        )}
      </header>

      {/* КАТЕГОРИИ И ПОИСК */}
      <div className="flex gap-2 overflow-x-auto p-3 bg-sp-dark/50 flex-shrink-0 scrollbar-hide items-center">
        {CATS.map(c => (
          <button 
            key={c} 
            onClick={() => setActiveCat(c)} 
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCat === c ? 'bg-sp-orange text-white shadow-lg shadow-orange-900/20' : 'bg-white/5 text-sp-cream/60 hover:bg-white/10'
            }`}
          >
            {c}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-sp-cream/30" />
          <input 
            type="text" 
            placeholder="Поиск" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="bg-black/20 text-white pl-7 pr-2 py-1.5 rounded-full text-xs w-24 outline-none focus:ring-1 focus:ring-sp-orange" 
          />
        </div>
      </div>

      {/* МЕНЮ (Сетка) */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start pb-36">
        {filtered.map(item => (
          <button 
            key={item.id} 
            onClick={() => addToCart(item)} 
            className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 text-left flex justify-between items-center transition-all active:scale-95"
          >
            <div className="min-w-0">
              <div className="text-sp-cream text-sm font-medium truncate max-w-[110px]">{item.name}</div>
              <div className="text-sp-orange font-bold mt-0.5">{item.price.toLocaleString()} ₽</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-sp-orange/20 text-sp-orange flex items-center justify-center flex-shrink-0">
              <Plus size={16} />
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-sp-cream/30 py-10">Ничего не найдено</div>
        )}
      </div>

      {/* НИЖНЯЯ ПАНЕЛЬ: Корзина и Отправка */}
      <div className="fixed bottom-0 left-0 right-0 bg-sp-dark border-t border-white/8 p-4 z-30 max-h-[50vh] flex flex-col">
        {/* Список блюд в заказе */}
        {cart.length > 0 && (
          <div className="flex-1 overflow-y-auto mb-3 space-y-2 pr-1 scrollbar-thin">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 bg-black/20 p-2 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-sp-cream text-xs font-medium truncate">{item.name}</div>
                  <input 
                    type="text" 
                    placeholder="Заметка к блюду..." 
                    value={item.comment || ''} 
                    onChange={e => updateComment(item.id, e.target.value)} 
                    className="w-full bg-transparent text-[10px] text-sp-cream/50 outline-none mt-0.5 placeholder:text-sp-cream/20" 
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-black/30 rounded-lg p-0.5">
                  <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-sp-cream hover:text-red-400 rounded"><Minus size={12}/></button>
                  <span className="text-white font-bold w-4 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-sp-cream hover:text-sp-orange rounded"><Plus size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Итого и Кнопка */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-sp-cream/60 text-xs">Позиций: {count}</span>
            <span className="text-sp-orange font-bold text-xl">{total.toLocaleString()} ₽</span>
          </div>
          <div className="flex gap-2">
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all">
                <Trash2 size={18} />
              </button>
            )}
            <button 
              onClick={sendOrder} 
              disabled={sending || !tableNum || cart.length === 0} 
              className="bg-sp-orange hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              {sending ? '⏳...' : <><Send size={16} /> На кухню</>}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}