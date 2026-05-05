import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Оставили только те иконки, которые реально используются в коде ниже
import { 
  Search, Plus, Minus, Send, Settings, Save, Trash2, ArrowLeft 
} from 'lucide-react';

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
  id: string; // Уникальный ID заказа (timestamp)
  tableNum: string;
  items: CartItem[];
  total: number;
  generalComment: string;
  createdAt: number;
  status: 'new' | 'sent';
}

const FOOD_CATS = ['Все', 'Мангал', 'Шашлык', 'Горячее', 'Салаты', 'Закуски', 'Напитки'];

export default function Waiter() {
  // --- Авторизация и Настройки ---
  const [waiterName, setWaiterName] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Данные ---
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([]);
  
  // --- Текущее редактирование ---
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null); // null = новый заказ
  const [currentTable, setCurrentTable] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [generalComment, setGeneralComment] = useState('');
  
  // --- UI ---
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('Все');
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Загрузка из LocalStorage при старте
  useEffect(() => {
    const savedName = localStorage.getItem('sp_waiter_name');
    if (savedName) setWaiterName(savedName);

    const savedOrdersData = localStorage.getItem('sp_waiter_orders');
    if (savedOrdersData) {
      try {
        setSavedOrders(JSON.parse(savedOrdersData));
      } catch (e) { console.error(e); }
    }
  }, []);

  // Сохранение заказов в LocalStorage при изменении
  useEffect(() => {
    localStorage.setItem('sp_waiter_orders', JSON.stringify(savedOrders));
  }, [savedOrders]);

  // Сохранение имени
  const saveName = () => {
    localStorage.setItem('sp_waiter_name', waiterName);
    setIsSettingsOpen(false);
  };

  // Загрузка меню
  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setMenu(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  // Логика корзины
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      if (ex) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0));
  };

  const updateItemComment = (id: number, text: string) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, comment: text } : i));
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  // Открытие заказа (нового или существующего)
  const openOrder = (orderId: string | null) => {
    setActiveOrderId(orderId);
    if (orderId) {
      const order = savedOrders.find(o => o.id === orderId);
      if (order) {
        setCurrentTable(order.tableNum);
        setCart(order.items);
        setGeneralComment(order.generalComment);
      }
    } else {
      // Новый заказ
      setCurrentTable('');
      setCart([]);
      setGeneralComment('');
    }
  };

  // Сохранение черновика заказа
  const saveDraft = () => {
    if (!currentTable) return alert("Введите номер стола");
    
    const newOrder: SavedOrder = {
      id: activeOrderId || Date.now().toString(),
      tableNum: currentTable,
      items: cart,
      total: cartTotal,
      generalComment,
      createdAt: Date.now(),
      status: 'new'
    };

    setSavedOrders(prev => {
      const others = prev.filter(o => o.id !== newOrder.id);
      return [newOrder, ...others];
    });
    
    // Если это был новый заказ, переключаемся на него
    if (!activeOrderId) setActiveOrderId(newOrder.id);
    
    alert("Черновик сохранен!");
  };

  // Отправка на кухню
  const sendToKitchen = async () => {
    if (!currentTable || cart.length === 0) return;
    if (!waiterName) return alert("Укажите ваше имя в настройках!");

    setSending(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: `Стол ${currentTable}`,
          customer_phone: '',
          delivery_address: `Зал, Стол ${currentTable}`,
          comment: generalComment || `Официант: ${waiterName}`,
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, comment: i.comment })),
          total_amount: cartTotal,
          status: 'confirmed',
          table_number: parseInt(currentTable),
          waiter_name: waiterName
        })
      });
      
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        // Удаляем из черновиков после успешной отправки
        if (activeOrderId) {
           setSavedOrders(prev => prev.filter(o => o.id !== activeOrderId));
        }
        
        // Сброс
        setActiveOrderId(null);
        setCurrentTable('');
        setCart([]);
        setGeneralComment('');
      } else {
        alert("Ошибка сервера");
      }
    } catch (e) {
      alert("Ошибка сети");
    } finally {
      setSending(false);
    }
  };

  const deleteOrder = (id: string) => {
    if(confirm('Удалить этот заказ?')) {
       setSavedOrders(prev => prev.filter(o => o.id !== id));
       if (activeOrderId === id) openOrder(null);
    }
  };

  // Фильтрация меню
  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCat === 'Все' || item.category.includes(activeCat); // Простая проверка
    return matchesSearch && matchesCat;
  });

  // --- ЭКРАН НАСТРОЕК ---
  if (isSettingsOpen) {
    return (
      <div className="min-h-screen bg-sp-darkest p-4 flex flex-col items-center justify-center">
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
          <button onClick={saveName} className="w-full bg-sp-orange text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <Save size={18} /> Сохранить
          </button>
          <button onClick={() => setIsSettingsOpen(false)} className="w-full mt-2 text-sp-cream/50 py-2">Отмена</button>
        </div>
      </div>
    );
  }

  // --- ОСНОВНОЙ ЭКРАН ---
  return (
    <div className="min-h-screen bg-sp-darkest flex flex-col">
      
      {/* Header */}
      <header className="bg-sp-dark border-b border-white/8 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
           {activeOrderId !== null && (
             <button onClick={() => openOrder(null)} className="p-2 -ml-2 text-sp-cream/60 hover:text-white">
               <ArrowLeft size={20} />
             </button>
           )}
           <div>
             <h1 className="text-sp-cream font-bold text-lg">
               {activeOrderId !== null ? `Стол ${currentTable || '?'}` : 'Выберите стол'}
             </h1>
             <p className="text-sp-cream/40 text-xs">{waiterName || 'Гость'}</p>
           </div>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-sp-cream/60 hover:text-white bg-white/5 rounded-full">
          <Settings size={20} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Левая панель: Список столов (если не выбран заказ) */}
        {activeOrderId === null && (
          <div className="w-full md:w-80 bg-sp-dark/50 border-r border-white/5 flex flex-col">
            <div className="p-4 border-b border-white/5">
              <h2 className="text-sp-cream font-bold mb-2">Активные столы</h2>
              <button onClick={() => openOrder(null)} className="w-full bg-sp-orange text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-900/20">
                + Новый заказ
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {savedOrders.length === 0 ? (
                <p className="text-center text-sp-cream/30 text-sm mt-10">Нет сохраненных заказов</p>
              ) : (
                savedOrders.map(order => (
                  <div key={order.id} onClick={() => openOrder(order.id)} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 cursor-pointer transition-all relative group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sp-orange font-bold text-lg">Стол {order.tableNum}</span>
                      <span className="text-white font-semibold">{order.total.toLocaleString()} ₽</span>
                    </div>
                    <div className="text-sp-cream/50 text-xs mb-2">{order.items.length} позиций</div>
                    {order.generalComment && (
                       <div className="text-sp-cream/70 text-xs bg-black/20 p-1.5 rounded italic mb-2">"{order.generalComment}"</div>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Правая панель: Меню и Корзина (если выбран заказ) */}
        {activeOrderId !== null && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Меню блюд */}
            <div className="flex-1 flex flex-col min-w-0 bg-sp-darkest">
               {/* Фильтры */}
               <div className="p-3 border-b border-white/5 bg-sp-dark/30 flex-shrink-0">
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-cream/30" />
                    <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-black/20 text-white pl-9 pr-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-sp-orange" />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {FOOD_CATS.map(c => (
                      <button key={c} onClick={() => setActiveCat(c)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${activeCat === c ? 'bg-sp-orange text-white' : 'bg-white/5 text-sp-cream/60'}`}>{c}</button>
                    ))}
                  </div>
               </div>

               {/* Список блюд */}
               <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 content-start">
                  {filteredMenu.map(item => (
                    <button key={item.id} onClick={() => addToCart(item)} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 text-left transition-all flex justify-between items-center group">
                       <div>
                         <div className="text-sp-cream font-medium text-sm">{item.name}</div>
                         <div className="text-sp-orange text-xs font-bold">{item.price} ₽</div>
                       </div>
                       <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sp-cream/50 group-hover:bg-sp-orange group-hover:text-white transition-colors">
                         <Plus size={16} />
                       </div>
                    </button>
                  ))}
               </div>
            </div>

            {/* Корзина (Справа на десктопе, снизу на мобильном через модалку, но здесь сделаем просто колонкой для простоты) */}
            <div className="w-full md:w-80 bg-sp-dark border-l border-white/5 flex flex-col flex-shrink-0 h-[40vh] md:h-auto">
               <div className="p-4 border-b border-white/5 bg-black/10">
                  <h3 className="text-sp-cream font-bold mb-3">Состав заказа</h3>
                  <div className="flex gap-2 mb-3">
                     <input type="number" placeholder="Стол" value={currentTable} onChange={e => setCurrentTable(e.target.value)} className="w-20 bg-black/20 text-white p-2 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-sp-orange" />
                     <input type="text" placeholder="Комментарий (напр. именинник)" value={generalComment} onChange={e => setGeneralComment(e.target.value)} className="flex-1 bg-black/20 text-white p-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-sp-orange" />
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {cart.length === 0 ? (
                    <div className="text-center text-sp-cream/30 text-sm py-10">Добавьте блюда</div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="bg-white/5 rounded-lg p-2">
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-sp-cream text-sm font-medium truncate mr-2">{item.name}</span>
                            <span className="text-sp-orange text-sm font-bold">{item.price * item.quantity} ₽</span>
                         </div>
                         <div className="flex items-center justify-between">
                            <input 
                              type="text" 
                              placeholder="Заметка к блюду" 
                              value={item.comment || ''} 
                              onChange={(e) => updateItemComment(item.id, e.target.value)}
                              className="bg-black/20 text-white text-[10px] rounded px-2 py-1 w-full mr-2 outline-none focus:ring-1 focus:ring-sp-orange/50"
                            />
                            <div className="flex items-center gap-2 bg-black/20 rounded px-1">
                               <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-sp-cream hover:text-red-400"><Minus size={12}/></button>
                               <span className="text-white text-xs font-bold w-4 text-center">{item.quantity}</span>
                               <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-sp-cream hover:text-sp-orange"><Plus size={12}/></button>
                            </div>
                         </div>
                      </div>
                    ))
                  )}
               </div>

               <div className="p-4 border-t border-white/5 bg-black/20">
                  <div className="flex justify-between items-center mb-3">
                     <span className="text-sp-cream/50 text-sm">Итого:</span>
                     <span className="text-sp-orange font-bold text-xl">{cartTotal.toLocaleString()} ₽</span>
                  </div>
                  
                  {showSuccess && (
                    <div className="mb-3 bg-green-500/20 text-green-400 text-center py-2 rounded-lg text-sm font-bold animate-pulse">
                      ✅ Отправлено на кухню!
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                     <button onClick={saveDraft} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl text-sm">
                        Сохранить
                     </button>
                     <button 
                       onClick={sendToKitchen} 
                       disabled={!currentTable || cart.length === 0 || sending}
                       className={`bg-sp-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 ${(!currentTable || cart.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                     >
                        {sending ? '...' : <><Send size={14}/> На кухню</>}
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