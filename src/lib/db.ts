/**
 * db.ts — frontend data layer.
 * All calls go through /api/* Express routes → Railway PostgreSQL.
 * No Supabase SDK needed on the frontend.
 */

const api = async (path: string, opts?: RequestInit) => {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
};

const get  = (path: string) => api(path);
const post = (path: string, body: unknown) => api(path, { method: 'POST', body: JSON.stringify(body) });
const put  = (path: string, body: unknown) => api(path, { method: 'PUT',  body: JSON.stringify(body) });
const del  = (path: string, body: unknown) => api(path, { method: 'DELETE', body: JSON.stringify(body) });

// ─── Settings ─────────────────────────────────────────────────────────────────
export const getSettings = () => get('/api/settings');
export const saveSettings = (updates: Record<string, string>) => put('/api/settings', updates);

// ─── Menu ─────────────────────────────────────────────────────────────────────
export const getMenuItems = (opts?: { bar?: boolean; activeOnly?: boolean }) => {
  const params = new URLSearchParams();
  if (opts?.bar === true)  params.set('bar', 'true');
  if (opts?.bar === false) params.set('bar', 'false');
  if (opts?.activeOnly === false) params.set('all', 'true');
  return get(`/api/menu?${params}`);
};
export const upsertMenuItem = (item: Record<string, unknown>) =>
  item.id ? put('/api/menu', item) : post('/api/menu', item);
export const deleteMenuItem = (id: number) => del('/api/menu', { id });

// ─── Orders ───────────────────────────────────────────────────────────────────
export const getOrders = () => get('/api/orders');
export const createOrder = (order: Record<string, unknown>) => post('/api/orders', order);
export const updateOrderStatus = (id: number, status: string) => put('/api/orders', { id, status });

// ─── Reservations ─────────────────────────────────────────────────────────────
export const getReservations = (date?: string) =>
  get(date ? `/api/reservations?date=${date}` : '/api/reservations');
export const createReservation = (r: Record<string, unknown>) => post('/api/reservations', r);
export const updateReservationStatus = (id: number, status: string) =>
  put('/api/reservations', { id, status });
export const deleteReservation = (id: number) => del('/api/reservations', { id });

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const getReviews = (all = false) => get(all ? '/api/reviews?all=true' : '/api/reviews');
export const createReview = (r: Record<string, unknown>) => post('/api/reviews', r);
export const updateReviewApproval = (id: number, approved: boolean) =>
  put('/api/reviews', { id, approved });
export const deleteReview = (id: number) => del('/api/reviews', { id });

// ─── Banquets ─────────────────────────────────────────────────────────────────
export const getBanquets = () => get('/api/banquets');
export const createBanquet = (b: Record<string, unknown>) => post('/api/banquets', b);
export const updateBanquetStatus = (id: number, status: string) =>
  put('/api/banquets', { id, status });

// ─── Promotions ───────────────────────────────────────────────────────────────
export const getPromotions = (all = false) =>
  get(all ? '/api/promotions?all=true' : '/api/promotions');
export const upsertPromotion = (p: Record<string, unknown>) =>
  p.id ? put('/api/promotions', p) : post('/api/promotions', p);
export const deletePromotion = (id: number) => del('/api/promotions', { id });

// ─── Gallery ──────────────────────────────────────────────────────────────────
export const getGallery = (all = false) =>
  get(all ? '/api/gallery?all=true' : '/api/gallery');
export const upsertGalleryItem = (g: Record<string, unknown>) =>
  g.id ? put('/api/gallery', g) : post('/api/gallery', g);
export const deleteGalleryItem = (id: number) => del('/api/gallery', { id });

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getAnalytics = () => get('/api/analytics');
