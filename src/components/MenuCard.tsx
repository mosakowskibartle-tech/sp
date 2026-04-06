import { Plus, Clock, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { cartStore } from '../lib/cart';

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  calories?: number;
  cook_time?: number;
  is_gluten_free?: boolean;
  is_lactose_free?: boolean;
  is_bar?: boolean;
  is_active?: boolean;
  sort_order?: number;
  is_special?: boolean;
  original_price?: number;
}

interface MenuCardProps {
  item: MenuItem;
  compact?: boolean;
  hideCart?: boolean;
}

export default function MenuCard({ item, compact, hideCart: _hideCart }: MenuCardProps) {
  const handleAdd = () => {
    cartStore.add({ id: item.id, name: item.name, price: item.price, image_url: item.image_url });
  };

  if (compact) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className="menu-card-compact group"
      >
        <div className="relative overflow-hidden rounded-t-xl">
          <img src={item.image_url || '/images/placeholder.jpg'} alt={item.name} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500" />
          {item.is_special && (
            <span className="absolute top-2 left-2 bg-sp-orange text-white text-xs px-2 py-0.5 rounded-full font-medium">Блюдо дня</span>
          )}
        </div>
        <div className="p-3">
          <h4 className="text-sp-cream text-sm font-semibold leading-tight mb-1">{item.name}</h4>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sp-orange font-bold">{item.price.toLocaleString('ru-RU')} ₽</span>
            <button onClick={handleAdd} className="bg-sp-orange/20 hover:bg-sp-orange text-sp-orange hover:text-white rounded-full p-1.5 transition-all">
              <Plus size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="menu-card group"
    >
      <div className="relative overflow-hidden rounded-t-2xl">
        <img
          src={item.image_url || '/images/placeholder.jpg'}
          alt={item.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {item.is_special && (
          <div className="absolute top-3 left-3">
            <span className="bg-sp-orange text-white text-xs px-3 py-1 rounded-full font-semibold">⭐ Блюдо дня</span>
          </div>
        )}
        <div className="absolute bottom-3 right-3 flex gap-1">
          {item.is_gluten_free && <span className="badge-tag">Без глютена</span>}
          {item.is_lactose_free && <span className="badge-tag">Без лактозы</span>}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sp-cream font-semibold text-base leading-snug mb-1">{item.name}</h3>
        {item.description && <p className="text-sp-cream/60 text-sm leading-relaxed mb-3 line-clamp-2">{item.description}</p>}

        <div className="flex items-center gap-3 text-xs text-sp-cream/50 mb-3">
          {item.calories && <span className="flex items-center gap-1"><Flame size={11} />{item.calories} ккал</span>}
          {item.cook_time && <span className="flex items-center gap-1"><Clock size={11} />{item.cook_time} мин</span>}
        </div>

        <div className="flex items-center justify-between">
          <div>
            {item.original_price && item.original_price > item.price && (
              <span className="text-sp-cream/40 text-sm line-through mr-2">{item.original_price.toLocaleString('ru-RU')} ₽</span>
            )}
            <span className="text-sp-orange font-bold text-lg">{item.price.toLocaleString('ru-RU')} ₽</span>
          </div>
          <button
            onClick={handleAdd}
            className="btn-add"
          >
            <Plus size={16} />
            В корзину
          </button>
        </div>
      </div>
    </motion.div>
  );
}
