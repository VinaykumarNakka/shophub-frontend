import { useCallback, useEffect, useState } from "react";
import { api, fmtDate, money } from "../api.js";
import { useAuth } from "../context.jsx";
import { Alert, Badge, OrderLines, Stat, Tabs } from "../components.jsx";

const EMPTY = { name: "", description: "", price: "", stock: "", imageUrl: "", categoryId: "" };
const NEXT_STATUSES = ["CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function Seller() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Products");

  return (
    <>
      <h2>Seller panel</h2>
      {!user.approved && (
        <Alert kind="warn">
          Your seller account is waiting for admin approval. You can look around, but you can add products only after approval.
        </Alert>
      )}
      <Tabs tabs={["Products", "Orders", "Sales report"]} active={tab} onChange={setTab} />
      {tab === "Products" && <MyProducts approved={user.approved} />}
      {tab === "Orders" && <SellerOrders />}
      {tab === "Sales report" && <Report />}
    </>
  );
}

function MyProducts({ approved }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(() => api.get("/seller/products").then(setProducts).catch((e) => setError(e.message)), []);
  useEffect(() => {
    load();
    api.get("/categories").then(setCategories).catch(() => {});
  }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    const body = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      imageUrl: form.imageUrl,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
    };
    try {
      if (editingId) await api.put(`/seller/products/${editingId}`, body);
      else await api.post("/seller/products", body);
      setMsg(editingId ? "Product updated" : "Product added");
      setForm(EMPTY);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      stock: p.stock,
      imageUrl: p.imageUrl || "",
      categoryId: p.categoryId || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this product from the store?")) return;
    try {
      await api.del(`/seller/products/${id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="two-col">
      <form className="panel form" onSubmit={submit}>
        <h3>{editingId ? "Edit product" : "Add product"}</h3>
        <Alert>{error}</Alert>
        <Alert kind="ok">{msg}</Alert>
        <label>Name<input required value={form.name} onChange={set("name")} /></label>
        <label>Description<textarea rows="3" value={form.description} onChange={set("description")} /></label>
        <div className="row">
          <label className="grow">Price<input type="number" step="0.01" min="0.01" required value={form.price} onChange={set("price")} /></label>
          <label className="grow">Stock<input type="number" min="0" required value={form.stock} onChange={set("stock")} /></label>
        </div>
        <label>Image URL (optional)<input value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://…" /></label>
        <label>Category
          <select value={form.categoryId} onChange={set("categoryId")}>
            <option value="">— none —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div className="row">
          <button className="btn btn-primary" disabled={!approved}>{editingId ? "Save changes" : "Add product"}</button>
          {editingId && <button type="button" className="btn btn-light" onClick={() => { setEditingId(null); setForm(EMPTY); }}>Cancel</button>}
        </div>
      </form>

      <div className="panel">
        <h3>My products ({products.length})</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>Price</th><th>Stock</th><th /></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}<div className="muted small">{p.categoryName}</div></td>
                <td>{money(p.price)}</td>
                <td className={p.stock < 5 ? "bad" : ""}>{p.stock}</td>
                <td className="actions">
                  <button className="btn btn-link" onClick={() => edit(p)}>Edit</button>
                  <button className="btn btn-link danger" onClick={() => remove(p.id)}>Remove</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan="4" className="muted">No products yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SellerOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => api.get("/seller/orders").then(setOrders).catch((e) => setError(e.message)), []);
  useEffect(() => {
    load();
    const t = setInterval(load, 10000); // pick up new orders automatically
    return () => clearInterval(t);
  }, [load]);

  const changeStatus = async (id, status) => {
    setError("");
    try {
      await api.put(`/seller/orders/${id}/status`, { status });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <Alert>{error}</Alert>
      {orders && orders.length === 0 && <p className="muted">No orders for your products yet.</p>}
      {orders?.map((o) => {
        const closed = o.status === "DELIVERED" || o.status === "CANCELLED";
        return (
          <div className="panel" key={o.id}>
            <div className="row">
              <strong>Order #{o.id} · {o.customerName}</strong>
              <Badge status={o.status} />
            </div>
            <div className="muted small">{fmtDate(o.createdAt)} · Ship to: {o.shippingAddress}</div>
            <OrderLines items={o.items} />
            <div className="row">
              <strong>Your items: {money(o.total)}</strong>
              {!closed && (
                <select value="" onChange={(e) => e.target.value && changeStatus(o.id, e.target.value)}>
                  <option value="">Update status…</option>
                  {NEXT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

function Report() {
  const [r, setR] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/seller/reports").then(setR).catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!r) return <p className="muted">Loading…</p>;
  const max = Math.max(1, ...r.topProducts.map((p) => Number(p.revenue)));

  return (
    <>
      <div className="stats">
        <Stat label="Revenue" value={money(r.totalRevenue)} />
        <Stat label="Orders" value={r.totalOrders} />
        <Stat label="Units sold" value={r.unitsSold} />
      </div>
      <div className="panel">
        <h3>Top products by revenue</h3>
        {r.topProducts.length === 0 && <p className="muted">No sales yet.</p>}
        {r.topProducts.map((p) => (
          <div key={p.productName} className="bar-row">
            <div className="bar-label">{p.productName} <span className="muted small">({p.units} sold)</span></div>
            <div className="bar"><div style={{ width: `${(Number(p.revenue) / max) * 100}%` }} /></div>
            <div className="bar-value">{money(p.revenue)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
