import { useState, useEffect, useCallback } from 'react';
import {
  getMenuItems, upsertMenuItem, deleteMenuItem as dbDelItem,
  getOrders, updateOrderStatus,
  getReservations, updateReservationStatus, deleteReservation,
  getReviews, updateReviewApproval, deleteReview as dbDelReview,
  getBanquets, updateBanquetStatus,
  getPromotions, upsertPromotion, deletePromotion,
  getGallery, upsertGalleryItem, deleteGalleryItem,
  getSettings, saveSettings
} from '../lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Check, EyeOff,
  RefreshCw, LogOut, Search, Save, AlertCircle, X, Send, QrCode
} from 'lucide-react';
import { type MenuItem } from '../components/MenuCard';

/* ─────── Types ─────── */
interface Order {
  id: number; customer_name: string; customer_phone: string;
  delivery_address?: string; items: { name: string; quantity: number; price: number }[];
  total_amount: number; status: string; created_at: string; comment?: string;
}
interface Reservation {
  id: number; guest_name: string; guest_phone: string; date: string;
  time: string; guests_count: number; table_number: number | null;
  status: string; created_at: string;
}
interface Review {
  id: number; author_name: string; rating: number; text: string;
  approved: boolean; created_at: string;
}
interface Banquet {
  id: number; contact_name: string; contact_phone: string; event_type: string;
  package_name?: string; guests_count: number; event_date: string;
  estimated_total: number; status: string; created_at: string; comment?: string;
}
interface Promo {
  id: number; title: string; description: string; discount_text: string;
  expires_at: string; is_active: boolean; sort_order: number;
}
interface GalleryItem {
  id: number; url: string; caption: string; category: string;
  sort_order: number; is_active: boolean;
}
interface TgSettings { telegram_bot_token: string; telegram_chat_id: string; }

/* ─────── Constants ─────── */
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  new:       { label: 'Новый',       cls: 'bg-red-500/20 text-red-400' },
  confirmed: { label: 'Подтверждён', cls: 'bg-blue-500/20 text-blue-400' },
  preparing: { label: 'Готовится',   cls: 'bg-yellow-500/20 text-yellow-400' },
  delivered: { label: 'Доставлен',   cls: 'bg-green-500/20 text-green-400' },
  cancelled: { label: 'Отменён',     cls: 'bg-gray-500/20 text-gray-400' },
  pending:   { label: 'Ожидает',     cls: 'bg-yellow-500/20 text-yellow-400' },
  completed: { label: 'Завершён',    cls: 'bg-green-500/20 text-green-400' },
};

// Единый список категорий — совпадает с Menu.tsx
const FOOD_CATS_ADMIN = [
  'Блюда с мангала','Шашлык на костях','Овощи на мангале',
  'Рыба на мангале','Садж на мангале','Супы',
  'Горячие блюда','Шах плов','Паста','Гарниры',
  'Салаты','Холодные закуски','Закуски к пиву','Соусы',
  'Напитки','Авторские чаи','Мороженое','Десерты',
];
const BAR_CATS_ADMIN = [
  'Коктейли','Вино','Шампанское','Пиво',
  'Виски','Коньяк','Водка','Текила','Ром',
];
// ALL_CATS used for reference only
// const ALL_CATS = [...FOOD_CATS_ADMIN, ...BAR_CATS_ADMIN];

const EMPTY_ITEM: Partial<MenuItem> = {
  name:'', description:'', price:0, category:'', image_url:'',
  calories:undefined, cook_time:undefined, is_gluten_free:false,
  is_lactose_free:false, is_bar:false, is_active:true,
  is_special:false, original_price:undefined, sort_order:0,
};

/* ─────── Small Components ─────── */
function Badge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, cls: 'bg-white/10 text-sp-cream/50' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}

