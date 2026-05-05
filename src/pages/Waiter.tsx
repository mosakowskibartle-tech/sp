import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Minus, Send, Settings, Trash2, X, Save } from 'lucide-react';

// Точный список категорий из Menu.tsx (синхронизирован с БД)
const CATEGORIES = [
  'Все', 'Блюда с мангала', 'Шашлык на костях', 'Овощи на мангале', 
  'Рыба на мангале', 'Садж на мангале', 'Супы', 'Горячие блюда', 
  'Шах плов', 'Паста', 'Гарниры', 'Салаты', 'Холодные закуски', 
  'Закуски к пиву', 'Соусы', 'Напитки', 'Авторские чаи', 'Мороженое', 'Десерты'
];

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

interface TableOrder {
  tableNum: string;
  items: CartItem[];
  comment: string;
  createdAt: number;
}

export default function Waiter() {
  // === STATE ===
  const [waiterName, setWaiterName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<TableOrder[]>([]);
  const [activeTable, setActiveTable] = useState<string>('');
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('Все');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // === PERSISTENCE & INIT ===
  useEffect(() => {
    const savedName = localStorage.getItem('sp_waiter_name');
    if (savedName) setWaiterName(savedName);

    const savedOrders = localStorage.getItem('sp_active_tables');
    if (savedOrders) {
      try { setOrders(JSON.parse(savedOrders)); } catch(e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sp_active_tables', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    fetch('/api/menu')
      .then(r => r.json())
      .then(d => setMenu(Array.isArray(d) ? d : []))
      .catch(e => console.error('Menu fetch error:', e));
  }, []);

  // === HELPERS ===
  const currentOrder = orders.find(o => o.tableNum === activeTable) || { tableNum: activeTable, items: [], comment: '' };

  const updateOrders = (updater: (prev: TableOrder[]) => TableOrder[]) => {
    setOrders(prev => {
      const next = updater(prev);
      return next;
    });
  };

  // === ACTIONS ===
  const addTable = () => {
    const num = prompt('Введите номер стола:');
    if (num && !orders.find(o => o.tableNum === num.trim())) {
      const newTable = { tableNum: num.trim(), items: [], comment: '', createdAt: Date.now() };
      updateOrders(prev => [newTable, ...prev]);
      setActiveTable(num.trim());
    }
  };

  const removeTable = (num: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Удалить стол ${num}?`)) {
      updateOrders(prev => prev.filter(o => o.tableNum !== num));
      if (activeTable === num) setActiveTable(orders.find(o => o.tableNum !== num)?.tableNum || '');
    }
  };

  const addToCart = (item: MenuItem) => {
    if (!activeTable) return alert('Сначала выберите или создайте стол!');
    updateOrders(prev => prev.map(o => {
      if (o.tableNum !== activeTable) return o;
      const exists = o.items.find(i => i.id === item.id);
      return {
        ...o,
        items: exists 
          ? o.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
          : [...o.items, { ...item, quantity: 1 }]
      };
    }));
  };

  const updateQty = (id: number, delta: number) => {
    updateOrders(prev => prev.map(o => {
      if (o.tableNum !== activeTable) return o;
      return {
        ...o,
        items: o.items.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
               .filter(i => i.quantity > 0)
      };
    }));
  };

  const updateComment = (id: number | null, txt: string) => {
    updateOrders(prev => prev.map(o => {
      if (o.tableNum !== activeTable) return o;
      if (id === null) return { ...o, comment: txt }; // Общий комментарий
      return {
        ...o,
        items: o.items.map(i => i.id === id ? { ...i, comment: txt } : i)
      };
    }));
  };

  const sendOrder = async () => {
    if (!activeTable || currentOrder.items.length === 0) return setStatusMsg('❌ Выберите стол и добавьте блюда');
    if (!waiterName) return setStatusMsg('❌ Введите имя в ⚙️ настройках');
    
    setSending(true);
    setStatusMsg('⏳ Отправка...');
    
    try {
      const payload = {
        customer_name: `Стол ${activeTable}`,
        customer_phone: '',
        delivery_address: `Зал, Стол ${activeTable}`,
        comment: currentOrder.comment || `Официант: ${waiterName}`,
        items: currentOrder.items.map(i => ({ 
          id: i.id, name: i.name, price: i.price, quantity: i.quantity, comment: i.comment || '' 
        })),
        total_amount: currentOrder.items.reduce((s, i) => s + i.price * i.quantity, 0),
        status: 'confirmed',
        table_number: parseInt(activeTable) || 0,
        waiter_name: waiterName
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сервера');

      setStatusMsg(`✅ Стол ${activeTable} отправлен!`);
      updateOrders(prev => prev.filter(o => o.tableNum !== activeTable));
      setActiveTable(orders.find(o => o.tableNum !== activeTable)?.tableNum || '');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e: any) {
      console.error('❌ Send error:', e);
      setStatusMsg('❌ ' + (e.message || 'Ошибка отправки'));
    } finally {
      setSending(false);
    }
  };

  // === FILTERS ===
  const filtered = menu.filter(i => {
    const matchCat = activeCat === 'Все' || i.category === activeCat;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const total = currentOrder.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = currentOrder.items.reduce((s, i) => s + i.quantity, 0);

  // === SETTINGS SCREEN ===
  if (showSettings) {
    return (
      <div className="min-h-screen bg-sp-darkest flex items-center justify-center p-4">
        <div className="bg-sp-dark p-6 rounded-2xl w-full max-w-sm border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-xl font-bold">Настройки</h2>
            <button onClick={() => setShowSettings(false)} className="text-sp-cream/50 hover:text-white"><X size={20}/></button>
          </div>
          <label className="block text-sp-cream/60 text-sm mb-2">Имя официанта</label>
          <input type="text" value={waiterName} onChange={e => setWaiterName(e.target.value)} className="w-full bg-black/20 text-white p-3 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-sp-orange" placeholder="Сахиб / Алина" />
          <button onClick={() => { localStorage.setItem('sp_waiter_name', waiterName); setShowSettings(false); }} className="w-full bg-sp-orange text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Save size={16}/> Сохранить</button>
        </div>
      </div>
    );
  }

  // === MAIN UI ===
  return (
    <div className="min-h-screen bg-sp-darkest flex flex-col">
      
      {/* HEADER */}
      <header className="bg-sp-dark border-b border-white/8 p-3 flex-shrink-0 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-sp-cream font-bold text-lg">🍽️ Официант</h1>
            {waiterName && <span className="text-sp-orange text-sm bg-sp-orange/10 px-2 py-0.5 rounded-full">{waiterName}</span>}
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 bg-white/5 rounded-full text-sp-cream/60"><Settings size={18}/></button>
        </div>
        
        {/* TABLE SELECTOR */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {orders.map(o => (
            <button key={o.tableNum} onClick={() => setActiveTable(o.tableNum)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTable === o.tableNum ? 'bg-sp-orange text-white shadow-lg shadow-orange-900/20' : 'bg-white/5 text-sp-cream/60 hover:bg-white/10'}`}>
              Стол {o.tableNum}
              <span className="bg-black/20 text-xs px-1.5 py-0.5 rounded">{o.items.length}</span>
              <span onClick={(e) => removeTable(o.tableNum, e)} className="ml-1 hover:text-red-400 cursor-pointer"><X size={14}/></span>
            </button>
          ))}
          <button onClick={addTable} className="flex-shrink-0 px-3 py-2 rounded-xl bg-white/5 text-sp-cream/60 hover:bg-white/10 hover:text-sp-orange transition-all font-bold">+ Стол</button>
        </div>

        {statusMsg && (
          <div className={`mt-2 text-center text-sm font-bold p-2 rounded-lg ${statusMsg.includes('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {statusMsg}
          </div>
        )}
      </header>

      {!activeTable ? (
        <div className="flex-1 flex items-center justify-center text-sp-cream/30">
          <div className="text-center">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-lg">Выберите или добавьте стол сверху</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* MENU SECTION */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
            <div className="p-3 border-b border-white/5 bg-sp-dark/30 flex-shrink-0">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide items-center">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setActiveCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCat === c ? 'bg-sp-orange text-white shadow-lg shadow-orange-900/20' : 'bg-white/5 text-sp-cream/60 hover:bg-white/10'}`}>
                    {c}
                  </button>
                ))}
                <div className="relative ml-auto">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-sp-cream/30" />
                  <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="bg-black/20 text-white pl-7 pr-2 py-1.5 rounded-full text-xs w-24 outline-none focus:ring-1 focus:ring-sp-orange" />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
              {filtered.map(item => (
                <button key={item.id} onClick={() => addToCart(item)} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 text-left flex justify-between items-center transition-all active:scale-95">
                  <div className="min-w-0">
                    <div className="text-sp-cream text-sm font-medium truncate max-w-[110px]">{item.name}</div>
                    <div className="text-sp-orange font-bold mt-0.5">{item.price.toLocaleString()} ₽</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-sp-orange/20 text-sp-orange flex items-center justify-center flex-shrink-0">
                    <Plus size={16} />
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <div className="col-span-full text-center text-sp-cream/30 py-10">Ничего не найдено</div>}
            </div>
          </div>

          {/* CART SECTION */}
          <div className="w-full lg:w-96 bg-sp-dark/50 border-l border-white/5 flex flex-col flex-shrink-0 h-[40vh] lg:h-auto">
            <div className="p-4 border-b border-white/5 bg-black/10">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sp-cream font-bold">Заказ стола {activeTable}</h3>
                <span className="text-sp-orange text-sm">{count} поз.</span>
              </div>
              <input type="text" placeholder="Общий комментарий к столу (напр. именинник)" value={currentOrder.comment} onChange={e => updateComment(null, e.target.value)} className="w-full bg-black/20 text-white p-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-sp-orange" />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {currentOrder.items.length === 0 ? (
                <div className="text-center text-sp-cream/30 py-10">Добавьте блюда из меню</div>
              ) : (
                currentOrder.items.map(item => (
                  <div key={item.id} className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sp-cream font-medium text-sm">{item.name}</span>
                      <span className="text-sp-orange font-bold">{(item.price * item.quantity).toLocaleString()} ₽</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <input type="text" placeholder="Заметка к блюду..." value={item.comment || ''} onChange={e => updateComment(item.id, e.target.value)} className="flex-1 bg-black/20 text-white text-xs rounded-lg px-2 py-1.5 mr-2 outline-none focus:ring-1 focus:ring-sp-orange/50" />
                      <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-sp-cream hover:text-red-400 rounded-md hover:bg-red-500/20"><Minus size={14}/></button>
                        <span className="text-white font-bold w-5 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-sp-cream hover:text-sp-orange rounded-md hover:bg-sp-orange/20"><Plus size={14}/></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-black/20">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sp-cream/60 text-sm">Итого:</span>
                <span className="text-sp-orange font-bold text-xl">{total.toLocaleString()} ₽</span>
              </div>
              <button onClick={sendOrder} disabled={sending || currentOrder.items.length === 0} className={`w-full bg-sp-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all ${sending ? 'cursor-wait' : ''}`}>
                {sending ? '⏳ Отправка...' : <><Send size={16}/> На кухню</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}