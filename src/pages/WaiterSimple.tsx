import { useState, useEffect } from 'react';
import { Trash2, Send } from 'lucide-react'; // Оставили только используемые

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'Шашлык', label: 'Шашлык' },
  { id: 'Мангал', label: 'Мангал' },
  { id: 'Горячее', label: 'Горячее' },
  { id: 'Салаты', label: 'Салаты' },
  { id: 'Закуски', label: 'Закуски' },
  { id: 'Напитки', label: 'Напитки' },
];

export default function WaiterSimple() {
  const [authed, setAuthed] = useState(false);
  const [waiterName, setWaiterName] = useState('');
  
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNum, setTableNum] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!authed) return;
    fetch('/api/menu')
      .then(r => r.json())
      .then(data => setMenu(Array.isArray(data) ? data : []));
  }, [authed]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const sendOrder = async () => {
    if (!tableNum || cart.length === 0) return;
    setSending(true);
    
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: `Стол ${tableNum}`,
          customer_phone: '', 
          delivery_address: `Зал, Стол ${tableNum}`,
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          total_amount: cartTotal,
          status: 'confirmed',
          table_number: parseInt(tableNum),
          waiter_name: waiterName
        })
      });
      
      if (res.ok) {
        setSuccessMsg(`Заказ на стол ${tableNum} отправлен!`);
        setCart([]);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (e) {
      alert('Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  const filteredMenu = menu.filter(item => {
    const matchesCat = activeCat === 'all' || item.category.includes(activeCat);
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-sm border border-gray-700">
          <h2 className="text-white text-2xl font-bold mb-6 text-center">Вход для официанта</h2>
          <input 
            type="text" 
            placeholder="Ваше имя" 
            className="w-full bg-gray-700 text-white p-3 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-orange-500"
            value={waiterName}
            onChange={e => setWaiterName(e.target.value)}
          />
          <button 
            onClick={() => waiterName && setAuthed(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Начать работу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex overflow-hidden">
      
      {/* ЛЕВАЯ ЧАСТЬ: МЕНЮ */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 bg-gray-800 border-b border-gray-700 flex-shrink-0">
          <div className="flex gap-2 mb-3">
             <input 
               type="text" 
               placeholder="🔍 Поиск блюда..." 
               className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
             <div className="flex items-center gap-2 bg-gray-700 px-3 rounded-lg">
                <span className="text-gray-400 text-sm">Стол:</span>
                <input 
                  type="number" 
                  className="bg-transparent text-white font-bold w-12 outline-none text-center"
                  value={tableNum}
                  onChange={e => setTableNum(e.target.value)}
                  placeholder="#"
                />
             </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCat === cat.id 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredMenu.map(item => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="relative bg-gray-800 hover:bg-gray-700 active:scale-95 transition-all rounded-xl p-3 flex flex-col items-start text-left border border-gray-700 h-32 justify-between group"
              >
                <div>
                  <div className="text-white font-semibold text-sm leading-tight mb-1 line-clamp-2">{item.name}</div>
                  <div className="text-orange-400 font-bold text-xs">{item.price} ₽</div>
                </div>
                {cart.find(c => c.id === item.id) && (
                   <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg">
                     {cart.find(c => c.id === item.id)?.quantity}
                   </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: КОРЗИНА */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col shadow-2xl z-10">
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            🛒 Заказ <span className="text-orange-500">#{tableNum || '?'}</span>
          </h2>
          <div className="text-gray-400 text-xs mt-1">Официант: {waiterName}</div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 mt-10 text-sm">
              Корзина пуста<br/>Выберите блюда слева
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-gray-700/50 rounded-lg p-2 flex items-center justify-between group">
                <div className="flex-1 min-w-0 mr-2">
                  <div className="text-white text-sm font-medium truncate">{item.name}</div>
                  <div className="text-gray-400 text-xs">{item.price * item.quantity} ₽</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded text-white flex items-center justify-center text-xs">-</button>
                  <span className="text-white font-bold w-4 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded text-white flex items-center justify-center text-xs">+</button>
                  <button onClick={() => removeFromCart(item.id)} className="ml-1 text-red-400 hover:text-red-300">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400">Итого:</span>
            <span className="text-white font-bold text-xl">{cartTotal.toLocaleString()} ₽</span>
          </div>
          
          {successMsg ? (
             <div className="bg-green-500/20 text-green-400 p-3 rounded-lg text-center text-sm font-medium animate-pulse">
               {successMsg}
             </div>
          ) : (
            <button 
              onClick={sendOrder}
              disabled={!tableNum || cart.length === 0 || sending}
              className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
                !tableNum || cart.length === 0 
                  ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                  : 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20'
              }`}
            >
              {sending ? 'Отправка...' : <><Send size={18} /> Отправить на кухню</>}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}