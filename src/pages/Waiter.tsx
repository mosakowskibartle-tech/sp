import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, Send, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

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
}

const FOOD_CATS = ['Блюда с мангала','Шашлык на костях','Овощи на мангале',
  'Рыба на мангале','Садж на мангале','Супы',
  'Горячие блюда','Шах плов','Паста','Гарниры',
  'Салаты','Холодные закуски','Закуски к пиву','Соусы',
  'Напитки','Авторские чаи','Мороженое','Десерты'];
const BAR_CATS  = ['Коктейли','Вино','Пиво','Виски','Текила','Ром','Безалкогольные'];

export default function Waiter() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('waiter_auth'));
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [showBar, setShowBar] = useState(false);
  const [tableNum, setTableNum] = useState('');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['all']));

  const WAITER_PIN = '1234'; // Simple PIN for waiter access

  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === WAITER_PIN) {
      sessionStorage.setItem('waiter_auth', '1');
      setAuthed(true);
    } else {
      setPinError('Неверный PIN');
    }
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
    if (cart.length === 0) return;
    setSending(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: `Стол №${tableNum || '?'} (Официант)`,
          customer_phone: '+7 (925) 767-77-78',
          delivery_address: tableNum ? `Стол №${tableNum}` : 'В зале',
          comment: comment || 'Заказ через официанта',
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          total_amount: cartTotal,
          status: 'confirmed', // Already confirmed since waiter is placing it
        })
      });
      const data = await res.json();
      setSuccess(data.id);
      setCart([]);
      setComment('');
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-sp-darkest flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-sp-dark rounded-2xl p-8 w-full max-w-xs border border-white/8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">👨‍🍳</div>
            <h1 className="font-display text-xl text-sp-cream font-bold">Меню официанта</h1>
            <p className="text-sp-cream/40 text-sm mt-1">Соль и Перец</p>
          </div>
          <form onSubmit={handlePinLogin} className="flex flex-col gap-4">
            <div>
              <label className="form-label">PIN-код</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••"
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="form-input text-center text-xl tracking-widest"
                autoFocus
              />
            </div>
            {pinError && <p className="text-red-400 text-sm text-center">{pinError}</p>}
            <button type="submit" className="btn-primary">Войти</button>
          </form>
          <p className="text-sp-cream/20 text-xs text-center mt-4">PIN: 1234</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sp-darkest flex flex-col">
      {/* Header */}
      <div className="bg-sp-dark border-b border-white/8 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-sp-cream font-bold text-base">👨‍🍳 Меню официанта</h1>
          <p className="text-sp-cream/30 text-xs">Быстрый ввод заказа</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchMenu} className="p-2 text-sp-cream/40 hover:text-sp-cream transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { sessionStorage.removeItem('waiter_auth'); setAuthed(false); }} className="text-sp-cream/30 text-xs px-2 py-1 rounded-lg hover:bg-white/5">
            Выйти
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Menu panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="bg-sp-dark/80 backdrop-blur px-3 py-2 border-b border-white/5 flex-shrink-0">
            <div className="flex gap-2 mb-2">
              <button onClick={() => { setShowBar(false); setActiveCat('all'); }} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${!showBar ? 'bg-sp-orange text-white' : 'bg-white/8 text-sp-cream/50'}`}>🍽 Кухня</button>
              <button onClick={() => { setShowBar(true); setActiveCat('all'); }} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${showBar ? 'bg-sp-orange text-white' : 'bg-white/8 text-sp-cream/50'}`}>🍸 Бар</button>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-cream/30" />
              <input type="text" placeholder="Поиск блюда..." value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-8 py-1.5 text-sm w-full" />
            </div>
            {/* Category pills */}
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => setActiveCat('all')} className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 transition-all ${activeCat === 'all' ? 'bg-sp-orange/20 text-sp-orange border border-sp-orange/30' : 'bg-white/5 text-sp-cream/40'}`}>Всё</button>
              {categories.map(c => (
                <button key={c} onClick={() => setActiveCat(c)} className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 transition-all whitespace-nowrap ${activeCat === c ? 'bg-sp-orange/20 text-sp-orange border border-sp-orange/30' : 'bg-white/5 text-sp-cream/40'}`}>{c}</button>
              ))}
            </div>
          </div>

          {/* Menu items */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
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
                    <button
                      onClick={() => setExpandedCats(prev => { const s = new Set(prev); s.has(g.cat) ? s.delete(g.cat) : s.add(g.cat); return s; })}
                      className="w-full flex items-center justify-between py-2 text-left"
                    >
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
        </div>

        {/* Cart panel - fixed right side on desktop, bottom on mobile */}
        <div className="w-72 bg-sp-dark border-l border-white/8 flex flex-col hidden md:flex flex-shrink-0">
          <CartPanel cart={cart} cartTotal={cartTotal} cartCount={cartCount} tableNum={tableNum} setTableNum={setTableNum} comment={comment} setComment={setComment} onUpdateQty={updateQty} onSend={sendOrder} sending={sending} success={success} onDismissSuccess={() => setSuccess(null)} />
        </div>
      </div>

      {/* Mobile cart bottom bar */}
      <div className="md:hidden bg-sp-dark border-t border-white/8 flex-shrink-0">
        <MobileCart cart={cart} cartTotal={cartTotal} cartCount={cartCount} tableNum={tableNum} setTableNum={setTableNum} comment={comment} setComment={setComment} onUpdateQty={updateQty} onSend={sendOrder} sending={sending} success={success} onDismissSuccess={() => setSuccess(null)} />
      </div>
    </div>
  );
}

