import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Send } from 'lucide-react';
import { getReviews, createReview } from '../lib/db';

interface Review { id: number; author_name: string; rating: number; text: string; created_at: string; }

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', rating: 5, text: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getReviews()
      .then(data => { setReviews(data as Review[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.text) return;
    setSubmitting(true);
    try {
      await createReview({ author_name: form.name, rating: form.rating, text: form.text });
      setSubmitted(true);
    } finally { setSubmitting(false); }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <div className="min-h-screen bg-sp-darkest pt-20">
      <div className="bg-sp-dark py-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl md:text-5xl text-sp-cream font-bold mb-2">Отзывы</h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex gap-1">{[1,2,3,4,5].map(i => <Star key={i} size={20} className={i <= Math.round(parseFloat(avgRating)) ? 'text-sp-orange fill-sp-orange' : 'text-sp-cream/20'} />)}</div>
              <span className="text-sp-cream font-bold text-xl">{avgRating}</span>
              <span className="text-sp-cream/40 text-sm">({reviews.length} отзывов)</span>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex flex-col gap-4">{[1,2,3].map(i => <div key={i} className="skeleton-card h-32" />)}</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-20 text-sp-cream/40">Отзывов пока нет. Будьте первым!</div>
            ) : (
              <div className="flex flex-col gap-4">
                {reviews.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="review-card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sp-cream font-semibold">{r.author_name}</div>
                        <div className="text-sp-cream/30 text-xs mt-0.5">{new Date(r.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      </div>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= r.rating ? 'text-sp-orange fill-sp-orange' : 'text-sp-cream/20'} />)}</div>
                    </div>
                    <p className="text-sp-cream/70 text-sm leading-relaxed">{r.text}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="bg-sp-dark rounded-2xl p-6 sticky top-24">
              <h2 className="font-display text-xl text-sp-cream font-bold mb-5">Оставить отзыв</h2>
              {submitted ? (
                <div className="text-center py-6"><div className="text-4xl mb-3">🙏</div><p className="text-sp-cream/70">Спасибо! Ваш отзыв отправлен на модерацию.</p></div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div><label className="form-label">Ваше имя</label><input type="text" value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} className="form-input" required /></div>
                  <div>
                    <label className="form-label">Оценка</label>
                    <div className="flex gap-2 mt-1">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button" onClick={() => setForm(v => ({ ...v, rating: s }))} className="transition-transform hover:scale-110">
                          <Star size={24} className={s <= form.rating ? 'text-sp-orange fill-sp-orange' : 'text-sp-cream/20'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><label className="form-label">Отзыв</label><textarea value={form.text} onChange={e => setForm(v => ({ ...v, text: e.target.value }))} className="form-input resize-none h-28" required /></div>
                  <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center gap-2">
                    <Send size={16} />{submitting ? 'Отправка...' : 'Отправить отзыв'}
                  </button>
                  <p className="text-sp-cream/30 text-xs">Отзыв пройдёт модерацию перед публикацией</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
