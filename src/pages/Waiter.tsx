import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, Send, RefreshCw, ChevronDown, ChevronUp, User, X, ShoppingCart, MessageSquare, ArrowLeft } from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  is_bar?: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
  comment?: string;
}

interface ActiveOrder {
  id: number;
  table_number: number;
  waiter_name: string;
  items: CartItem[];
  total_amount: number;
  comment?: string; // Общий комментарий к столу
  status: string;
}

const FOOD_CATS = ['Блюда с мангала','Шашлык на костях','Овощи на мангале',
  'Рыба на мангале','Садж на мангале','Супы',
  'Горячие блюда','Шах плов','Паста','Гарниры',
  'Салаты','Холодные закуски','Закуски к пиву','Соусы',
  'Напитки','Авторские чаи','Мороженое','Десерты'];
const BAR_CATS  = ['Коктейли','Вино','Пиво','Виски','Текила','Ром','Безалкогольные'];

export default function Waiter() {
  const [authed, setAuthed] = useState<any>(null); 
  const [pin, setPin] = useState('');
  const [waiterName, setWaiterName] = useState('');
  const [pinError, setPinError] = useState('');

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Корзина текущего редактируемого стола
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTable, setCurrentTable] = useState<string>('');
  const [generalComment, setGeneralComment] = useState(''); // Общий комментарий к столу
  
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [showBar, setShowBar] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['all']));
  
  // Панель активных столов
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [viewingOrderId, setViewingOrderId] = useState<number | null>(null); // Если смотрим существующий заказ

  const WAITER_PIN = '1234'; 

  useEffect(() => {
    const saved = sessionStorage.getItem('waiter_session');
    if (saved) setAuthed(JSON.parse(saved));
  }, []);

  // Загрузка активных заказов этого официанта при входе
  useEffect(() => {
    if (!authed) return;
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => {
        // Фильтруем только активные заказы этого официанта
        const myOrders = data.filter((o: any) => 
          o.waiter_name === authed.name && 
          !['delivered', 'cancelled'].includes(o.status)
        );
        setActiveOrders(myOrders);
      });
  }, [authed, success]); // Обновляем после успешной отправки

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin !== WAITER_PIN) { setPinError('Неверный PIN'); return; }
    if (!waiterName.trim()) { setPinError('Введите ваше имя'); return; }
    const sessionData = { name: waiterName.trim(), pinVerified: true };
    sessionStorage.setItem('waiter_session', JSON.stringify(sessionData));
    setAuthed(sessionData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('waiter_session');
    setAuthed(null); setWaiterName(''); setPin('');
  };

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch(`/api/menu?bar=${showBar}`);
      const data = await res.json();
      setMenu(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [showBar]);

  useEffect(() => { if (authed) fetchMenu(); }, [authed, fetchMenu]);

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
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const categories = (showBar ? BAR_CATS : FOOD_CATS);
  const filtered = menu.filter(item => {
    if (activeCat !== 'all' && item.category !== activeCat) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = categories.map(c => ({ cat: c, items: filtered.filter(i => i.category === c) })).filter(g => g.items.length > 0);

  const sendOrder = async () => {
    if (cart.length === 0 && !viewingOrderId) return;
    if (!currentTable) { alert("Укажите номер стола!"); return; }

    setSending(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: `Стол №${currentTable} (Официант: ${authed?.name})`,
          customer_phone: '+7 (925) 767-77-78',
          delivery_address: `Зал, Стол ${currentTable}`,
          comment: generalComment || `Заказ от: ${authed?.name}`, // Общий комментарий
          items: cart.map(i => ({ 
            id: i.id, 
            name: i.name, 
            price: i.price, 
            quantity: i.quantity,
            comment: i.comment || '' 
          })),
          total_amount: cartTotal,
          status: 'confirmed',
          table_number: parseInt(currentTable),
          waiter_name: authed?.name
        })
      });
      const data = await res.json();
      if (data.success || data.id) {
        setSuccess(data.id);
        setCart([]);
        setGeneralComment('');
        setCurrentTable('');
        setViewingOrderId(null);
      } else {
        alert('Ошибка: ' + (data.error || 'Неизвестно'));
      }
    } catch (e) { console.error(e); alert('Ошибка сети'); }
    finally { setSending(false); }
  };

  // Открыть существующий заказ для редактирования
  const openOrder = (order: ActiveOrder) => {
    setViewingOrderId(order.id);
    setCurrentTable(String(order.table_number));
    setCart(order.items || []);
    setGeneralComment(order.comment || '');
    // На мобильном закрываем список столов, открываем корзину/меню
    // В десктопе просто заполняем поля
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-sp-darkest flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-sp-dark rounded-2xl p-8 w-full max-w-xs border border-white/8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-sp-orange/20 text-sp-orange rounded-full flex items-center justify-center mx-auto mb-4"><User size={32} /></div>
            <h1 className="font-display text-xl text-sp-cream font-bold">Вход для персонала</h1>
            <p className="text-sp-cream/40 text-sm mt-1">Соль и Перец</p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="form-label text-sp-cream/60 text-xs uppercase font-bold mb-1 block">Ваше имя</label>
              <input type="text" placeholder="Например: Александр" value={waiterName} onChange={e => setWaiterName(e.target.value)} className="form-input text-left" autoFocus />
            </div>
            <div>
              <label className="form-label text-sp-cream/60 text-xs uppercase font-bold mb-1 block">PIN-код</label>
              <input type="password" inputMode="numeric" maxLength={6} placeholder="••••" value={pin} onChange={e => setPin(e.target.value)} className="form-input text-center text-xl tracking-widest" />
            </div>
            {pinError && <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">{pinError}</p>}
            <button type="submit" className="btn-primary mt-2">Войти в систему</button>
          </form>
          <p className="text-sp-cream/20 text-xs text-center mt-6">PIN по умолчанию: 1234</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sp-darkest flex flex-col relative">
      {/* Header */}
      <div className="bg-sp-dark border-b border-white/8 px-4 py-3 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sp-orange rounded-full flex items-center justify-center text-white font-bold text-xs">{authed.name.charAt(0).toUpperCase()}</div>
          <div>
            <h1 className="text-sp-cream font-bold text-sm">{authed.name}</h1>
            <p className="text-sp-cream/30 text-[10px] uppercase tracking-wider">Официант</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchMenu} className="p-2 text-sp-cream/40 hover:text-sp-cream transition-colors"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
          <button onClick={handleLogout} className="text-sp-cream/30 text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 hover:text-sp-cream transition-all">Выйти</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Левая часть: Меню или Список столов */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/5">
          
          {/* Если открыт список активных столов (только для десктопа или по кнопке) */}
          {viewingOrderId === null && (
             <div className="p-4 overflow-y-auto h-full">
                <h2 className="text-sp-cream font-bold text-lg mb-4 flex items-center gap-2">
                   <ShoppingCart size={20} className="text-sp-orange"/> Мои активные столы
                </h2>
                {activeOrders.length === 0 ? (
                   <div className="text-center text-sp-cream/30 mt-10">Нет активных заказов</div>
                ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeOrders.map(order => (
                         <button 
                           key={order.id} 
                           onClick={() => openOrder(order)}
                           className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-left transition-all"
                         >
                            <div className="flex justify-between items-start mb-2">
                               <span className="text-sp-orange font-bold text-xl">Стол {order.table_number}</span>
                               <span className="text-sp-cream font-bold">{order.total_amount.toLocaleString()} ₽</span>
                            </div>
                            <div className="text-sp-cream/60 text-xs mb-2">
                               {order.items?.length || 0} позиций
                            </div>
                            {order.comment && (
                               <div className="bg-sp-orange/10 text-sp-orange/80 text-xs p-2 rounded mb-2 flex items-start gap-1">
                                  <MessageSquare size={12} className="mt-0.5 flex-shrink-0"/>
                                  {order.comment}
                               </div>
                            )}
                            <div className="text-sp-cream/40 text-[10px]">Нажмите, чтобы добавить блюда</div>
                         </button>
                      ))}
                   </div>
                )}
             </div>
          )}

          {/* Если выбран стол для редактирования - показываем меню */}
          {viewingOrderId !== null && (
             <>
                {/* Filters */}
                <div className="bg-sp-dark/80 backdrop-blur px-3 py-2 border-b border-white/5 flex-shrink-0">
                   <div className="flex items-center gap-2 mb-2">
                      <button onClick={() => setViewingOrderId(null)} className="text-sp-cream/60 hover:text-white flex items-center gap-1 text-xs">
                         <ArrowLeft size={12}/> Назад к столам
                      </button>
                   </div>
                   <div className="flex gap-2 mb-2">
                     <button onClick={() => { setShowBar(false); setActiveCat('all'); }} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${!showBar ? 'bg-sp-orange text-white' : 'bg-white/8 text-sp-cream/50'}`}>🍽 Кухня</button>
                     <button onClick={() => { setShowBar(true); setActiveCat('all'); }} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${showBar ? 'bg-sp-orange text-white' : 'bg-white/8 text-sp-cream/50'}`}>🍸 Бар</button>
                   </div>
                   <div className="relative">
                     <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-cream/30" />
                     <input type="text" placeholder="Поиск блюда..." value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-8 py-1.5 text-sm w-full" />
                   </div>
                   <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                     <button onClick={() => setActiveCat('all')} className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 transition-all ${activeCat === 'all' ? 'bg-sp-orange/20 text-sp-orange border border-sp-orange/30' : 'bg-white/5 text-sp-cream/40'}`}>Всё</button>
                     {categories.map(c => (
                       <button key={c} onClick={() => setActiveCat(c)} className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 transition-all whitespace-nowrap ${activeCat === c ? 'bg-sp-orange/20 text-sp-orange border border-sp-orange/30' : 'bg-white/5 text-sp-cream/40'}`}>{c}</button>
                     ))}
                   </div>
                </div>

                {/* Menu items */}
                <div className="flex-1 overflow-y-auto px-3 py-2 pb-20 md:pb-2">
                  {loading ? (
                    <div className="text-center py-10 text-sp-cream/30">Загружаем меню...</div>
                  ) : activeCat !== 'all' ? (
                    <div className="flex flex-col gap-1.5">
                      {filtered.map(item => <WaiterItem key={item.id} item={item} cart={cart} onAdd={() => addToCart(item)} />)}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {grouped.map(g => (
                        <div key={g.cat}>
                          <button onClick={() => setExpandedCats(prev => { const s = new Set(prev); s.has(g.cat) ? s.delete(g.cat) : s.add(g.cat); return s; })} className="w-full flex items-center justify-between py-2 text-left">
                            <span className="text-sp-cream/60 text-xs font-semibold uppercase tracking-wider">{g.cat} ({g.items.length})</span>
                            {expandedCats.has(g.cat) ? <ChevronUp size={14} className="text-sp-cream/30" /> : <ChevronDown size={14} className="text-sp-cream/30" />}
                          </button>
                          <AnimatePresence>
                            {expandedCats.has(g.cat) && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="flex flex-col gap-1.5 pb-2">
                                  {g.items.map(item => <WaiterItem key={item.id} item={item} cart={cart} onAdd={() => addToCart(item)} />)}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  )}
                  {!loading && filtered.length === 0 && <div className="text-center py-10 text-sp-cream/30">Ничего не найдено</div>}
                </div>
             </>
          )}
        </div>

        {/* Правая часть: Корзина (Desktop) */}
        <div className="w-80 bg-sp-dark border-l border-white/8 flex flex-col hidden md:flex flex-shrink-0">
           <CartPanel 
             cart={cart} cartTotal={cartTotal} cartCount={cartCount} 
             tableNum={currentTable} setTableNum={setCurrentTable} 
             generalComment={generalComment} setGeneralComment={setGeneralComment}
             onUpdateQty={updateQty} updateItemComment={updateItemComment} 
             onSend={sendOrder} sending={sending} success={success} 
             onDismissSuccess={() => setSuccess(null)} waiterName={authed.name} 
             viewingOrderId={viewingOrderId}
           />
        </div>
      </div>

      {/* Mobile Bottom Bar & Drawer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-sp-dark border-t border-white/8 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <button 
          onClick={() => setViewingOrderId(viewingOrderId === null ? -1 : viewingOrderId)} // -1 means open empty cart for new order logic if needed, but here we just toggle view
          className="w-full flex items-center justify-between px-4 py-3 active:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
             {viewingOrderId === null ? (
                <span className="text-sp-cream font-semibold text-sm">Выбрать стол для заказа</span>
             ) : (
                <>
                  <div className="relative">
                    <ShoppingCart className="text-sp-orange" size={20} />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-sp-orange text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sp-cream font-semibold text-sm">Заказ стола {currentTable || '?'}</span>
                </>
             )}
          </div>
          <div className="flex items-center gap-2">
            {cartTotal > 0 && <span className="text-sp-orange font-bold text-lg">{cartTotal.toLocaleString('ru-RU')} ₽</span>}
            <ChevronUp size={20} className="text-sp-cream/40" />
          </div>
        </button>
      </div>

      {/* Mobile Cart Modal Overlay */}
      <AnimatePresence>
        {viewingOrderId !== null && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setViewingOrderId(null)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-sp-dark rounded-t-3xl border-t border-white/10 flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-white/8 flex items-center justify-between">
                <h2 className="text-sp-cream font-bold text-lg">Заказ стола {currentTable || '?'}</h2>
                <button onClick={() => setViewingOrderId(null)} className="p-2 bg-white/5 rounded-full text-sp-cream/60 hover:text-white"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <CartPanel 
                  cart={cart} cartTotal={cartTotal} cartCount={cartCount} 
                  tableNum={currentTable} setTableNum={setCurrentTable} 
                  generalComment={generalComment} setGeneralComment={setGeneralComment}
                  onUpdateQty={updateQty} updateItemComment={updateItemComment}
                  onSend={() => { sendOrder(); setViewingOrderId(null); }} 
                  sending={sending} success={success} 
                  onDismissSuccess={() => setSuccess(null)} 
                  waiterName={authed.name} 
                  isMobile={true}
                  viewingOrderId={viewingOrderId}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function WaiterItem({ item, cart, onAdd }: { item: MenuItem; cart: CartItem[]; onAdd: () => void }) {
  const inCart = cart.find(i => i.id === item.id);
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onAdd}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
        inCart ? 'border-sp-orange/50 bg-sp-orange/10' : 'border-white/5 bg-white/3 hover:bg-white/6 hover:border-white/15'
      }`}
    >
      <div className="flex-1 min-w-0 mr-3">
        <div className="text-sp-cream text-base font-medium truncate">{item.name}</div>
        <div className="text-sp-orange text-sm font-semibold">{item.price.toLocaleString('ru-RU')} ₽</div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {inCart && <span className="bg-sp-orange text-white text-sm rounded-full w-6 h-6 flex items-center justify-center font-bold">{inCart.quantity}</span>}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${inCart ? 'bg-sp-orange text-white' : 'bg-white/10 text-sp-cream/50'}`}>
          <Plus size={18} />
        </div>
      </div>
    </motion.button>
  );
}

