import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, QrCode } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import MenuCard, { type MenuItem } from '../components/MenuCard';
import { getMenuItems } from '../lib/db';

// ⚠️ ЕДИНЫЙ СПИСОК КАТЕГОРИЙ — совпадает с Admin.tsx и БД
export const FOOD_CATS = [
  { id: 'all',                  label: 'Всё' },
  { id: 'Блюда с мангала',      label: '🔥 Блюда с мангала' },
  { id: 'Шашлык на костях',     label: '🍖 Шашлык на костях' },
  { id: 'Овощи на мангале',     label: '🫑 Овощи' },
  { id: 'Рыба на мангале',      label: '🐟 Рыба' },
  { id: 'Садж на мангале',      label: '🥘 Садж' },
  { id: 'Супы',                 label: '🍲 Супы' },
  { id: 'Горячие блюда',        label: '♨️ Горячие' },
  { id: 'Шах плов',             label: '🍚 Шах плов' },
  { id: 'Паста',                label: '🍝 Паста' },
  { id: 'Гарниры',              label: '🥔 Гарниры' },
  { id: 'Салаты',               label: '🥗 Салаты' },
  { id: 'Холодные закуски',     label: '🧀 Холодные закуски' },
  { id: 'Закуски к пиву',       label: '🍟 Закуски к пиву' },
  { id: 'Соусы',                label: '🫙 Соусы' },
  { id: 'Напитки',              label: '🥤 Напитки' },
  { id: 'Авторские чаи',        label: '🍵 Авторские чаи' },
  { id: 'Мороженое',            label: '🍦 Мороженое' },
  { id: 'Десерты',              label: '🍰 Десерты' },
];

export const BAR_CATS = [
  { id: 'all',        label: 'Всё' },
  { id: 'Коктейли',   label: '🍹 Коктейли' },
  { id: 'Вино',       label: '🍷 Вино' },
  { id: 'Шампанское', label: '🥂 Шампанское' },
  { id: 'Пиво',       label: '🍺 Пиво' },
  { id: 'Виски',      label: '🥃 Виски' },
  { id: 'Коньяк',     label: '🥃 Коньяк' },
  { id: 'Водка',      label: '🍶 Водка' },
  { id: 'Текила',     label: '🌵 Текила' },
  { id: 'Ром',        label: '🏝️ Ром' },
];

export default function Menu() {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table');
  const isQrMode = !!tableNumber;

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showBar, setShowBar] = useState(false);
  const [filterGF, setFilterGF] = useState(false);
  const [filterLF, setFilterLF] = useState(false);

  useEffect(() => {
    setLoading(true);
    setActiveCategory('all');
    getMenuItems({ bar: showBar })
      .then(data => { setItems(data as MenuItem[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [showBar]);

  const CATS = showBar ? BAR_CATS : FOOD_CATS;

  const filtered = items.filter(item => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterGF && !item.is_gluten_free) return false;
    if (filterLF && !item.is_lactose_free) return false;
    return true;
  });

  // Build grouped list: first use predefined order, then append any extra categories from DB
  const predefinedIds = CATS.filter(c => c.id !== 'all').map(c => c.id);
  const extraCats = [...new Set(filtered.map(i => i.category))]
    .filter(cat => !predefinedIds.includes(cat))
    .map(cat => ({ id: cat, label: cat }));
  const allCatsForGroup = [...CATS.filter(c => c.id !== 'all'), ...extraCats];

  const grouped = allCatsForGroup
    .map(c => ({ ...c, items: filtered.filter(i => i.category === c.id) }))
    .filter(c => c.items.length > 0);

  // Dynamic category tabs: predefined + any extra from DB
  const dynamicCatTabs = [
    { id: 'all', label: 'Всё' },
    ...allCatsForGroup.filter(c => filtered.some(i => i.category === c.id))
  ];

  return (
    <div className="min-h-screen bg-sp-darkest pt-20">
      <div className="bg-sp-dark py-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {isQrMode && (
              <div className="inline-flex items-center gap-2 bg-sp-orange/15 border border-sp-orange/30 text-sp-orange text-sm px-4 py-1.5 rounded-full mb-4">
                <QrCode size={14} /> Стол №{tableNumber} · Меню для просмотра
              </div>
            )}
            <h1 className="font-display text-4xl md:text-5xl text-sp-cream font-bold mb-2">
              {showBar ? 'Меню бара' : 'Наше меню'}
            </h1>
            <p className="text-sp-cream/50">Свежие продукты, авторские рецептуры</p>
          </motion.div>
          
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setShowBar(false); }} className={`tab-btn ${!showBar ? 'tab-btn-active' : ''}`}>🍽 Кухня</button>
            <button onClick={() => { setShowBar(true); }} className={`tab-btn ${showBar ? 'tab-btn-active' : ''}`}>🍸 Бар</button>
          </div>

          {/* 🔗 Кнопка "Смотреть PDF меню" */}
          <div className="mt-5">
            <a
              href="https://disk.yandex.ru/d/2xerVobXqqaaUg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-sp-orange hover:bg-sp-orange/90 text-sp-darkest font-medium px-5 py-2.5 rounded-lg transition-colors text-sm shadow-sm"
            >
              📄 Смотреть PDF меню
            </a>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 md:top-20 z-30 bg-sp-darkest/95 backdrop-blur-md border-b border-white/5 py-3">
        <div className="container mx-auto px-4 flex flex-col gap-2">
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-cream/40" />
              <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9 py-2 text-sm w-full md:w-52" />
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={filterGF} onChange={e => setFilterGF(e.target.checked)} className="accent-sp-orange" />
              <span className="text-sp-cream/60 text-xs">Без глютена</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={filterLF} onChange={e => setFilterLF(e.target.checked)} className="accent-sp-orange" />
              <span className="text-sp-cream/60 text-xs">Без лактозы</span>
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {dynamicCatTabs.map(c => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`category-tab flex-shrink-0 ${activeCategory === c.id ? 'category-tab-active' : ''}`}>{c.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton-card" />)}
          </div>
        ) : activeCategory !== 'all' ? (
          <AnimatePresence mode="wait">
            <motion.div key={activeCategory} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(item => <MenuCard key={item.id} item={item} hideCart={isQrMode} />)}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-col gap-12">
            {grouped.map(group => (
              <div key={group.id}>
                <h2 className="font-display text-2xl text-sp-cream font-bold mb-6 flex items-center gap-3">
                  {group.label}
                  <span className="text-sp-cream/30 text-base font-normal">{group.items.length} позиций</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {group.items.map(item => <MenuCard key={item.id} item={item} hideCart={isQrMode} />)}
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-sp-cream/40">Ничего не найдено</div>
        )}
      </div>
    </div>
  );
}
