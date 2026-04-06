/**
 * Единый слой доступа к данным через Supabase JS SDK.
 * Работает на любом хостинге — shared reg.ru, VPS, Vercel, и т.д.
 * Никакого серверного кода не требуется.
 */
import supabase from './supabase';

// ─── Telegram ────────────────────────────────────────────────────────────────
async function getTgCreds(): Promise<{ token: string; chatId: string }> {
  const { data } = await supabase
    .from('settings')
    .select('key,value')
    .in('key', ['telegram_bot_token', 'telegram_chat_id']);
  const map: Record<string, string> = {};
  (data ?? []).forEach((r: { key: string; value: string }) => { map[r.key] = r.value; });
  return { token: map.telegram_bot_token ?? '', chatId: map.telegram_chat_id ?? '' };
}

export async function sendTelegram(text: string): Promise<void> {
  try {
    const { token, chatId } = await getTgCreds();
    if (!token || !chatId) return;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch { /* silent */ }
}

// ─── Settings ────────────────────────────────────────────────────────────────
export async function getSettings(): Promise<Record<string, string>> {
  const { data } = await supabase.from('settings').select('*');
  const obj: Record<string, string> = {};
  (data ?? []).forEach((r: { key: string; value: string }) => { obj[r.key] = r.value; });
  return obj;
}

export async function saveSettings(updates: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(updates)) {
    await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  }
}

// ─── Menu ─────────────────────────────────────────────────────────────────────
export async function getMenuItems(opts?: { bar?: boolean; activeOnly?: boolean }) {
  let q = supabase.from('menu_items').select('*').order('sort_order');
  if (opts?.activeOnly !== false) q = q.eq('is_active', true);
  if (opts?.bar === true)  q = q.eq('is_bar', true);
  if (opts?.bar === false) q = q.eq('is_bar', false);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function upsertMenuItem(item: Record<string, unknown>) {
  if (item.id) {
    const { id, ...rest } = item;
    const { data, error } = await supabase.from('menu_items').update(rest).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('menu_items').insert(item).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMenuItem(id: number) {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function getOrders() {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createOrder(order: Record<string, unknown>) {
  const { data, error } = await supabase.from('orders').insert(order).select().single();
  if (error) throw error;
  // Telegram
  const items = (order.items as { name: string; quantity: number; price: number }[])
    .map(i => `• ${i.name} ×${i.quantity} = ${i.price * i.quantity}₽`).join('\n');
  await sendTelegram(
    `🍽 <b>Новый заказ #${data.id}</b>\n\n👤 ${order.customer_name}\n📞 ${order.customer_phone}\n📍 ${order.delivery_address || 'Самовывоз'}\n\n${items}\n\n💰 Итого: ${order.total_amount}₽\n💬 ${order.comment || 'Без комментария'}`
  );
  return data;
}

export async function updateOrderStatus(id: number, status: string) {
  const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ─── Reservations ─────────────────────────────────────────────────────────────
export async function getReservations(date?: string) {
  let q = supabase.from('reservations').select('*').order('created_at', { ascending: false });
  if (date) q = q.eq('date', date);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createReservation(r: Record<string, unknown>) {
  const { data, error } = await supabase.from('reservations').insert(r).select().single();
  if (error) throw error;
  await sendTelegram(
    `📅 <b>Новая бронь стола</b>\n\n👤 ${r.guest_name}\n📞 ${r.guest_phone}\n🗓 ${r.date} в ${r.time}\n👥 Гостей: ${r.guests_count}\n🪑 Стол: ${r.table_number ?? 'любой'}`
  );
  return data;
}

export async function updateReservationStatus(id: number, status: string) {
  const { data, error } = await supabase.from('reservations').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export async function getReviews(all = false) {
  let q = supabase.from('reviews').select('*').order('created_at', { ascending: false });
  if (!all) q = q.eq('approved', true);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createReview(r: Record<string, unknown>) {
  const { data, error } = await supabase.from('reviews').insert({ ...r, approved: false }).select().single();
  if (error) throw error;
  return data;
}

export async function updateReviewApproval(id: number, approved: boolean) {
  const { data, error } = await supabase.from('reviews').update({ approved }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteReview(id: number) {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
}

// ─── Banquets ─────────────────────────────────────────────────────────────────
export async function getBanquets() {
  const { data, error } = await supabase.from('banquet_requests').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createBanquet(b: Record<string, unknown>) {
  const { data, error } = await supabase.from('banquet_requests').insert(b).select().single();
  if (error) throw error;
  const svcs = Array.isArray(b.extra_services) ? (b.extra_services as string[]).join(', ') : '—';
  await sendTelegram(
    `🎉 <b>Заявка на банкет</b>\n\n👤 ${b.contact_name}\n📞 ${b.contact_phone}\n🎊 Повод: ${b.event_type}\n📦 Пакет: ${b.package_name ?? '—'}\n👥 Гостей: ${b.guests_count}\n📅 Дата: ${b.event_date}\n💰 ~${b.estimated_total}₽\n🎁 Доп. услуги: ${svcs}\n💬 ${b.comment ?? 'Без комментария'}`
  );
  return data;
}

export async function updateBanquetStatus(id: number, status: string) {
  const { data, error } = await supabase.from('banquet_requests').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ─── Promotions ───────────────────────────────────────────────────────────────
export async function getPromotions(all = false) {
  let q = supabase.from('promotions').select('*').order('sort_order');
  if (!all) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function upsertPromotion(p: Record<string, unknown>) {
  if (p.id) {
    const { id, ...rest } = p;
    const { data, error } = await supabase.from('promotions').update(rest).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('promotions').insert(p).select().single();
  if (error) throw error;
  return data;
}

export async function deletePromotion(id: number) {
  const { error } = await supabase.from('promotions').delete().eq('id', id);
  if (error) throw error;
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
export async function getGallery(all = false) {
  let q = supabase.from('gallery').select('*').order('sort_order');
  if (!all) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function upsertGalleryItem(g: Record<string, unknown>) {
  if (g.id) {
    const { id, ...rest } = g;
    const { data, error } = await supabase.from('gallery').update(rest).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('gallery').insert(g).select().single();
  if (error) throw error;
  return data;
}

export async function deleteGalleryItem(id: number) {
  const { error } = await supabase.from('gallery').delete().eq('id', id);
  if (error) throw error;
}
