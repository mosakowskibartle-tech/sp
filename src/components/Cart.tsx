import { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, Send, Tag, MapPin, Clock } from 'lucide-react';
import { useCart } from '../lib/useCart';
import { motion, AnimatePresence } from 'framer-motion';

interface CartProps { open: boolean; onClose: () => void; }
interface DeliveryZone { id: number; name: string; description: string; min_order: number; delivery_price: number; free_from: number; is_active?: boolean; }

const DELIVERY_SLOTS = ['09:00–11:00','11:00–13:00','13:00–15:00','15:00–17:00','17:00–19:00','19:00–21:00','21:00–23:00','Как можно скорее'];

export default function Cart({ open, onClose }: CartProps) {
  const { items, total, remove, updateQty, clear } = useCart();
  const [step, setStep] = useState<'cart' | 'form' | 'success'>('cart');
  const [form, setForm] = useState({ name: '', phone: '', address: '', comment: '', delivery_slot: '' });
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<{ discount_amount: number; code: string; discount_type: string; discount_value: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // delivery zones — skip for shared hosting (no server)
    setZones([{ id: 1, name: 'Сходня', description: 'Доставка по Сходне', min_order: 0, delivery_price: 0, free_from: 0, is_active: true }]);
  }, []);

  const deliveryPrice = selectedZone
    ? (total >= selectedZone.free_from && selectedZone.free_from > 0 ? 0 : selectedZone.delivery_price)
    : 0;

  const discount = promoResult?.discount_amount ?? 0;
  const finalTotal = Math.max(0, total + deliveryPrice - discount);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoError(''); setPromoResult(null);
    try {
      setPromoError('Промокоды временно недоступны');
    } catch { setPromoError('Ошибка соединения'); }
    finally { setPromoLoading(false); }
  };

  const handleOrder = async () => {
    if (!form.name || !form.phone) { setError('Заполните имя и телефон'); return; }
    if (selectedZone && total < selectedZone.min_order) {
      setError(`Минимальный заказ для зоны «${selectedZone.name}» — ${selectedZone.min_order} ₽`);
      return;
    }
    setLoading(true); setError('');
    try {
      const { createOrder } = await import('../lib/db');
      await createOrder({
        customer_name: form.name,
        customer_phone: form.phone,
        delivery_address: form.address,
        comment: [form.comment, form.delivery_slot ? `Время: ${form.delivery_slot}` : ''].filter(Boolean).join(' | '),
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        total_amount: finalTotal,
        status: 'new',
      });
      setStep('success');
      clear();
    } catch { setError('Ошибка соединения. Попробуйте ещё раз.'); }
    finally { setLoading(false); }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => { setStep('cart'); setForm({ name: '', phone: '', address: '', comment: '', delivery_slot: '' }); setError(''); setPromoCode(''); setPromoResult(null); setPromoError(''); setSelectedZone(null); }, 350);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/65 z-50 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-sp-dark z-50 flex flex-col shadow-2xl border-l border-white/5"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sp-orange/20 flex items-center justify-center">
                  <ShoppingBag size={16} className="text-sp-orange" />
                </div>
                <h2 className="font-display text-lg text-sp-cream font-bold">
                  {step === 'form' ? 'Оформление заказа' : step === 'success' ? 'Готово!' : 'Корзина'}
                </h2>
              </div>
              <button onClick={handleClose} className="text-sp-cream/40 hover:text-sp-cream transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            {/* SUCCESS */}
            {step === 'success' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.5 }} className="text-6xl mb-4">🎉</motion.div>
                <h3 className="font-display text-2xl text-sp-orange mb-2">Заказ принят!</h3>
                <p className="text-sp-cream/60 mb-6 text-sm">Мы свяжемся с вами для подтверждения</p>
                <button onClick={handleClose} className="btn-primary">Закрыть</button>
              </div>
            )}

            {/* FORM */}
            {step === 'form' && (
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                <button onClick={() => setStep('cart')} className="text-sp-orange text-sm flex items-center gap-1 hover:underline">← Назад к корзине</button>

                {/* Delivery zone */}
                <div>
                  <label className="form-label flex items-center gap-1"><MapPin size={12} />Зона доставки</label>
                  <div className="flex flex-col gap-2">
                    {zones.map(z => (
                      <label key={z.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedZone?.id === z.id ? 'border-sp-orange/50 bg-sp-orange/8' : 'border-white/8 hover:border-white/20'}`}>
                        <input type="radio" name="zone" checked={selectedZone?.id === z.id} onChange={() => setSelectedZone(z)} className="accent-sp-orange mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sp-cream text-sm font-medium">{z.name}</div>
                          <div className="text-sp-cream/40 text-xs">{z.description}</div>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className={`font-semibold ${z.delivery_price === 0 ? 'text-green-400' : 'text-sp-orange'}`}>
                              {z.delivery_price === 0 ? 'Бесплатно' : `${z.delivery_price} ₽`}
                            </span>
                            {z.free_from > 0 && z.delivery_price > 0 && (
                              <span className="text-sp-cream/30">· Бесплатно от {z.free_from} ₽</span>
                            )}
                            {z.min_order > 0 && <span className="text-sp-cream/30">· Мин. {z.min_order} ₽</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Fields */}
                {[
                  { key: 'name', label: 'Ваше имя *', type: 'text', placeholder: 'Иван Иванов' },
                  { key: 'phone', label: 'Телефон *', type: 'tel', placeholder: '+7 (999) 999-99-99' },
                  { key: 'address', label: 'Адрес доставки', type: 'text', placeholder: 'ул. Некрасова 15, кв. 1' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="form-label">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={form[f.key as keyof typeof form]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} className="form-input" />
                  </div>
                ))}

                {/* Delivery slot */}
                <div>
                  <label className="form-label flex items-center gap-1"><Clock size={12} />Время доставки</label>
                  <select value={form.delivery_slot} onChange={e => setForm(v => ({ ...v, delivery_slot: e.target.value }))} className="form-input">
                    <option value="">Выберите...</option>
                    {DELIVERY_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Promo */}
                <div>
                  <label className="form-label flex items-center gap-1"><Tag size={12} />Промокод</label>
                  <div className="flex gap-2">
                    <input
                      type="text" placeholder="WELCOME10" value={promoCode}
                      onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); setPromoError(''); }}
                      className="form-input flex-1 font-mono uppercase"
                    />
                    <button onClick={applyPromo} disabled={promoLoading || !promoCode} className="btn-secondary text-sm px-4 flex-shrink-0">
                      {promoLoading ? '...' : 'Применить'}
                    </button>
                  </div>
                  {promoResult && (
                    <div className="mt-1.5 text-green-400 text-xs flex items-center gap-1">
                      ✅ Скидка {promoResult.discount_type === 'percent' ? `${promoResult.discount_value}%` : `${promoResult.discount_value} ₽`} применена
                    </div>
                  )}
                  {promoError && <div className="mt-1.5 text-red-400 text-xs">{promoError}</div>}
                </div>

                <div>
                  <label className="form-label">Комментарий</label>
                  <textarea placeholder="Особые пожелания..." value={form.comment} onChange={e => setForm(v => ({ ...v, comment: e.target.value }))} className="form-input resize-none h-16" />
                </div>

                {/* Total breakdown */}
                <div className="bg-white/3 rounded-xl p-4 border border-white/6">
                  <div className="flex flex-col gap-1.5 text-sm">
                    <div className="flex justify-between text-sp-cream/60"><span>Товары</span><span>{total.toLocaleString('ru-RU')} ₽</span></div>
                    {deliveryPrice > 0 && <div className="flex justify-between text-sp-cream/60"><span>Доставка</span><span>{deliveryPrice} ₽</span></div>}
                    {deliveryPrice === 0 && selectedZone && <div className="flex justify-between text-green-400"><span>Доставка</span><span>Бесплатно</span></div>}
                    {discount > 0 && <div className="flex justify-between text-green-400"><span>Скидка ({promoResult?.code})</span><span>−{discount.toLocaleString('ru-RU')} ₽</span></div>}
                    <div className="border-t border-white/8 pt-2 flex justify-between text-sp-cream font-bold text-base">
                      <span>Итого</span>
                      <span className="text-sp-orange">{finalTotal.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-3 py-2">{error}</p>}

                <button onClick={handleOrder} disabled={loading} className="btn-primary flex items-center justify-center gap-2">
                  {loading ? (
                    <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Оформляем...</>
                  ) : (
                    <><Send size={15} />Оформить заказ</>
                  )}
                </button>
                <p className="text-sp-cream/25 text-xs text-center">
                  Нажимая кнопку, вы соглашаетесь с <a href="/privacy" className="underline">политикой</a>
                </p>
              </div>
            )}

            {/* CART */}
            {step === 'cart' && (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16">
                      <ShoppingBag size={48} className="text-sp-cream/15 mb-4" />
                      <p className="text-sp-cream/40 font-medium">Корзина пуста</p>
                      <p className="text-sp-cream/25 text-sm mt-1">Добавьте блюда из меню</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {items.map(item => (
                        <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} className="cart-item">
                          {item.image_url && <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sp-cream text-sm font-medium truncate">{item.name}</p>
                            <p className="text-sp-orange text-sm font-semibold">{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateQty(item.id, item.quantity - 1)} className="qty-btn"><Minus size={11} /></button>
                            <span className="text-sp-cream text-sm w-6 text-center font-medium">{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, item.quantity + 1)} className="qty-btn"><Plus size={11} /></button>
                            <button onClick={() => remove(item.id)} className="text-sp-cream/25 hover:text-red-400 ml-1 transition-colors p-1"><Trash2 size={13} /></button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
                {items.length > 0 && (
                  <div className="p-4 border-t border-white/8 flex-shrink-0">
                    <div className="flex justify-between text-sp-cream mb-3">
                      <span className="text-sp-cream/60">Сумма заказа:</span>
                      <span className="font-bold text-sp-orange text-lg">{total.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <button onClick={() => setStep('form')} className="btn-primary w-full">
                      Оформить доставку →
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
