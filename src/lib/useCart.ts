import { useState, useEffect } from 'react';
import { cartStore, type CartItem } from './cart';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([...cartStore.items]);
  const [total, setTotal] = useState(cartStore.total);
  const [count, setCount] = useState(cartStore.count);

  useEffect(() => {
    const unsub = cartStore.subscribe(() => {
      setItems([...cartStore.items]);
      setTotal(cartStore.total);
      setCount(cartStore.count);
    });
    return unsub;
  }, []);

  return {
    items,
    total,
    count,
    add: (item: Omit<CartItem, 'quantity'>) => cartStore.add(item),
    remove: (id: number) => cartStore.remove(id),
    updateQty: (id: number, qty: number) => cartStore.updateQty(id, qty),
    clear: () => cartStore.clear()
  };
}
