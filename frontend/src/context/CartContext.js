import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const { user } = useAuth();

  const load = async () => {
    if (!user) { setItems([]); setCount(0); return; }
    try {
      const data = await api.cart.get();
      setItems(data);
      setCount(data.reduce((s, i) => s + i.quantity, 0));
    } catch { setItems([]); setCount(0); }
  };

  useEffect(() => { load(); }, [user]);

  const add = async (product_id, quantity = 1) => {
    await api.cart.add({ product_id, quantity });
    await load();
  };

  const update = async (id, quantity) => {
    await api.cart.update(id, { quantity });
    await load();
  };

  const remove = async (id) => {
    await api.cart.remove(id);
    await load();
  };

  const clear = async () => {
    await api.cart.clear();
    setItems([]); setCount(0);
  };

  const total = items.reduce((s, i) => s + (i.discount_price || i.price) * i.quantity, 0);

  return <CartContext.Provider value={{ items, count, total, add, update, remove, clear, load }}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
