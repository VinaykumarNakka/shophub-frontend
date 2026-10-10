import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api.js";

/* ---------------- Auth ---------------- */
const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shophub_user"));
    } catch {
      return null;
    }
  });

  const persist = (data) => {
    localStorage.setItem("shophub_token", data.token);
    localStorage.setItem("shophub_user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  const login = async (email, password) => persist(await api.post("/auth/login", { email, password }));
  const register = async (form) => persist(await api.post("/auth/register", form));

  const logout = useCallback(() => {
    localStorage.removeItem("shophub_token");
    localStorage.removeItem("shophub_user");
    setUser(null);
  }, []);

  // refresh profile (e.g. a seller that was approved after logging in)
  useEffect(() => {
    if (!localStorage.getItem("shophub_token")) return;
    api
      .get("/me")
      .then((me) =>
        setUser((prev) => {
          if (!prev) return prev;
          const merged = { ...prev, ...me };
          localStorage.setItem("shophub_user", JSON.stringify(merged));
          return merged;
        })
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    window.addEventListener("shophub-logout", logout);
    return () => window.removeEventListener("shophub-logout", logout);
  }, [logout]);

  return <AuthCtx.Provider value={{ user, login, register, logout }}>{children}</AuthCtx.Provider>;
}

/* ---------------- Cart (kept in the browser until checkout) ---------------- */
const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shophub_cart")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("shophub_cart", JSON.stringify(items));
  }, [items]);

  const add = (p, qty = 1) =>
    setItems((cur) => {
      const found = cur.find((i) => i.id === p.id);
      if (found) {
        return cur.map((i) => (i.id === p.id ? { ...i, stock: p.stock, quantity: Math.min(i.quantity + qty, p.stock) } : i));
      }
      return [...cur, { id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, stock: p.stock, quantity: Math.min(qty, p.stock) }];
    });

  const setQty = (id, q) =>
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(Number(q) || 1, i.stock)) } : i)));
  const remove = (id) => setItems((cur) => cur.filter((i) => i.id !== id));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return <CartCtx.Provider value={{ items, add, setQty, remove, clear, count, total }}>{children}</CartCtx.Provider>;
}