function WaiterItem({ item, cart, onAdd }: { item: MenuItem; cart: CartItem[]; onAdd: () => void }) {
  const inCart = cart.find(i => i.id === item.id);
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onAdd}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-left ${
        inCart ? 'border-sp-orange/30 bg-sp-orange/8' : 'border-white/5 bg-white/3 hover:bg-white/6 hover:border-white/15'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sp-cream text-sm font-medium truncate">{item.name}</div>
        <div className="text-sp-orange text-xs font-semibold">{item.price.toLocaleString('ru-RU')} ₽</div>
      </div>
      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
        {inCart && <span className="bg-sp-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{inCart.quantity}</span>}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${inCart ? 'bg-sp-orange text-white' : 'bg-white/10 text-sp-cream/50'}`}>
          <Plus size={14} />
        </div>
      </div>
    </motion.button>
  );
}

interface CartPanelProps {
  cart: CartItem[]; cartTotal: number; cartCount: number;
  tableNum: string; setTableNum: (v: string) => void;
  comment: string; setComment: (v: string) => void;
  onUpdateQty: (id: number, delta: number) => void;
  onSend: () => void; sending: boolean;
  success: number | null; onDismissSuccess: () => void;
}

function CartPanel({ cart, cartTotal, cartCount, tableNum, setTableNum, comment, setComment, onUpdateQty, onSend, sending, success, onDismissSuccess }: CartPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/8">
        <h2 className="text-sp-cream font-semibold text-sm">Заказ {cartCount > 0 && <span className="bg-sp-orange text-white text-xs rounded-full px-2 py-0.5 ml-1">{cartCount}</span>}</h2>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-3 mt-3 bg-green-500/15 border border-green-500/25 rounded-xl p-3 text-center">
            <div className="text-green-400 font-semibold text-sm">✅ Заказ #{success} принят!</div>
            <button onClick={onDismissSuccess} className="text-green-400/60 text-xs mt-1 hover:text-green-400">Закрыть</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {cart.length === 0 ? (
          <div className="text-center py-8 text-sp-cream/20 text-sm">Добавьте блюда</div>
        ) : (
          <div className="flex flex-col gap-2">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sp-cream text-xs font-medium truncate">{item.name}</div>
                  <div className="text-sp-orange text-xs">{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onUpdateQty(item.id, -1)} className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center text-sp-cream/60 hover:bg-red-500/20 hover:text-red-400 transition-all"><Minus size={10} /></button>
                  <span className="text-sp-cream text-xs w-5 text-center">{item.quantity}</span>
                  <button onClick={() => onUpdateQty(item.id, 1)} className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center text-sp-cream/60 hover:bg-sp-orange/20 hover:text-sp-orange transition-all"><Plus size={10} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-3 border-t border-white/8 flex flex-col gap-2">
        <input type="text" placeholder="Стол №" value={tableNum} onChange={e => setTableNum(e.target.value)} className="form-input py-2 text-sm" />
        <input type="text" placeholder="Комментарий" value={comment} onChange={e => setComment(e.target.value)} className="form-input py-2 text-sm" />
        {cartTotal > 0 && <div className="flex justify-between text-sm"><span className="text-sp-cream/50">Итого:</span><span className="text-sp-orange font-bold">{cartTotal.toLocaleString('ru-RU')} ₽</span></div>}
        <button onClick={onSend} disabled={cart.length === 0 || sending} className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5">
          {sending ? <><RefreshCw size={14} className="animate-spin" />Отправляем...</> : <><Send size={14} />Отправить заказ</>}
        </button>
      </div>
    </div>
  );
}

function MobileCart(props: CartPanelProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-3">
        <span className="text-sp-cream font-semibold text-sm">Заказ {props.cartCount > 0 && <span className="bg-sp-orange text-white text-xs rounded-full px-2 py-0.5 ml-1">{props.cartCount}</span>}</span>
        <div className="flex items-center gap-2">
          {props.cartTotal > 0 && <span className="text-sp-orange font-bold text-sm">{props.cartTotal.toLocaleString('ru-RU')} ₽</span>}
          {open ? <ChevronDown size={16} className="text-sp-cream/40" /> : <ChevronUp size={16} className="text-sp-cream/40" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-white/8">
            <div className="max-h-64 overflow-y-auto">
              <CartPanel {...props} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