interface CartPanelProps {
  cart: CartItem[]; cartTotal: number; cartCount: number;
  tableNum: string; setTableNum: (v: string) => void;
  generalComment: string; setGeneralComment: (v: string) => void;
  onUpdateQty: (id: number, delta: number) => void;
  updateItemComment: (id: number, text: string) => void;
  onSend: () => void; sending: boolean;
  success: number | null; onDismissSuccess: () => void;
  waiterName: string;
  isMobile?: boolean;
  viewingOrderId: number | null;
}

function CartPanel({ cart, cartTotal, cartCount, tableNum, setTableNum, generalComment, setGeneralComment, onUpdateQty, updateItemComment, onSend, sending, success, onDismissSuccess, waiterName, isMobile, viewingOrderId }: CartPanelProps) {
  return (
    <div className={`flex flex-col ${isMobile ? 'h-full' : 'h-full'}`}>
      {!isMobile && (
         <div className="px-4 py-3 border-b border-white/8 bg-black/20">
           <h2 className="text-sp-cream font-semibold text-sm flex items-center gap-2">
             {viewingOrderId ? 'Редактирование заказа' : 'Новый заказ'} 
             {cartCount > 0 && <span className="bg-sp-orange text-white text-xs rounded-full px-2 py-0.5">{cartCount}</span>}
           </h2>
           <p className="text-sp-cream/30 text-[10px] mt-0.5">Официант: {waiterName}</p>
         </div>
      )}

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-3 mt-3 bg-green-500/15 border border-green-500/25 rounded-xl p-3 text-center">
            <div className="text-green-400 font-semibold text-sm">✅ Заказ отправлен!</div>
            <button onClick={onDismissSuccess} className="text-green-400/60 text-xs mt-1 hover:text-green-400">Закрыть</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {cart.length === 0 ? (
          <div className="text-center py-8 text-sp-cream/20 text-sm">Добавьте блюда из меню</div>
        ) : (
          <div className="flex flex-col gap-3">
            {cart.map(item => (
              <div key={item.id} className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between items-start mb-2">
                   <div className="flex-1 mr-2">
                     <div className="text-sp-cream text-sm font-medium">{item.name}</div>
                     <div className="text-sp-orange text-xs">{(item.price * item.quantity).toLocaleString()} ₽</div>
                   </div>
                   <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1">
                      <button onClick={() => onUpdateQty(item.id, -1)} className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-sp-cream hover:bg-red-500/20"><Minus size={14} /></button>
                      <span className="text-sp-cream text-sm w-6 text-center font-bold">{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.id, 1)} className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-sp-cream hover:bg-sp-orange/20"><Plus size={14} /></button>
                   </div>
                </div>
                
                {/* Поле для комментария к блюду */}
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Заметка к блюду (напр. без лука)" 
                    value={item.comment || ''}
                    onChange={(e) => updateItemComment(item.id, e.target.value)}
                    className="w-full bg-black/20 text-white text-xs rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-sp-orange placeholder-white/20"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`p-4 border-t border-white/8 bg-black/20 ${isMobile ? 'pb-8' : ''}`}>
        <div className="flex flex-col gap-2 mb-3">
           <div className="flex gap-2">
              <input type="number" placeholder="Стол №" value={tableNum} onChange={e => setTableNum(e.target.value)} className="form-input py-3 text-base bg-white/5 border-white/10 focus:border-sp-orange w-24 text-center font-bold" />
              <input type="text" placeholder="Общий комментарий (напр. именинник)" value={generalComment} onChange={e => setGeneralComment(e.target.value)} className="form-input py-3 text-base bg-white/5 border-white/10 focus:border-sp-orange flex-1" />
           </div>
        </div>
        
        <div className="flex justify-between items-center py-2 mb-2">
           <span className="text-sp-cream/50 text-sm">Итого к оплате:</span>
           <span className="text-sp-orange font-bold text-2xl">{cartTotal.toLocaleString('ru-RU')} ₽</span>
        </div>

        <button 
          onClick={onSend} 
          disabled={cart.length === 0 || !tableNum || sending} 
          className={`btn-primary w-full flex items-center justify-center gap-2 text-base py-4 mt-1 ${(!tableNum || cart.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {sending ? <><RefreshCw size={18} className="animate-spin" />Отправляем...</> : <><Send size={18} />Отправить на кухню</>}
        </button>
      </div>
    </div>
  );
}