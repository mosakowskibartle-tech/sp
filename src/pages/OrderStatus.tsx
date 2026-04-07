import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Truck, Package, Phone } from 'lucide-react';

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  items: { name: string; quantity: number; price: number }[];
  total_amount: number;
  status: string;
  created_at: string;
  comment?: string;
}

const STEPS = [
  { key: 'new',       icon: <Package size={22} />,    label: 'Принят',      desc: 'Ваш заказ получен и передан на кухню' },
  { key: 'confirmed', icon: <CheckCircle size={22} />, label: 'Подтверждён', desc: 'Оператор подтвердил заказ' },
  { key: 'preparing', icon: <Clock size={22} />,       label: 'Готовится',   desc: 'Повара уже готовят ваши блюда' },
  { key: 'delivered', icon: <Truck size={22} />,       label: 'Доставлен',   desc: 'Заказ доставлен. Приятного аппетита!' },
];

const STATUS_ORDER = ['new', 'confirmed', 'preparing', 'delivered'];

export default function OrderStatus() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [notFound, setNotFound] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const data: Order[] = await res.json();
      const found = data.find(o => o.id === parseInt(id || '0'));
      if (found) {
        setOrder(found);
        setLastUpdated(new Date());
      } else {
        setNotFound(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sp-darkest pt-20 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-3 border-sp-orange/30 border-t-sp-orange rounded-full mx-auto mb-4"
            style={{ borderWidth: 3 }}
          />
          <p className="text-sp-cream/40">Загружаем статус заказа...</p>
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-sp-darkest pt-20 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="font-display text-2xl text-sp-cream mb-2">Заказ не найден</h2>
          <p className="text-sp-cream/40 mb-6">Заказ #{id} не существует</p>
          <Link to="/menu" className="btn-primary">Сделать заказ</Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-sp-darkest pt-20">
      <div className="max-w-lg mx-auto px-4 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-sp-orange/15 border border-sp-orange/25 text-sp-orange text-sm px-4 py-1.5 rounded-full mb-4">
            Заказ #{order.id}
          </div>
          <h1 className="font-display text-3xl text-sp-cream font-bold mb-1">
            {isCancelled ? 'Заказ отменён' : order.status === 'delivered' ? 'Доставлен! 🎉' : 'Отслеживание заказа'}
          </h1>
          <p className="text-sp-cream/40 text-sm">
            Привет, {order.customer_name}! Обновляется каждые 30 сек.
          </p>
          <p className="text-sp-cream/20 text-xs mt-1">
            Последнее обновление: {lastUpdated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </motion.div>

        {/* Progress steps */}
        {!isCancelled && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-sp-dark rounded-2xl p-6 mb-5 border border-white/6">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-white/10" />
              <div
                className="absolute left-5 top-6 w-0.5 bg-sp-orange transition-all duration-1000"
                style={{ height: `${Math.max(0, currentStepIndex / (STEPS.length - 1)) * 100}%` }}
              />

              <div className="flex flex-col gap-6">
                {STEPS.map((step, i) => {
                  const done = i < currentStepIndex;
                  const active = i === currentStepIndex;
                  const future = i > currentStepIndex;
                  return (
                    <div key={step.key} className="flex items-start gap-4 relative">
                      {/* Icon */}
                      <motion.div
                        animate={active ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                          done ? 'bg-sp-orange text-white' :
                          active ? 'bg-sp-orange text-white ring-4 ring-sp-orange/25' :
                          'bg-white/8 text-sp-cream/30'
                        }`}
                      >
                        {done ? <CheckCircle size={18} /> : step.icon}
                      </motion.div>

                      {/* Content */}
                      <div className={`pt-1 transition-all ${future ? 'opacity-30' : ''}`}>
                        <div className={`font-semibold text-sm ${
                          active ? 'text-sp-orange' : done ? 'text-sp-cream' : 'text-sp-cream/50'
                        }`}>{step.label}</div>
                        {(done || active) && (
                          <p className="text-sp-cream/50 text-xs mt-0.5">{step.desc}</p>
                        )}
                        {active && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-1.5 mt-1.5"
                          >
                            <motion.span
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="w-1.5 h-1.5 bg-sp-orange rounded-full inline-block"
                            />
                            <span className="text-sp-orange text-xs font-medium">Текущий статус</span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {isCancelled && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-5 text-center">
            <div className="text-3xl mb-2">❌</div>
            <p className="text-red-400 font-medium">Заказ был отменён</p>
            <p className="text-sp-cream/40 text-sm mt-1">Если это ошибка, свяжитесь с нами</p>
          </div>
        )}

        {/* Order details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-sp-dark rounded-2xl p-5 mb-5 border border-white/6">
          <h3 className="text-sp-cream font-semibold mb-4 text-sm uppercase tracking-wider">Состав заказа</h3>
          <div className="flex flex-col gap-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sp-cream/70 text-sm">{item.name} <span className="text-sp-cream/30">×{item.quantity}</span></span>
                <span className="text-sp-orange text-sm font-medium">{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
              </div>
            ))}
            <div className="border-t border-white/8 pt-3 flex justify-between">
              <span className="text-sp-cream font-semibold">Итого</span>
              <span className="text-sp-orange font-bold text-lg">{order.total_amount?.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
          {order.delivery_address && (
            <div className="mt-3 pt-3 border-t border-white/8 text-sm text-sp-cream/50">
              📍 {order.delivery_address}
            </div>
          )}
          {order.comment && (
            <div className="mt-2 text-sm text-sp-cream/40 italic">💬 {order.comment}</div>
          )}
        </motion.div>

        {/* Contact */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
          <p className="text-sp-cream/30 text-sm mb-3">Есть вопросы по заказу?</p>
          <a href="tel:+79257677778" className="btn-primary inline-flex items-center gap-2">
            <Phone size={16} /> Позвонить в кафе
          </a>
        </motion.div>
      </div>
    </div>
  );
}
