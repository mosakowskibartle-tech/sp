import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Minus, Send, Settings, Save, Trash2, ArrowLeft, X } from 'lucide-react';

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

interface SavedOrder {
  id: string;
  tableNum: string;
  items: CartItem[];
  total: number;
  generalComment: string;
  createdAt: number;
}

const FOOD_CATS = ['Все', 'Мангал', 'Шашлык', 'Горячее', 'Салаты', 'Закуски', 'Напитки'];

export default function Waiter() {
  // Настройки
  const [waiterName, setWaiterName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Режим просмотра: 'list' = список столов, 'order' = редактирование заказа
  const [viewMode, setViewMode] = useState<'list' | 'order'>('list');
  
  // Данные
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  
  // Текущий заказ
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [tableNum, setTableNum] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [generalComment, setGeneralComment] = useState('');
  
  // Фильтры меню
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('Все');
  
  // Статусы
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // === LOCALSTORAGE ===
  useEffect(() => {
    const name = localStorage.getItem('sp_waiter_name');
    if (name) setWaiterName(name);
    
    const data = localStorage.getItem('sp_waiter_orders');
    if (data) {
      try { setOrders(JSON.parse(data)); } catch(e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sp_waiter_orders', JSON.stringify(orders));
  }, [orders]);

  const saveWaiterName = () => {
    localStorage.setItem('sp_waiter_name', waiterName);
    setShowSettings(false);
  };

  // === MENU ===
  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setMenu(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  // === CART LOGIC ===
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(i => 
      i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
    ).filter(i => i.quantity > 0));
  };

  const updateComment = (id: number, text: string) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, comment: text } : i));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // === ORDER MANAGEMENT ===
  const startNewOrder = () => {
    setCurrentOrderId(null);
    setTableNum('');
    setCart([]);
    setGeneralComment('');
    setViewMode('order');
  };

  const openOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setCurrentOrderId(orderId);
      setTableNum(order.tableNum);
      setCart(order.items);
      setGeneralComment(order.generalComment);
      setViewMode('order');
    }
  };

  const saveOrder = () => {
    if (!tableNum) return alert('Введите номер стола!');
    
    const orderData: SavedOrder = {
      id: currentOrderId || Date.now().toString(),
      tableNum,
      items: cart,
      total: cartTotal,
      generalComment,
      createdAt: Date.now()
    };

    setOrders(prev => {
      const others = prev.filter(o => o.id !== orderData.id);
      return [orderData, ...others];
    });
    
    if (!currentOrderId) setCurrentOrderId(orderData.id);
    alert('✅ Сохранено в черновиках');
  };

  const sendOrder = async () => {
    if (!tableNum || cart.length === 0) return;
    if (!waiterName) return alert('Укажите имя в настройках!');

    setSending(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: `Стол ${tableNum}`,
          delivery_address: `Зал, Стол ${tableNum}`,
          comment: generalComment || `Официант: ${waiterName}`,
          items: cart.map(i => ({ 
            id: i.id, name: i.name, price: i.price, 
            quantity: i.quantity, comment: i.comment || '' 
          })),
          total_amount: cartTotal,
          status: 'confirmed',
          table_number: parseInt(tableNum),
          waiter_name: waiterName
        })
      });

      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        
        // Удаляем из черновиков после отправки
        if (currentOrderId) {
          setOrders(prev => prev.filter(o => o.id !== currentOrderId));
        }
        
        // Сброс
        setViewMode('list');
        setCurrentOrderId(null);
        setTableNum('');
        setCart([]);
        setGeneralComment('');
      } else {
        alert('Ошибка отправки');
      }
    } catch(e) {
      alert('Ошибка сети');
    } finally {
      setSending(false);
    }
  };

  const deleteOrder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Удалить заказ?')) {
      setOrders(prev => prev.filter(o => o.id !== id));
      if (currentOrderId === id) {
        setViewMode('list');
        setCurrentOrderId(null);
      }
    }
  };

  const goBack = () => {
    setViewMode('list');
  };

  // Фильтрация меню
  const filteredMenu = menu.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCat === 'Все' || item.category.includes(activeCat);
    return matchSearch && matchCat;
  });

  // === SETTINGS SCREEN ===
  if (showSettings) {
    return (
      <div className="min-h-screen bg-sp-darkest flex items-center justify-center p-4">
        <div className="bg-sp-dark p-6 rounded-2xl w-full max-w-sm border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-xl font-bold">Настройки</h2>
            <button onClick={() => setShowSettings(false)} className="text-sp-cream/50 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <label className="block text-sp-cream/60 text-sm mb-2">Ваше имя</label>
          <input 
            type="text" 
            value={waiterName} 
            onChange={e => setWaiterName(e.target.value)}
            className="w-full bg-black/20 text-white p-3 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-sp-orange"
            placeholder="Например: Сахиб"
          />
          <button onClick={saveWaiterName} className="w-full bg-sp-orange text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <Save size={18} /> Сохранить
          </button>
        </div>
      </div>
    );
  }

  // === MAIN SCREEN ===
  return (
    <div className="min-h-screen bg-sp-darkest flex flex-col">
      
      {/* HEADER */}
      <header className="bg-sp-dark border-b border-white/8 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {viewMode === 'order' && (
            <button onClick={goBack} className="p-2 -ml-2 text-sp-cream/60 hover:text-white">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-sp-cream font-bold text-lg">
              {viewMode === 'list' ? '📋 Мои столы' : `🍽️ Стол ${tableNum || '?'}`}
            </h1>
            <p className="text-sp-cream/40 text-xs">{waiterName || 'Настройте имя ⚙️'}</p>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 text-sp-cream/60 hover:text-white bg-white/5 rounded-full">
          <Settings size={20} />
        </button>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-hidden">
        
        {/* VIEW 1: LIST OF TABLES */}
        {viewMode === 'list' && (
          <div className="h-full overflow-y-auto p-4">
            <button 
              onClick={startNewOrder}
              className="w-full bg-sp-orange hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-900/30 mb-6 transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Новый заказ
            </button>

            <h3 className="text-sp-cream/60 text-sm font-semibold uppercase tracking-wider mb-3">Активные заказы</h3>
            
            {orders.length === 0 ? (
              <div className="text-center text-sp-cream/30 py-12">
                <p className="text-4xl mb-2">🍽️</p>
                <p>Нет сохраненных заказов</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div 
                    key={order.id} 
                    onClick={() => openOrder(order.id)}
                    className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-4 cursor-pointer transition-all active:scale-98 relative group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sp-orange font-bold text-2xl">Стол {order.tableNum}</span>
                      <span className="text-white font-bold text-lg">{order.total.toLocaleString()} ₽</span>
                    </div>
                    <div className="text-sp-cream/50 text-sm mb-2">{order.items.length} позиций</div>
                    {order.generalComment && (
                      <div className="text-sp-cream/70 text-xs bg-black/20 p-2 rounded-lg italic mb-2">
                        "{order.generalComment}"
                      </div>
                    )}
                    <button 
                      onClick={(e) => deleteOrder(order.id, e)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: ORDER EDITOR */}
        {viewMode === 'order' && (
          <div className="h-full flex flex-col lg:flex-row">
            
            {/* MENU SECTION */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
              {/* Filters */}
              <div className="p-3 border-b border-white/5 bg-sp-dark/30 flex-shrink-0">
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-cream/30" />
                  <input 
                    type="text" 
                    placeholder="Поиск блюда..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="w-full bg-black/20 text-white pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sp-orange/50" 
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {FOOD_CATS.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setActiveCat(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        activeCat === cat 
                          ? 'bg-sp-orange text-white shadow-lg shadow-orange-900/20' 
                          : 'bg-white/5 text-sp-cream/60 hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Grid */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredMenu.map(item => {
                    const inCart = cart.find(i => i.id === item.id);
                    return (
                      <button 
                        key={item.id} 
                        onClick={() => addToCart(item)}
                        className={`bg-white/5 hover:bg-white/10 border rounded-2xl p-4 text-left transition-all flex justify-between items-center group ${
                          inCart ? 'border-sp-orange/50 bg-sp-orange/5' : 'border-white/5'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-sp-cream font-semibold text-sm truncate">{item.name}</div>
                          <div className="text-sp-orange font-bold text-base">{item.price.toLocaleString()} ₽</div>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          inCart ? 'bg-sp-orange text-white' : 'bg-white/10 text-sp-cream/50 group-hover:bg-sp-orange group-hover:text-white'
                        }`}>
                          {inCart ? <span className="font-bold text-sm">{inCart.quantity}</span> : <Plus size={18} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {filteredMenu.length === 0 && (
                  <div className="text-center text-sp-cream/30 py-10">Ничего не найдено</div>
                )}
              </div>
            </div>

            {/* CART SECTION */}
            <div className="w-full lg:w-96 bg-sp-dark/50 border-l border-white/5 flex flex-col">
              {/* Cart Header */}
              <div className="p-4 border-b border-white/5 bg-black/10">
                <div className="flex gap-2 mb-3">
                  <input 
                    type="number" 
                    placeholder="№ стола" 
                    value={tableNum} 
                    onChange={e => setTableNum(e.target.value)} 
                    className="w-20 bg-black/20 text-white p-3 rounded-xl text-center font-bold text-lg outline-none focus:ring-2 focus:ring-sp-orange" 
                  />
                  <input 
                    type="text" 
                    placeholder="Заметка к столу..." 
                    value={generalComment} 
                    onChange={e => setGeneralComment(e.target.value)} 
                    className="flex-1 bg-black/20 text-white p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sp-orange" 
                  />
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {cart.length === 0 ? (
                  <div className="text-center text-sp-cream/30 py-10">
                    <p className="text-3xl mb-2">🛒</p>
                    <p className="text-sm">Добавьте блюда из меню</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sp-cream font-medium text-sm">{item.name}</span>
                        <span className="text-sp-orange font-bold">{(item.price * item.quantity).toLocaleString()} ₽</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <input 
                          type="text" 
                          placeholder="Заметка к блюду..." 
                          value={item.comment || ''} 
                          onChange={(e) => updateComment(item.id, e.target.value)}
                          className="flex-1 bg-black/20 text-white text-xs rounded-lg px-3 py-1.5 mr-2 outline-none focus:ring-1 focus:ring-sp-orange/50"
                        />
                        <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
                          <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-sp-cream hover:text-red-400 rounded-md hover:bg-red-500/20 transition-all">
                            <Minus size={14} />
                          </button>
                          <span className="text-white font-bold w-6 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-sp-cream hover:text-sp-orange rounded-md hover:bg-sp-orange/20 transition-all">
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              <div className="p-4 border-t border-white/5 bg-black/20">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sp-cream/60 text-sm">Итого к оплате:</span>
                  <span className="text-sp-orange font-bold text-2xl">{cartTotal.toLocaleString()} ₽</span>
                </div>
                
                {showSuccess && (
                  <div className="mb-3 bg-green-500/20 text-green-400 text-center py-2 rounded-xl text-sm font-bold">
                    ✅ Отправлено на кухню!
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={saveOrder} 
                    className="bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Сохранить
                  </button>
                  <button 
                    onClick={sendOrder} 
                    disabled={!tableNum || cart.length === 0 || sending}
                    className={`bg-sp-orange hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
                      (!tableNum || cart.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {sending ? '...' : <><Send size={16} /> На кухню</>}
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}