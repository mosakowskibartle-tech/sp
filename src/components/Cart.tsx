import { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, Send, Tag, MapPin, ChevronDown } from 'lucide-react';
import { useCart } from '../lib/useCart';
import { motion, AnimatePresence } from 'framer-motion';

interface CartProps { open: boolean; onClose: () => void; }

interface DeliveryZone {
  id: number; name: string; description: string;
  min_order: number; delivery_cost: number; delivery_time: string;
}

interface PromoResult {
  code: string; discount_type: 'percent' | 'fixed'; discount_value: number; min_order: number;
}

export default function Cart({ open, onClose }: CartProps) {
  const { items, total, remove, updateQty, clear } = useCart();
  const [step, setStep] = useState<'cart' | 'form' | 'success'>('cart');
  const [form, setForm] = useState({ name: '', phone: '', address: '', comment: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);

  // Delivery
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [showZones, setShowZones] = useState(false);

  // Promo
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoResult | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    if (open && zones.length === 0) {
      fetch('/api/delivery-zones')
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setZones(d); })
        .catch(() => {});
    }
  }, [open]);

  // Discount calc
  const discountAmount = promo
    ? promo.discount_type === 'percent'
      ? Math.round(total * promo.discount_value / 100)
      : promo.discount_value
    : 0;
  const deliveryCost = selectedZone?.delivery_cost ?? 0;
  const finalTotal = Math.max(0, total - discountAmount) + deliveryCost;

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true); setPromoError('');
    try {
      const res = await fetch(`/api/promocodes?code=${promoInput.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) { setPromoError(data.error || 'Промокод не найден'); setPromo(null); return; }
      if (data.min_order && total < data.min_order) {
        setPromoError(`Минимальная сумма для этого промокода: ${data.min_order}₽`); setPromo(null); return;
      }
      setPromo(data);
    } catch { setPromoError('Ошибка проверки промокода'); }
    finally { setPromoLoading(false); }
  };

  const handleOrder = async () => {
    if (!form.name || !form.phone) { setError('Пожалуйста, заполните имя и телефон'); return; }
    if (selectedZone && !form.address) { setError('Укажите адрес доставки'); return; }
    if (selectedZone && selectedZone.min_order > total) {
      setError(`Минимальный заказ для зоны "${selectedZone.name}": ${selectedZone.min_order}₽`); return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_phone: form.phone,
          delivery_address: form.address,
          comment: form.comment,
          items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          total_amount: total,
          zone_name: selectedZone?.name,
          delivery_cost: deliveryCost,
          promo_code: promo?.code,
          discount_amount: discountAmount,
          status: 'new',
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Ошибка оформления заказа'); return; }
      setOrderId(data.id);
      setStep('success');
      clear();
    } catch { setError('Ошибка при оформлении заказа. Попробуйте ещё раз.'); }
    finally { setLoading(false); }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('cart'); setForm({ name: '', phone: '', address: '', comment: '' });
      setError(''); setPromo(null); setPromoInput(''); setPromoError('');
      setSelectedZone(null); setOrderId(null);
    }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-sp-dark z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-sp-orange" size={22} />
                <h2 className="font-display text-xl text-sp-cream">Корзина</h2>
                {items.length > 0 && <span className="text-sp-cream/40 text-sm">{items.length} позиций</span>}
              </div>
              <button onClick={handleClose} className="text-sp-cream/60 hover:text-sp-cream transition-colors"><X size={22} /></button>
            </div>

            {/* Success */}
            {step === 'success' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }} className="text-6xl mb-4">🎉</motion.div>
                <h3 className="font-display text-2xl text-sp-orange mb-2">Заказ принят!</h3>
                <p className="text-sp-cream/70 mb-2">Мы свяжемся с вами в ближайшее время.</p>
                {orderId && (
                  <a href={`/order/${orderId}`} target="_blank" rel="noreferrer"
                    className="text-sp-orange text-sm underline mb-6 hover:text-sp-warm">
                    🔗 Отследить заказ #{orderId}
                  </a>
                )}
                <button onClick={handleClose} className="btn-primary">Закрыть</button>
              </div>

            ) : step === 'form' ? (
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                <button onClick={() => setStep('cart')} className="text-sp-orange text-sm flex items-center gap-1 hover:underline">← Назад к корзине</button>
                <h3 className="font-display text-lg text-sp-cream">Оформление заказа</h3>

                {/* Delivery zone */}
                <div>
                  <label className="form-label flex items-center gap-1"><MapPin size={12} />Зона доставки</label>
                  <button type="button" onClick={() => setShowZones(v => !v)}
                    className="form-input flex items-center justify-between text-left">
                    <span className={selectedZone ? 'text-sp-cream' : 'text-sp-cream/40'}>
                      {selectedZone ? `${selectedZone.name} — ${selectedZone.delivery_cost === 0 ? 'Бесплатно' : `${selectedZone.delivery_cost}₽`}` : 'Самовывоз / выберите зону'}
                    </span>
                    <ChevronDown size={16} className={`text-sp-cream/40 transition-transform ${showZones ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showZones && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="mt-1 bg-sp-darkest border border-white/10 rounded-xl overflow-hidden">
                        <button onClick={() => { setSelectedZone(null); setShowZones(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-sp-cream/60 hover:bg-white/5 transition-colors border-b border-white/5">
                          🚶 Самовывоз (бесплатно)
                        </button>
                        {zones.map(z => (
                          <button key={z.id} onClick={() => { setSelectedZone(z); setShowZones(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${selectedZone?.id === z.id ? 'text-sp-orange' : 'text-sp-cream/70'}`}>
                            <div className="font-medium">{z.name}</div>
                            <div className="text-xs text-sp-cream/40 mt-0.5">{z.description} · {z.delivery_time} · {z.delivery_cost === 0 ? 'Бесплатно' : `${z.delivery_cost}₽`} · Мин. {z.min_order}₽</div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {[{ key: 'name', label: 'Ваше имя *', type: 'text', placeholder: 'Иван Иванов' },
                  { key: 'phone', label: 'Телефон *', type: 'tel', placeholder: '+7 (999) 999-99-99' },
                  { key: 'address', label: selectedZone ? 'Адрес доставки *' : 'Адрес (если доставка)', type: 'text', placeholder: 'ул. Некрасова 15, кв. 1' }
                ].map(f => (
                  <div key={f.key}>
                    <label className="form-label">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder}
                      value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                      className="form-input" />
                  </div>
                ))}

                <div>
                  <label className="form-label">Комментарий</label>
                  <textarea placeholder="Особые пожелания..." value={form.comment}
                    onChange={e => setForm(v => ({ ...v, comment: e.target.value }))}
                    className="form-input resize-none h-16" />
                </div>

                {/* Promo code */}
                <div>
                  <label className="form-label flex items-center gap-1"><Tag size={12} />Промокод</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="SCHODNYA10" value={promoInput}
                      onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromo(null); setPromoError(''); }}
                      className="form-input flex-1 uppercase font-mono text-sm" />
                    <button type="button" onClick={applyPromo} disabled={promoLoading || !promoInput.trim()}
                      className="btn-secondary text-sm px-4 flex-shrink-0">
                      {promoLoading ? '...' : 'Применить'}
                    </button>
                  </div>
                  {promoError && <p className="text-red-400 text-xs mt-1">{promoError}</p>}
                  {promo && (
                    <div className="flex items-center gap-2 mt-1.5 text-green-400 text-xs">
                      <Tag size={11} /> Промокод применён: -{promo.discount_type === 'percent' ? `${promo.discount_value}%` : `${promo.discount_value}₽`}
                      <button onClick={() => { setPromo(null); setPromoInput(''); }} className="text-red-400 ml-auto"><X size={11} /></button>
                    </div>
                  )}
                </div>

                {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-3 py-2">{error}</p>}

                {/* Summary */}
                <div className="border-t border-white/10 pt-4 flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between text-sp-cream/60"><span>Сумма заказа:</span><span>{total.toLocaleString('ru-RU')} ₽</span></div>
                  {discountAmount > 0 && <div className="flex justify-between text-green-400"><span>Скидка ({promo?.code}):</span><span>-{discountAmount.toLocaleString('ru-RU')} ₽</span></div>}
                  <div className="flex justify-between text-sp-cream/60"><span>Доставка:</span><span>{deliveryCost === 0 ? 'Бесплатно' : `${deliveryCost} ₽`}</span></div>
                  <div className="flex justify-between text-sp-cream font-bold text-lg mt-1"><span>Итого:</span><span className="text-sp-orange">{finalTotal.toLocaleString('ru-RU')} ₽</span></div>
                </div>

                <button onClick={handleOrder} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? 'Отправляем...' : <><Send size={16} /> Оформить заказ</>}
                </button>
              </div>

            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-5">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <ShoppingBag size={48} className="text-sp-cream/15 mb-4" />
                      <p className="text-sp-cream/40">Корзина пуста</p>
                      <p className="text-sp-cream/25 text-sm mt-1">Добавьте блюда из меню</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {items.map(item => (
                        <div key={item.id} className="cart-item">
                          {item.image_url && <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sp-cream text-sm font-medium truncate">{item.name}</p>
                            <p className="text-sp-orange text-sm">{item.price.toLocaleString('ru-RU')} ₽</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(item.id, item.quantity - 1)} className="qty-btn"><Minus size={12} /></button>
                            <span className="text-sp-cream text-sm w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, item.quantity + 1)} className="qty-btn"><Plus size={12} /></button>
                            <button onClick={() => remove(item.id)} className="text-red-400/60 hover:text-red-400 ml-1 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {items.length > 0 && (
                  <div className="p-5 border-t border-white/10">
                    <div className="flex justify-between text-sp-cream mb-4">
                      <span>Итого:</span>
                      <span className="font-bold text-sp-orange text-lg">{total.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <button onClick={() => setStep('form')} className="btn-primary w-full">Оформить заказ</button>
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