function StatusPicker({ current, options, onChange }: {
  current: string; options: string[]; onChange: (s: string) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap mt-3">
      {options.map(s => (
        <button key={s} onClick={() => onChange(s)}
          className={`text-xs px-3 py-1.5 rounded-full transition-all ${
            current === s
              ? 'bg-sp-orange text-white font-semibold shadow-md shadow-sp-orange/20'
              : 'bg-white/8 text-sp-cream/50 hover:bg-white/15 hover:text-sp-cream'
          }`}>
          {STATUS_MAP[s]?.label ?? s}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-sp-dark rounded-2xl border border-white/6 overflow-hidden">
      <div className="px-5 py-3 border-b border-white/6 bg-white/2">
        <h3 className="text-sp-cream/70 text-xs font-semibold uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ─────── QR Section ─────── */
function QrSection() {
  const [sel, setSel] = useState<number|null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const generate = async (n: number) => {
    setSel(n);
    const url = `${window.location.origin}/qr-menu?table=${n}`;
    try {
      const QRCode = await import('qrcode');
      const dataUrl = await QRCode.default.toDataURL(url, {
        width: 400, margin: 2,
        color: { dark: '#1A1410', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      });
      setQrUrl(dataUrl);
    } catch(e) { console.error(e); }
  };

  const printAll = async () => {
    const QRCode = await import('qrcode');
    const win = window.open('', '_blank');
    if (!win) return;
    let html = `<html><head><title>QR Меню — Соль и Перец</title>
    <style>body{font-family:sans-serif;background:#fff;margin:0;padding:16px}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
    .card{border:2px solid #E8621A;border-radius:12px;padding:16px;text-align:center;page-break-inside:avoid}
    h2{color:#1A1410;margin:0 0 8px;font-size:13px;font-weight:700}
    img{width:130px;height:130px}p{margin:4px 0;font-size:10px;color:#888}
    .btn{position:fixed;top:10px;right:10px;padding:10px 20px;background:#E8621A;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px}
    @media print{.btn{display:none}}</style></head><body>
    <button class="btn" onclick="window.print()">🖨️ Печать</button><div class="grid">`;
    for (const n of Array.from({length:17},(_,i)=>i+1)) {
      const url = `${window.location.origin}/qr-menu?table=${n}`;
      const d = await QRCode.default.toDataURL(url, { width:200, margin:1, color:{dark:'#1A1410',light:'#FFFFFF'} });
      html += `<div class="card"><h2>Стол №${n}</h2><img src="${d}"/><p>Соль и Перец</p><p style="font-size:9px;color:#bbb">Меню без корзины</p></div>`;
    }
    html += `</div></body></html>`;
    win.document.write(html); win.document.close();
  };

  return (
    <div>
      <h2 className="text-sp-cream font-display text-2xl font-bold mb-1">QR-меню</h2>
      <p className="text-sp-cream/40 text-sm mb-6">Гость сканирует — видит меню без корзины и доставки</p>
      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Выберите стол">
          <div className="grid grid-cols-6 gap-2 mb-4">
            {Array.from({length:17},(_,i)=>i+1).map(n => (
              <button key={n} onClick={() => generate(n)}
                className={`rounded-xl py-2.5 text-sm font-bold transition-all ${
                  sel===n ? 'bg-sp-orange text-white shadow-lg' : 'bg-white/8 text-sp-cream/60 hover:bg-sp-orange/20'
                }`}>{n}</button>
            ))}
          </div>
          <button onClick={printAll} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
            🖨️ Распечатать все 17 QR-кодов
          </button>
          <div className="mt-4 bg-sp-orange/8 border border-sp-orange/15 rounded-xl p-3 text-xs text-sp-cream/50">
            <p className="font-medium text-sp-cream/70 mb-1">Ссылка QR-меню:</p>
            <code className="text-sp-orange">{origin}/qr-menu?table=N</code>
            <p className="mt-1">Открывает меню без шапки, корзины и доставки</p>
          </div>
        </Section>
        <Section title="Предпросмотр">
          {qrUrl ? (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-xl">
                <img src={qrUrl} alt="QR" className="w-48 h-48" />
              </div>
              <div className="text-center">
                <div className="text-sp-cream font-semibold text-lg">Стол №{sel}</div>
                <div className="text-sp-cream/30 text-xs mt-0.5 font-mono">{origin}/qr-menu?table={sel}</div>
              </div>
              <div className="flex gap-3">
                <a href={qrUrl} download={`qr-stol-${sel}.png`} className="btn-primary text-sm">⬇️ Скачать PNG</a>
                <button onClick={() => window.open(`${origin}/qr-menu?table=${sel}`, '_blank')} className="btn-secondary text-sm">Открыть</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-sp-cream/20">
              <QrCode size={48} className="mb-3" />
              <p className="text-sm">Выберите стол слева</p>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

/* ══════════════════════ MAIN ══════════════════════ */
export default function Admin() {
  const [authed, setAuthed]   = useState(() => !!sessionStorage.getItem('sp_admin'));
  const [password, setPwd]    = useState('');
  const [authErr, setAuthErr] = useState('');
  const [authLoad, setAuthLoad] = useState(false);
  const [tab, setTab]         = useState('dashboard');
  const [dataLoad, setDataLoad] = useState(false);

  /* Data */
  const [menu,  setMenu]   = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setRes] = useState<Reservation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [banquets, setBanquets] = useState<Banquet[]>([]);
  const [promos, setPromos]   = useState<Promo[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [tg, setTg]           = useState<TgSettings>({ telegram_bot_token:'', telegram_chat_id:'' });
  const [tgSaving, setTgSaving] = useState(false);
  const [tgSaved, setTgSaved]   = useState(false);

  /* Menu form */
  const [editItem, setEditItem]     = useState<Partial<MenuItem>|null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemSaving, setItemSaving] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCat, setMenuCat]       = useState('all');

  /* Promo form */
  const [editPromo, setEditPromo]   = useState<Partial<Promo>|null>(null);
  const [showPromoForm, setShowPromoForm] = useState(false);

  /* Gallery form */
  const [editGal, setEditGal]       = useState<Partial<GalleryItem>|null>(null);
  const [showGalForm, setShowGalForm] = useState(false);

  /* ── Auth ── */
  const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'admin2025';
  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoad(true); setAuthErr('');
    await new Promise(r => setTimeout(r, 400)); // anti-brute delay
    if (password === ADMIN_PASS) {
      sessionStorage.setItem('sp_admin', btoa(`admin:${Date.now()}`));
      setAuthed(true);
    } else {
      setAuthErr('Неверный пароль');
    }
    setAuthLoad(false);
  };

  /* ── Load all data ── */
  const load = useCallback(async () => {
    setDataLoad(true);
    try {
      const [m, o, r, rv, b, p, g, s] = await Promise.all([
        getMenuItems({ activeOnly: false }),
        getOrders(),
        getReservations(),
        getReviews(true),
        getBanquets(),
        getPromotions(true),
        getGallery(true),
        getSettings(),
      ]);
      setMenu(m as MenuItem[]);
      setOrders(o as Order[]);
      setRes(r as Reservation[]);
      setReviews(rv as Review[]);
      setBanquets(b as Banquet[]);
      setPromos(p as Promo[]);
      setGallery(g as GalleryItem[]);
      if (s && typeof s === 'object') {
        setTg({ telegram_bot_token: (s as Record<string,string>).telegram_bot_token||'', telegram_chat_id: (s as Record<string,string>).telegram_chat_id||'' });
      }
    } catch(e) { console.error(e); }
    finally { setDataLoad(false); }
  }, []);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  /* ── Status update ── */
  const setStatus = async (type: 'orders'|'reservations'|'banquets', id: number, status: string) => {
    if (type === 'orders') await updateOrderStatus(id, status);
    else if (type === 'reservations') await updateReservationStatus(id, status);
    else await updateBanquetStatus(id, status);
    await load();
  };

  /* ── Menu CRUD ── */
  const saveItem = async () => {
    if (!editItem?.name || !editItem.price || !editItem.category) return alert('Заполните название, цену и категорию');
    setItemSaving(true);
    try {
      await upsertMenuItem(editItem as Record<string, unknown>);
      setShowItemForm(false); setEditItem(null); await load();
    } catch (e: unknown) { alert((e as Error).message); }
    setItemSaving(false);
  };
  const delItem = async (id: number) => {
    if (!confirm('Удалить блюдо?')) return;
    await dbDelItem(id); await load();
  };
  const toggleItem = async (item: MenuItem) => {
    await upsertMenuItem({ id: item.id, is_active: !item.is_active }); await load();
  };

  /* ── Reviews ── */
  const moderateReview = async (id: number, approved: boolean) => {
    await updateReviewApproval(id, approved); await load();
  };
  const delReview = async (id: number) => {
    if (!confirm('Удалить отзыв?')) return;
    await dbDelReview(id); await load();
  };

  /* ── Reservations ── */
  const delReservation = async (id: number) => {
    if (!confirm('Удалить бронь?')) return;
    await deleteReservation(id);
    await load();
  };

  /* ── Promos ── */
  const savePromo = async () => {
    if (!editPromo?.title) return;
    await upsertPromotion(editPromo as Record<string, unknown>);
    setShowPromoForm(false); setEditPromo(null); await load();
  };
  const delPromo = async (id: number) => {
    if (!confirm('Удалить акцию?')) return;
    await deletePromotion(id); await load();
  };

  /* ── Gallery ── */
  const saveGal = async () => {
    if (!editGal?.url) return;
    await upsertGalleryItem(editGal as Record<string, unknown>);
    setShowGalForm(false); setEditGal(null); await load();
  };
  const delGal = async (id: number) => {
    if (!confirm('Удалить фото?')) return;
    await deleteGalleryItem(id); await load();
  };

  /* ── Telegram ── */
  const saveTg = async () => {
    setTgSaving(true);
    try {
      await saveSettings(tg as unknown as Record<string, string>);
      setTgSaved(true);
      setTimeout(() => setTgSaved(false), 3000);
    } catch(e) { alert('Ошибка: ' + (e as Error).message); }
    finally { setTgSaving(false); }
  };
  const testTg = async () => {
    if (!tg.telegram_bot_token || !tg.telegram_chat_id) return alert('Введите токен и Chat ID');
    await saveSettings(tg as unknown as Record<string, string>);
    // Test via direct Telegram API call from browser
    try {
      const r = await fetch(`https://api.telegram.org/bot${tg.telegram_bot_token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tg.telegram_chat_id, text: '✅ Соль и Перец: Telegram уведомления работают!' }),
      });
      const d = await r.json();
      alert(d.ok ? '✅ Сообщение отправлено!' : `❌ ${d.description}`);
    } catch(e) { alert('Ошибка сети'); }
  };

  /* ── Computed ── */
  const newOrders      = orders.filter(o => o.status === 'new').length;
  const pendingRes     = reservations.filter(r => r.status === 'pending').length;
  const pendingReviews = reviews.filter(r => !r.approved).length;
  const newBanquets    = banquets.filter(b => b.status === 'new').length;

  const filteredMenu = menu.filter(i => {
    const ms = !menuSearch || i.name.toLowerCase().includes(menuSearch.toLowerCase());
    const mc = menuCat === 'all' || i.category === menuCat;
    return ms && mc;
  });

  const tabs = [
    { id:'dashboard',    label:'Обзор',      icon:'📊', badge: newOrders + pendingRes + pendingReviews + newBanquets },
    { id:'menu',         label:'Меню',       icon:'🍽️', badge:0 },
    { id:'orders',       label:'Заказы',     icon:'🛍️', badge: newOrders },
    { id:'reservations', label:'Бронь',      icon:'📅', badge: pendingRes },
    { id:'reviews',      label:'Отзывы',     icon:'⭐', badge: pendingReviews },
    { id:'banquets',     label:'Банкеты',    icon:'🎉', badge: newBanquets },
    { id:'promos',       label:'Акции',      icon:'🔥', badge:0 },
    { id:'gallery',      label:'Галерея',    icon:'🖼️', badge:0 },
    { id:'qr',           label:'QR-меню',    icon:'⬛', badge:0 },
    { id:'settings',     label:'Настройки',  icon:'⚙️', badge:0 },
  ];

  /* ══ LOGIN ══ */
  if (!authed) return (
    <div className="min-h-screen bg-sp-darkest flex items-center justify-center p-4">
      <motion.div initial={{ scale:0.92, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="bg-sp-dark rounded-2xl p-8 w-full max-w-sm border border-white/8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-sp-orange/20 flex items-center justify-center text-xl">🧂</div>
          <div><div className="font-display text-xl text-sp-cream font-bold">Админ-панель</div><div className="text-sp-cream/30 text-xs">Соль и Перец</div></div>
        </div>
        <form onSubmit={login} className="flex flex-col gap-4">
          <div>
            <label className="form-label">Пароль</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPwd(e.target.value)} className="form-input" autoFocus />
          </div>
          {authErr && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-xl px-3 py-2.5"><AlertCircle size={14}/>{authErr}</div>}
          <button type="submit" disabled={authLoad} className="btn-primary">{authLoad ? 'Проверяем...' : 'Войти'}</button>
        </form>
        <p className="text-sp-cream/20 text-xs text-center mt-5">Пароль по умолчанию: <code>admin2025</code></p>
      </motion.div>
    </div>
  );

  /* ══ MAIN LAYOUT ══ */
  return (
    <div className="min-h-screen bg-sp-darkest flex">
      {/* ── Sidebar ── */}
      <div className="w-14 md:w-56 bg-sp-dark border-r border-white/5 flex flex-col flex-shrink-0 sticky top-0 h-screen">
        <div className="px-3 md:px-4 py-4 border-b border-white/5">
          <div className="hidden md:block">
            <div className="font-display text-sp-orange font-bold text-base">Соль и Перец</div>
            <div className="text-sp-cream/30 text-xs mt-0.5">Панель управления</div>
          </div>
          <div className="md:hidden w-8 h-8 rounded-lg bg-sp-orange/20 flex items-center justify-center text-sm">🧂</div>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-2 md:px-3 py-2.5 mx-1 rounded-xl text-sm transition-all relative mb-0.5 ${
                tab === t.id ? 'text-sp-orange bg-sp-orange/12 font-semibold' : 'text-sp-cream/50 hover:text-sp-cream hover:bg-white/5'
              }`} style={{ width: 'calc(100% - 8px)' }}>
              <span className="flex-shrink-0 text-base leading-none">{t.icon}</span>
              <span className="hidden md:block">{t.label}</span>
              {t.badge > 0 && <>
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 hidden md:flex">{t.badge}</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full md:hidden" />
              </>}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/5 p-2">
          <button onClick={load} disabled={dataLoad} className="w-full flex items-center gap-2 px-2 md:px-3 py-2 rounded-xl text-sp-cream/40 hover:text-sp-cream hover:bg-white/5 text-sm mb-1" style={{ width: 'calc(100% - 0px)' }}>
            <RefreshCw size={14} className={dataLoad ? 'animate-spin' : ''} />
            <span className="hidden md:block">Обновить</span>
          </button>
          <button onClick={() => { sessionStorage.removeItem('sp_admin'); setAuthed(false); }}
            className="w-full flex items-center gap-2 px-2 md:px-3 py-2 rounded-xl text-sp-cream/40 hover:text-red-400 hover:bg-red-500/10 text-sm" style={{ width: 'calc(100% - 0px)' }}>
            <LogOut size={14} />
            <span className="hidden md:block">Выйти</span>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 max-w-6xl mx-auto">

          {/* ══ DASHBOARD ══ */}
          {tab === 'dashboard' && (
            <div>
              <h2 className="text-sp-cream font-display text-2xl font-bold mb-6">Обзор</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                  { label:'Новых заказов', value:newOrders, color:'text-red-400', bg:'bg-red-500/10', t:'orders' },
                  { label:'Ожидают бронь', value:pendingRes, color:'text-blue-400', bg:'bg-blue-500/10', t:'reservations' },
                  { label:'На модерации', value:pendingReviews, color:'text-yellow-400', bg:'bg-yellow-500/10', t:'reviews' },
                  { label:'Новых банкетов', value:newBanquets, color:'text-sp-orange', bg:'bg-sp-orange/10', t:'banquets' },
                ].map(s => (
                  <button key={s.label} onClick={() => setTab(s.t)} className={`${s.bg} rounded-2xl p-5 text-left hover:scale-105 transition-transform border border-white/5`}>
                    <div className={`text-4xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-sp-cream/50 text-sm mt-1">{s.label}</div>
                  </button>
                ))}
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <Section title="Последние заказы">
                  {orders.slice(0,6).map(o => (
                    <div key={o.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                      <div>
                        <span className="text-sp-cream text-sm font-medium">#{o.id} {o.customer_name}</span>
                        <div className="text-sp-cream/30 text-xs">{new Date(o.created_at).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sp-orange font-medium text-sm">{o.total_amount?.toLocaleString('ru-RU')} ₽</span>
                        <Badge status={o.status} />
                      </div>
                    </div>
                  ))}
                  {orders.length===0 && <p className="text-sp-cream/30 text-sm text-center py-4">Заказов пока нет</p>}
                </Section>
                <Section title="Ближайшие брони">
                  {reservations.slice(0,6).map(r => (
                    <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                      <div>
                        <span className="text-sp-cream text-sm font-medium">{r.guest_name}</span>
                        <div className="text-sp-cream/30 text-xs">{r.date} {r.time} · {r.guests_count} чел. · Стол #{r.table_number??'—'}</div>
                      </div>
                      <Badge status={r.status} />
                    </div>
                  ))}
                  {reservations.length===0 && <p className="text-sp-cream/30 text-sm text-center py-4">Броней пока нет</p>}
                </Section>
              </div>
            </div>
          )}

          {/* ══ MENU ══ */}
          {tab === 'menu' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sp-cream font-display text-2xl font-bold">Меню</h2>
                  <p className="text-sp-cream/40 text-sm">{menu.length} позиций · {menu.filter(i=>i.is_active).length} активных</p>
                </div>
                <button onClick={() => { setEditItem({...EMPTY_ITEM}); setShowItemForm(true); }} className="btn-primary flex items-center gap-2 text-sm">
                  <Plus size={15}/>Добавить
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-3 mb-4 flex-wrap">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-cream/30"/>
                  <input type="text" placeholder="Поиск..." value={menuSearch} onChange={e=>setMenuSearch(e.target.value)} className="form-input pl-8 py-2 text-sm w-44"/>
                </div>
                <select value={menuCat} onChange={e=>setMenuCat(e.target.value)} className="form-input py-2 text-sm w-44">
                  <option value="all">Все категории</option>
                  <optgroup label="🍽 Кухня">{FOOD_CATS_ADMIN.map(c=><option key={c} value={c}>{c}</option>)}</optgroup>
                  <optgroup label="🍷 Бар">{BAR_CATS_ADMIN.map(c=><option key={`b-${c}`} value={c}>{c}</option>)}</optgroup>
                </select>
              </div>

              {/* Form */}
              <AnimatePresence>
                {showItemForm && editItem && (
                  <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
                    className="bg-sp-dark rounded-2xl p-5 mb-5 border border-sp-orange/25">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sp-cream font-semibold">{editItem.id ? `Редактировать: ${editItem.name}` : 'Новое блюдо'}</h3>
                      <button onClick={() => { setShowItemForm(false); setEditItem(null); }} className="text-sp-cream/40 hover:text-sp-cream"><X size={18}/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="form-label">Название *</label>
                        <input type="text" value={editItem.name||''} onChange={e=>setEditItem(v=>({...v,name:e.target.value}))} className="form-input"/>
                      </div>
                      <div>
                        <label className="form-label">Цена (₽) *</label>
                        <input type="number" value={editItem.price||''} onChange={e=>setEditItem(v=>({...v,price:parseInt(e.target.value)||0}))} className="form-input"/>
                      </div>
                      <div>
                        <label className="form-label">Категория *</label>
                        <select value={editItem.category||''} onChange={e=>setEditItem(v=>({...v,category:e.target.value}))} className="form-input">
                          <option value="">Выберите...</option>
                          <optgroup label="🍽 Кухня">{FOOD_CATS_ADMIN.map(c=><option key={c} value={c}>{c}</option>)}</optgroup>
                          <optgroup label="🍷 Бар">{BAR_CATS_ADMIN.map(c=><option key={`b-${c}`} value={c}>{c}</option>)}</optgroup>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Старая цена (для скидки)</label>
                        <input type="number" value={editItem.original_price||''} onChange={e=>setEditItem(v=>({...v,original_price:parseInt(e.target.value)||undefined}))} className="form-input" placeholder="0"/>
                      </div>
                      <div>
                        <label className="form-label">Сортировка</label>
                        <input type="number" value={editItem.sort_order??0} onChange={e=>setEditItem(v=>({...v,sort_order:parseInt(e.target.value)||0}))} className="form-input"/>
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="form-label">Описание</label>
                        <textarea value={editItem.description||''} onChange={e=>setEditItem(v=>({...v,description:e.target.value}))} className="form-input resize-none h-14"/>
                      </div>
                      <div className="md:col-span-2">
                        <label className="form-label">URL фото</label>
                        <input type="text" value={editItem.image_url||''} onChange={e=>setEditItem(v=>({...v,image_url:e.target.value}))} className="form-input" placeholder="https://..."/>
                      </div>
                      <div>
                        <label className="form-label">Ккал</label>
                        <input type="number" value={editItem.calories||''} onChange={e=>setEditItem(v=>({...v,calories:parseInt(e.target.value)||undefined}))} className="form-input"/>
                      </div>
                      <div>
                        <label className="form-label">Время (мин)</label>
                        <input type="number" value={editItem.cook_time||''} onChange={e=>setEditItem(v=>({...v,cook_time:parseInt(e.target.value)||undefined}))} className="form-input"/>
                      </div>
                      <div className="md:col-span-2 lg:col-span-3 flex flex-wrap gap-4 pt-1">
                        {([['is_active','✅ Активно'],['is_bar','🍸 Барное'],['is_special','⭐ Блюдо дня'],['is_gluten_free','Без глютена'],['is_lactose_free','Без лактозы']] as [keyof MenuItem,string][]).map(([k,l]) => (
                          <label key={k} className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={!!editItem[k]} onChange={e=>setEditItem(v=>({...v,[k]:e.target.checked}))} className="accent-sp-orange w-4 h-4"/>
                            <span className="text-sp-cream/70 text-sm">{l}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4 pt-4 border-t border-white/8">
                      <button onClick={saveItem} disabled={itemSaving} className="btn-primary flex items-center gap-2 text-sm">
                        <Save size={14}/>{itemSaving?'Сохраняем...':'Сохранить'}
                      </button>
                      <button onClick={() => { setShowItemForm(false); setEditItem(null); }} className="btn-secondary text-sm">Отмена</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Table */}
              <div className="bg-sp-dark rounded-2xl overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr className="border-b border-white/8 bg-white/2">
                        <th className="text-left p-3 text-sp-cream/40 font-medium">Блюдо</th>
                        <th className="text-left p-3 text-sp-cream/40 font-medium">Категория</th>
                        <th className="text-right p-3 text-sp-cream/40 font-medium">Цена</th>
                        <th className="text-center p-3 text-sp-cream/40 font-medium">Статус</th>
                        <th className="p-3 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMenu.map(item => (
                        <tr key={item.id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              {item.image_url && <img src={item.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 opacity-80"/>}
                              <div>
                                <div className="text-sp-cream font-medium text-sm leading-tight">{item.name}</div>
                                <div className="flex gap-1 mt-0.5">
                                  {item.is_special && <span className="text-xs text-sp-orange">⭐</span>}
                                  {item.is_bar && <span className="text-xs text-blue-400">🍸</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sp-cream/50 text-xs">{item.category}</td>
                          <td className="p-3 text-right">
                            <span className="text-sp-orange font-semibold">{item.price?.toLocaleString('ru-RU')} ₽</span>
                            {item.original_price && <div className="text-sp-cream/30 text-xs line-through">{item.original_price.toLocaleString('ru-RU')} ₽</div>}
                          </td>
                          <td className="p-3 text-center">
                            <button onClick={() => toggleItem(item)}
                              className={`text-xs px-2.5 py-1 rounded-full transition-all ${item.is_active?'bg-green-500/15 text-green-400 hover:bg-red-500/15 hover:text-red-400':'bg-red-500/15 text-red-400 hover:bg-green-500/15 hover:text-green-400'}`}>
                              {item.is_active?'Активно':'Скрыто'}
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1 justify-end">
                              <button onClick={() => { setEditItem({...item}); setShowItemForm(true); }}
                                className="p-1.5 rounded-lg text-sp-cream/30 hover:text-sp-orange hover:bg-sp-orange/10 transition-all"><Edit2 size={13}/></button>
                              <button onClick={() => delItem(item.id)}
                                className="p-1.5 rounded-lg text-sp-cream/30 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={13}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredMenu.length===0 && <div className="text-center py-10 text-sp-cream/30">Ничего не найдено</div>}
                </div>
              </div>
            </div>
          )}

          {/* ══ ORDERS ══ */}
          {tab === 'orders' && (
            <div>
              <h2 className="text-sp-cream font-display text-2xl font-bold mb-5">Заказы <span className="text-sp-cream/30 text-lg font-normal">({orders.length})</span></h2>
              <div className="flex flex-col gap-3">
                {orders.map(o => (
                  <div key={o.id} className={`bg-sp-dark rounded-2xl p-5 border ${o.status==='new'?'border-red-500/30':'border-white/5'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sp-cream font-semibold">#{o.id} {o.customer_name}</span>
                          <Badge status={o.status}/>
                        </div>
                        <div className="text-sp-cream/40 text-xs mt-0.5 flex flex-wrap gap-2">
                          <span>📅 {new Date(o.created_at).toLocaleString('ru-RU')}</span>
                          <span>📞 {o.customer_phone}</span>
                          {o.delivery_address && <span>📍 {o.delivery_address}</span>}
                        </div>
                      </div>
                      <span className="text-sp-orange font-bold text-lg flex-shrink-0 ml-2">{o.total_amount?.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="text-sp-cream/60 text-sm mb-1 flex flex-wrap gap-x-2">
                      {o.items?.map((i,idx) => <span key={idx}>• {i.name} ×{i.quantity}</span>)}
                    </div>
                    {o.comment && <div className="text-sp-cream/30 text-xs italic mt-1">💬 {o.comment}</div>}
                    <StatusPicker current={o.status} options={['new','confirmed','preparing','delivered','cancelled']} onChange={s=>setStatus('orders',o.id,s)}/>
                  </div>
                ))}
                {orders.length===0 && <div className="text-center py-16 text-sp-cream/30">Заказов пока нет</div>}
              </div>
            </div>
          )}

          {/* ══ RESERVATIONS ══ */}
          {tab === 'reservations' && (
            <div>
              <h2 className="text-sp-cream font-display text-2xl font-bold mb-5">Бронирования <span className="text-sp-cream/30 text-lg font-normal">({reservations.length})</span></h2>
              <div className="flex flex-col gap-3">
                {reservations.map(r => (
                  <div key={r.id} className={`bg-sp-dark rounded-2xl p-5 border ${r.status==='pending'?'border-yellow-500/30':'border-white/5'}`}>
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sp-cream font-semibold">{r.guest_name}</span>
                          <Badge status={r.status}/>
                        </div>
                        <div className="text-sp-cream/40 text-xs mt-0.5">
                          Заявка: {new Date(r.created_at).toLocaleString('ru-RU')}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-sp-cream font-semibold">{r.date} в {r.time}</div>
                        <div className="text-sp-cream/40 text-xs">Стол #{r.table_number??'—'} · {r.guests_count} чел.</div>
                      </div>
                    </div>
                    <div className="text-sp-cream/50 text-sm">📞 {r.guest_phone}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusPicker current={r.status} options={['pending','confirmed','cancelled']} onChange={s=>setStatus('reservations',r.id,s)}/>
                      <button onClick={() => delReservation(r.id)} className="ml-auto p-1.5 rounded-lg text-sp-cream/20 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
                {reservations.length===0 && <div className="text-center py-16 text-sp-cream/30">Бронирований пока нет</div>}
              </div>
            </div>
          )}

          {/* ══ REVIEWS ══ */}
          {tab === 'reviews' && (
            <div>
              <h2 className="text-sp-cream font-display text-2xl font-bold mb-3">Отзывы</h2>
              <div className="flex gap-4 mb-5 text-sm">
                <span className="text-sp-cream/40">Всего: {reviews.length}</span>
                <span className="text-yellow-400">На модерации: {pendingReviews}</span>
                <span className="text-green-400">Опубликовано: {reviews.filter(r=>r.approved).length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {reviews.map(r => (
                  <div key={r.id} className={`bg-sp-dark rounded-2xl p-5 border-2 ${r.approved?'border-green-500/15':'border-yellow-500/20'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sp-cream font-semibold">{r.author_name}</span>
                          {r.approved
                            ? <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">Опубликован</span>
                            : <span className="text-xs bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full">На модерации</span>}
                        </div>
                        <div className="text-sp-cream/30 text-xs mt-0.5">{new Date(r.created_at).toLocaleString('ru-RU')}</div>
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        {[1,2,3,4,5].map(s=><span key={s} className={s<=r.rating?'text-sp-orange':'text-sp-cream/15'}>★</span>)}
                      </div>
                    </div>
                    <p className="text-sp-cream/70 text-sm leading-relaxed mb-4">{r.text}</p>
                    <div className="flex gap-2">
                      {!r.approved && <button onClick={()=>moderateReview(r.id,true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"><Check size={11}/>Опубликовать</button>}
                      {r.approved && <button onClick={()=>moderateReview(r.id,false)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/8 text-sp-cream/50 hover:bg-white/15 transition-colors"><EyeOff size={11}/>Скрыть</button>}
                      <button onClick={()=>delReview(r.id)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"><Trash2 size={11}/>Удалить</button>
                    </div>
                  </div>
                ))}
                {reviews.length===0 && <div className="text-center py-16 text-sp-cream/30">Отзывов пока нет</div>}
              </div>
            </div>
          )}

          {/* ══ BANQUETS ══ */}
          {tab === 'banquets' && (
            <div>
              <h2 className="text-sp-cream font-display text-2xl font-bold mb-5">Банкеты <span className="text-sp-cream/30 text-lg font-normal">({banquets.length})</span></h2>
              <div className="flex flex-col gap-3">
                {banquets.map(b => (
                  <div key={b.id} className={`bg-sp-dark rounded-2xl p-5 border ${b.status==='new'?'border-sp-orange/30':'border-white/5'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sp-cream font-semibold">{b.contact_name}</span>
                          <Badge status={b.status}/>
                        </div>
                        <div className="text-sp-cream/40 text-xs mt-0.5">
                          Заявка: {new Date(b.created_at).toLocaleString('ru-RU')}
                        </div>
                      </div>
                      <span className="text-sp-orange font-bold text-lg flex-shrink-0 ml-2">~{b.estimated_total?.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 text-sm text-sp-cream/60 mb-2">
                      <span>📞 {b.contact_phone}</span>
                      <span>🎉 {b.event_type}</span>
                      <span>📦 {b.package_name??'—'}</span>
                      <span>👥 {b.guests_count} чел.</span>
                      <span>📅 {b.event_date}</span>
                    </div>
                    {b.comment && <div className="text-sp-cream/40 text-xs italic mb-2">💬 {b.comment}</div>}
                    <StatusPicker current={b.status} options={['new','confirmed','completed','cancelled']} onChange={s=>setStatus('banquets',b.id,s)}/>
                  </div>
                ))}
                {banquets.length===0 && <div className="text-center py-16 text-sp-cream/30">Заявок пока нет</div>}
              </div>
            </div>
          )}

          {/* ══ PROMOS ══ */}
          {tab === 'promos' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sp-cream font-display text-2xl font-bold">Акции</h2>
                <button onClick={() => { setEditPromo({ is_active:true, sort_order:0 }); setShowPromoForm(true); }} className="btn-primary flex items-center gap-2 text-sm">
                  <Plus size={15}/>Добавить
                </button>
              </div>
              <AnimatePresence>
                {showPromoForm && editPromo && (
                  <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="bg-sp-dark rounded-2xl p-5 mb-5 border border-sp-orange/25">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sp-cream font-semibold">{editPromo.id?'Редактировать акцию':'Новая акция'}</h3>
                      <button onClick={() => { setShowPromoForm(false); setEditPromo(null); }} className="text-sp-cream/40 hover:text-sp-cream"><X size={18}/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><label className="form-label">Название *</label><input type="text" value={editPromo.title||''} onChange={e=>setEditPromo(v=>({...v,title:e.target.value}))} className="form-input"/></div>
                      <div><label className="form-label">Скидка (текст)</label><input type="text" value={editPromo.discount_text||''} onChange={e=>setEditPromo(v=>({...v,discount_text:e.target.value}))} className="form-input" placeholder="-20%, 490₽..."/></div>
                      <div className="md:col-span-2"><label className="form-label">Описание</label><textarea value={editPromo.description||''} onChange={e=>setEditPromo(v=>({...v,description:e.target.value}))} className="form-input resize-none h-16"/></div>
                      <div><label className="form-label">Действует до</label><input type="datetime-local" value={editPromo.expires_at?editPromo.expires_at.slice(0,16):''} onChange={e=>setEditPromo(v=>({...v,expires_at:e.target.value}))} className="form-input"/></div>
                      <div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!editPromo.is_active} onChange={e=>setEditPromo(v=>({...v,is_active:e.target.checked}))} className="accent-sp-orange w-4 h-4"/><span className="text-sp-cream/70 text-sm">Активна</span></label></div>
                    </div>
                    <div className="flex gap-3 mt-4 pt-4 border-t border-white/8">
                      <button onClick={savePromo} className="btn-primary flex items-center gap-2 text-sm"><Save size={14}/>Сохранить</button>
                      <button onClick={() => { setShowPromoForm(false); setEditPromo(null); }} className="btn-secondary text-sm">Отмена</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex flex-col gap-3">
                {promos.map(p => (
                  <div key={p.id} className={`bg-sp-dark rounded-2xl p-5 border ${p.is_active?'border-sp-orange/20':'border-white/5 opacity-60'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sp-cream font-semibold">{p.title}</span>
                          <span className="text-sp-orange font-bold">{p.discount_text}</span>
                          {!p.is_active && <span className="text-xs bg-white/10 text-sp-cream/40 px-2 py-0.5 rounded-full">Неактивна</span>}
                        </div>
                        <p className="text-sp-cream/50 text-sm mt-1">{p.description}</p>
                        {p.expires_at && <div className="text-sp-cream/30 text-xs mt-1">До: {new Date(p.expires_at).toLocaleString('ru-RU')}</div>}
                      </div>
                      <div className="flex gap-2 ml-4 flex-shrink-0">
                        <button onClick={() => { setEditPromo({...p}); setShowPromoForm(true); }} className="p-1.5 rounded-lg text-sp-cream/30 hover:text-sp-orange hover:bg-sp-orange/10 transition-all"><Edit2 size={13}/></button>
                        <button onClick={() => delPromo(p.id)} className="p-1.5 rounded-lg text-sp-cream/30 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={13}/></button>
                      </div>
                    </div>
                  </div>
                ))}
                {promos.length===0 && <div className="text-center py-10 text-sp-cream/30">Акций пока нет</div>}
              </div>
            </div>
          )}

          {/* ══ GALLERY ══ */}
          {tab === 'gallery' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sp-cream font-display text-2xl font-bold">Галерея</h2>
                <button onClick={() => { setEditGal({ is_active:true, category:'general', sort_order:0 }); setShowGalForm(true); }} className="btn-primary flex items-center gap-2 text-sm">
                  <Plus size={15}/>Добавить фото
                </button>
              </div>
              <AnimatePresence>
                {showGalForm && editGal && (
                  <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="bg-sp-dark rounded-2xl p-5 mb-5 border border-sp-orange/25">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sp-cream font-semibold">{editGal.id?'Редактировать фото':'Новое фото'}</h3>
                      <button onClick={() => { setShowGalForm(false); setEditGal(null); }} className="text-sp-cream/40 hover:text-sp-cream"><X size={18}/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2"><label className="form-label">URL фото *</label><input type="text" value={editGal.url||''} onChange={e=>setEditGal(v=>({...v,url:e.target.value}))} className="form-input" placeholder="https://..."/></div>
                      <div><label className="form-label">Подпись</label><input type="text" value={editGal.caption||''} onChange={e=>setEditGal(v=>({...v,caption:e.target.value}))} className="form-input"/></div>
                      <div><label className="form-label">Категория</label>
                        <select value={editGal.category||'general'} onChange={e=>setEditGal(v=>({...v,category:e.target.value}))} className="form-input">
                          <option value="general">Общее</option>
                          <option value="food">Еда</option>
                          <option value="interior">Интерьер</option>
                          <option value="events">События</option>
                          <option value="bar">Бар</option>
                        </select>
                      </div>
                      <div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!editGal.is_active} onChange={e=>setEditGal(v=>({...v,is_active:e.target.checked}))} className="accent-sp-orange w-4 h-4"/><span className="text-sp-cream/70 text-sm">Активно</span></label></div>
                    </div>
                    {editGal.url && <div className="mt-3"><img src={editGal.url} alt="" className="h-24 rounded-xl object-cover" onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/></div>}
                    <div className="flex gap-3 mt-4 pt-4 border-t border-white/8">
                      <button onClick={saveGal} className="btn-primary flex items-center gap-2 text-sm"><Save size={14}/>Сохранить</button>
                      <button onClick={() => { setShowGalForm(false); setEditGal(null); }} className="btn-secondary text-sm">Отмена</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {gallery.map(g => (
                  <div key={g.id} className={`relative group rounded-xl overflow-hidden border ${g.is_active?'border-white/10':'border-white/5 opacity-50'} aspect-square`}>
                    <img src={g.url} alt={g.caption} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                      <p className="text-white text-xs text-center">{g.caption}</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditGal({...g}); setShowGalForm(true); }} className="p-1.5 bg-white/20 rounded-lg text-white hover:bg-sp-orange/60 transition-all"><Edit2 size={12}/></button>
                        <button onClick={() => delGal(g.id)} className="p-1.5 bg-white/20 rounded-lg text-white hover:bg-red-500/60 transition-all"><Trash2 size={12}/></button>
                      </div>
                    </div>
                  </div>
                ))}
                {gallery.length===0 && <div className="col-span-4 text-center py-10 text-sp-cream/30">Фото пока нет</div>}
              </div>
            </div>
          )}

          {/* ══ QR ══ */}
          {tab === 'qr' && <QrSection/>}

          {/* ══ SETTINGS ══ */}
          {tab === 'settings' && (
            <div className="max-w-lg">
              <h2 className="text-sp-cream font-display text-2xl font-bold mb-6">Настройки</h2>
              <Section title="Telegram уведомления">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="form-label">Токен бота</label>
                    <input type="text" value={tg.telegram_bot_token} onChange={e=>setTg(v=>({...v,telegram_bot_token:e.target.value}))} className="form-input font-mono text-sm" placeholder="123456789:ABCdef..."/>
                    <p className="text-sp-cream/30 text-xs mt-1">Получите у @BotFather в Telegram</p>
                  </div>
                  <div>
                    <label className="form-label">Chat ID</label>
                    <input type="text" value={tg.telegram_chat_id} onChange={e=>setTg(v=>({...v,telegram_chat_id:e.target.value}))} className="form-input font-mono text-sm" placeholder="-100123456789"/>
                    <p className="text-sp-cream/30 text-xs mt-1">ID чата для уведомлений. Узнайте через @userinfobot</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={saveTg} disabled={tgSaving} className="btn-primary flex items-center gap-2 text-sm">
                      <Save size={14}/>{tgSaving?'Сохраняем...':tgSaved?'✅ Сохранено!':'Сохранить'}
                    </button>
                    <button onClick={testTg} className="btn-secondary flex items-center gap-2 text-sm">
                      <Send size={14}/>Тест
                    </button>
                  </div>
                  <div className="bg-sp-darkest rounded-xl p-4 mt-2">
                    <p className="text-sp-cream/50 text-xs font-medium mb-2">Как настроить:</p>
                    <ol className="text-sp-cream/30 text-xs space-y-1 list-decimal list-inside">
                      <li>Откройте @BotFather → /newbot → получите токен</li>
                      <li>Добавьте бота в чат/канал как администратора</li>
                      <li>Узнайте Chat ID через @userinfobot</li>
                      <li>Введите данные выше и нажмите «Тест»</li>
                    </ol>
                  </div>
                </div>
              </Section>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
