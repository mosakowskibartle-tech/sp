export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

type Listener = () => void;
const listeners: Listener[] = [];

const notify = () => listeners.forEach(fn => fn());

export const cartStore = {
  items: [] as CartItem[],

  subscribe(fn: Listener) {
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  },

  add(item: Omit<CartItem, 'quantity'>) {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({ ...item, quantity: 1 });
    }
    notify();
  },

  remove(id: number) {
    this.items = this.items.filter(i => i.id !== id);
    notify();
  },

  updateQty(id: number, qty: number) {
    if (qty <= 0) return this.remove(id);
    const item = this.items.find(i => i.id === id);
    if (item) { item.quantity = qty; notify(); }
  },

  clear() {
    this.items = [];
    notify();
  },

  get total() {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  get count() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }
};
