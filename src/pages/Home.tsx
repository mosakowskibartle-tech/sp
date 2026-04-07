import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, Star, Clock, Users, Flame, MapPin, Phone } from 'lucide-react';
import MenuCard, { type MenuItem } from '../components/MenuCard';
import { cartStore } from '../lib/cart';
import { getMenuItems, getPromotions, getReviews, getGallery } from '../lib/db';

interface Promo { id: number; title: string; description: string; discount_text: string; expires_at: string; }
interface Review { id: number; author_name: string; rating: number; text: string; created_at: string; }
interface GalleryItem { id: number; url: string; caption: string; }

function Countdown({ target }: { target: string }) {
  const [t, setT] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(target).getTime() - Date.now());
      setT({ h: Math.floor(diff / 3600000) % 24, m: Math.floor(diff / 60000) % 60, s: Math.floor(diff / 1000) % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex gap-2">
      {[['ч', t.h], ['м', t.m], ['с', t.s]].map(([l, v]) => (
        <div key={l as string} className="flex flex-col items-center">
          <div className="bg-black/30 rounded-lg px-2 py-1 font-mono font-bold text-sp-orange text-lg min-w-[36px] text-center">{pad(v as number)}</div>
          <span className="text-white/40 text-xs mt-0.5">{l}</span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState<MenuItem[]>([]);
  const [special, setSpecial] = useState<MenuItem | null>(null);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const aboutRef = useRef(null);
  const isAboutVisible = useInView(aboutRef, { once: true, margin: '-80px' });

  useEffect(() => {
    Promise.all([
      getMenuItems({ bar: false }),
      getPromotions(),
      getReviews(),
      getGallery(),
    ]).then(([menu, p, rv, g]) => {
      const sp = (menu as MenuItem[]).find(d => d.is_special);
      if (sp) setSpecial(sp);
      setFeatured((menu as MenuItem[]).filter(d => !d.is_special).slice(0, 6));
      setPromos(p as Promo[]);
      setReviews((rv as Review[]).slice(0, 4));
      setGallery((g as GalleryItem[]).slice(0, 6));
    }).catch(console.error);
  }, []);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ══ HERO ══ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div
          style={{ backgroundImage: 'url(https://github.com/mosakowskibartle-tech/sp/blob/main/public/images/hero-bg.jpg?raw=true)', y: heroY }}
          className="absolute inset-0 bg-cover bg-center scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-sp-darkest" />
        <div className="absolute inset-0 bg-gradient-to-r from-sp-terracotta/15 via-transparent to-transparent" />
        {[...Array(6)].map((_, i) => (
          <motion.div key={i} className="absolute w-1 h-1 bg-sp-orange/40 rounded-full"
            style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 22}%` }}
            animate={{ y: [-10, 10, -10], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="inline-flex items-center gap-2 bg-sp-orange/15 border border-sp-orange/30 text-sp-orange text-sm font-medium px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
              <MapPin size={13} /><span>МЦД Сходня · ул. Некрасова 15</span>
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }} className="hero-title mb-4">
            <span className="text-sp-cream">Соль</span><span className="text-sp-orange"> &amp; </span><span className="text-sp-cream">Перец</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="text-sp-cream/70 text-xl md:text-2xl mb-3 font-light">
            Домашняя кухня и уютная атмосфера
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-sp-cream/40 text-sm mb-10">
            Шашлык · Гриль · Плов · Банкеты · Живая музыка
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/menu" className="btn-hero-primary">🍽️ Смотреть меню</Link>
            <Link to="/reserve" className="btn-hero-secondary">🗓️ Забронировать стол</Link>
          </motion.div>
          {avgRating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="mt-10 flex items-center justify-center gap-2">
              <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={14} className={i <= Math.round(parseFloat(avgRating)) ? 'text-sp-orange fill-sp-orange' : 'text-white/20'} />)}</div>
              <span className="text-sp-cream/60 text-sm">{avgRating} · {reviews.length} отзывов</span>
            </motion.div>
          )}
        </motion.div>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sp-cream/30">
          <ChevronDown size={30} />
        </motion.div>
      </section>

      {/* ══ STATS ══ */}
      <section className="py-10 bg-sp-darkest border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Flame size={22} />, val: '150+', label: 'Блюд в меню' },
              { icon: <Clock size={22} />, val: 'До 05:00', label: 'В выходные' },
              { icon: <Users size={22} />, val: '100', label: 'Мест для банкетов' },
              { icon: <Star size={22} />, val: avgRating ?? '4.8', label: 'Средняя оценка' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="stat-card">
                <div className="text-sp-orange mb-1">{s.icon}</div>
                <div className="text-sp-cream font-bold text-2xl">{s.val}</div>
                <div className="text-sp-cream/40 text-xs">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PROMOS ══ */}
      {promos.length > 0 && (
        <section className="py-16 bg-sp-dark">
          <div className="container mx-auto px-4">
            <div className="section-header mb-8">
              <h2 className="section-title">🔥 Акции</h2>
              <Link to="/menu" className="text-sp-orange hover:underline text-sm">Всё меню →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {promos.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }} className="promo-card">
                  <div className="promo-badge">{p.discount_text}</div>
                  <h3 className="text-sp-cream font-display font-bold text-xl mb-2">{p.title}</h3>
                  <p className="text-sp-cream/60 text-sm mb-4 leading-relaxed">{p.description}</p>
                  {p.expires_at && <><div className="text-sp-cream/30 text-xs mb-1.5">До конца акции:</div><Countdown target={p.expires_at} /></>}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ SPECIAL DISH ══ */}
      {special && (
        <section className="py-16 bg-sp-darkest">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="special-dish-banner">
              <div className="flex-1">
                <span className="inline-block bg-sp-orange text-white text-sm font-bold px-4 py-1.5 rounded-full mb-4">⭐ Блюдо дня</span>
                <h2 className="font-display text-3xl md:text-4xl text-sp-cream font-bold mb-3">{special.name}</h2>
                <p className="text-sp-cream/60 mb-6 max-w-md leading-relaxed">{special.description}</p>
                <div className="flex items-center gap-4 mb-6">
                  {special.original_price && <span className="text-sp-cream/40 text-xl line-through">{special.original_price.toLocaleString('ru-RU')} ₽</span>}
                  <span className="text-sp-orange font-bold text-4xl">{special.price.toLocaleString('ru-RU')} ₽</span>
                  {special.original_price && (
                    <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-bold">-{Math.round((1 - special.price / special.original_price) * 100)}%</span>
                  )}
                </div>
                <button onClick={() => cartStore.add({ id: special.id, name: special.name, price: special.price, image_url: special.image_url })} className="btn-primary text-base px-8">В корзину</button>
              </div>
              <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
                <motion.img whileHover={{ scale: 1.03 }} transition={{ duration: 0.4 }} src={special.image_url || '/images/dish-plov.jpg'} alt={special.name} className="w-full h-64 md:h-80 object-cover rounded-2xl shadow-2xl" />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ══ POPULAR ══ */}
      <section className="py-16 bg-sp-dark">
        <div className="container mx-auto px-4">
          <div className="section-header mb-8">
            <h2 className="section-title">Популярные блюда</h2>
            <Link to="/menu" className="text-sp-orange hover:underline text-sm">Всё меню →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {featured.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <MenuCard item={item} />
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/menu" className="btn-primary text-base px-12">Смотреть полное меню</Link>
          </div>
        </div>
      </section>

      {/* ══ GALLERY ══ */}
      {gallery.length > 0 && (
        <section className="py-16 bg-sp-darkest">
          <div className="container mx-auto px-4">
            <div className="section-header mb-8"><h2 className="section-title">Галерея</h2></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {gallery.map((img, i) => (
                <motion.div key={img.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} whileHover={{ scale: 1.02 }} onClick={() => setLightbox(img.url)} className="relative overflow-hidden rounded-2xl cursor-pointer group aspect-square">
                  <img src={img.url} alt={img.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-white text-sm font-medium">{img.caption}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          {lightbox && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
              <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} src={lightbox} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
              <button className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl">✕</button>
            </motion.div>
          )}
        </section>
      )}

      {/* ══ ABOUT ══ */}
      <section ref={aboutRef} className="py-20 bg-sp-dark">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={isAboutVisible ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7 }}>
              <span className="text-sp-orange text-sm font-medium uppercase tracking-widest mb-3 block">О нас</span>
              <h2 className="font-display text-3xl md:text-4xl text-sp-cream font-bold mb-6">Место, где хочется возвращаться</h2>
              <p className="text-sp-cream/60 leading-relaxed mb-4">Кафе «Соль и Перец» — это место, где вкусная еда встречается с домашним теплом. Мы готовим шашлык, плов, гриль и домашние блюда с душой.</p>
              <p className="text-sp-cream/60 leading-relaxed mb-8">У нас уютный зал, просторная парковка и сердечный персонал. Рядом МЦД Сходня — легко добраться!</p>
              <div className="flex flex-wrap gap-4">
                <Link to="/reserve" className="btn-primary">Забронировать стол</Link>
                <Link to="/banquet" className="btn-secondary">Заказать банкет</Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 40 }} animate={isAboutVisible ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.2 }} className="grid grid-cols-2 gap-3">
              {['https://sp-production-fb73.up.railway.app/images/interior.jpg','https://sp-production-fb73.up.railway.app/images/interior.jpg','https://sp-production-fb73.up.railway.app/images/team.jpg','https://sp-production-fb73.up.railway.app/images/banquet.jpg'].map((src, i) => (
                <motion.img key={i} whileHover={{ scale: 1.03 }} src={src} alt="" className={`rounded-2xl w-full h-44 object-cover ${i % 2 === 1 ? 'mt-6' : ''}`} />
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ REVIEWS ══ */}
      {reviews.length > 0 && (
        <section className="py-16 bg-sp-darkest">
          <div className="container mx-auto px-4">
            <div className="section-header mb-8">
              <div>
                <h2 className="section-title">Отзывы гостей</h2>
                {avgRating && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={14} className={i <= Math.round(parseFloat(avgRating)) ? 'text-sp-orange fill-sp-orange' : 'text-white/20'} />)}</div>
                    <span className="text-sp-cream/50 text-sm">{avgRating} из 5</span>
                  </div>
                )}
              </div>
              <Link to="/reviews" className="text-sp-orange hover:underline text-sm">Все отзывы →</Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {reviews.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="review-card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sp-cream font-semibold">{r.author_name}</div>
                      <div className="text-sp-cream/30 text-xs mt-0.5">{new Date(r.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={13} className={s <= r.rating ? 'text-sp-orange fill-sp-orange' : 'text-white/15'} />)}</div>
                  </div>
                  <p className="text-sp-cream/65 text-sm leading-relaxed">{r.text}</p>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8"><Link to="/reviews" className="btn-secondary">Оставить отзыв</Link></div>
          </div>
        </section>
      )}

      {/* ══ MAP ══ */}
      <section className="py-16 bg-sp-dark">
        <div className="container mx-auto px-4">
          <div className="section-header mb-8"><h2 className="section-title">Как нас найти</h2></div>
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-4">
              {[
                { icon: <MapPin size={20} />, title: 'Адрес', text: 'Московская обл., Химки, ул. Некрасова 15', sub: 'Рядом МЦД Сходня' },
                { icon: <Phone size={20} />, title: 'Телефон', text: '+7 (925) 767-77-78', sub: 'Звонки и WhatsApp' },
                { icon: <Clock size={20} />, title: 'Часы работы', text: 'Пн–Пт: 09:00 – 01:00', sub: 'Сб–Вс: 09:00 – 05:00' },
              ].map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="contact-card">
                  <div className="contact-icon">{c.icon}</div>
                  <div><div className="text-sp-cream/40 text-xs mb-0.5">{c.title}</div><div className="text-sp-cream font-semibold">{c.text}</div><div className="text-sp-cream/40 text-sm">{c.sub}</div></div>
                </motion.div>
              ))}
              <a href="tel:+79257677778" className="btn-primary flex items-center justify-center gap-2 mt-2"><Phone size={16} />Позвонить</a>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/8 h-80">
              <iframe src="https://yandex.ru/map-widget/v1/org/sol_i_perets/172085958854/?ll=37.282959%2C55.944047&z=16" width="100%" height="100%" frameBorder="0" title="Карта" />
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sp-terracotta via-sp-orange to-amber-500" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(/images/hero-bg.jpg)', backgroundSize: 'cover' }} />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-5xl text-white font-bold mb-4">Закажите банкет или мероприятие</h2>
          <p className="text-white/80 text-lg mb-8">Дни рождения, корпоративы, свадьбы — мы организуем любое мероприятие</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/banquet" className="bg-white text-sp-orange font-bold px-10 py-4 rounded-full hover:bg-sp-cream transition-all text-base">Узнать подробнее</Link>
            <a href="tel:+79257677778" className="border-2 border-white text-white font-bold px-10 py-4 rounded-full hover:bg-white/15 transition-all text-base">Позвонить нам</a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
