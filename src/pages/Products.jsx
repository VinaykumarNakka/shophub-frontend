import { useEffect, useState } from "react";
import { api, money } from "../api.js";
import { useAuth, useCart } from "../context.jsx";
import { Alert, PLACEHOLDER } from "../components.jsx";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [justAdded, setJustAdded] = useState(null);
  const { user } = useAuth();
  const { add } = useCart();

  useEffect(() => {
    api.get("/categories").then(setCategories).catch(() => {});
  }, []);

  // re-query while typing (small debounce)
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (categoryId) params.set("categoryId", categoryId);
      setLoading(true);
      api
        .get(`/products?${params}`)
        .then((d) => {
          setProducts(d);
          setError("");
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, categoryId]);

  const canBuy = !user || user.role === "CUSTOMER";

  const addToCart = (p) => {
    add(p);
    setJustAdded(p.id);
    setTimeout(() => setJustAdded(null), 1200);
  };

  return (
    <>
      <div className="toolbar">
        <input placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <Alert>{error}</Alert>
      {loading && <p className="muted">Loading…</p>}
      {!loading && products.length === 0 && !error && <p className="muted">No products found.</p>}

      <div className="grid">
        {products.map((p) => (
          <div className="card" key={p.id}>
            <img src={p.imageUrl || PLACEHOLDER} alt={p.name} onError={(e) => (e.currentTarget.src = PLACEHOLDER)} />
            <div className="card-body">
              <div className="muted small">{p.categoryName || "Uncategorised"}</div>
              <h3>{p.name}</h3>
              <p className="desc">{p.description}</p>
              <div className="row">
                <strong className="price">{money(p.price)}</strong>
                <span className={p.stock > 0 ? "small ok" : "small bad"}>{p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</span>
              </div>
              <div className="muted small">Sold by {p.sellerName}</div>
              {canBuy && (
                <button
                  className="btn btn-primary block"
                  disabled={p.stock === 0}
                  onClick={() => addToCart(p)}
                >
                  {justAdded === p.id ? "Added ✓" : "Add to cart"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
