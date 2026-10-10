import { useCallback, useEffect, useState } from "react";
import { api, fmtDate, money } from "../api.js";
import { Alert, OrderLines, Tracker } from "../components.jsx";

const POLL_MS = 8000;

export default function MyOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(null);

  const load = useCallback(() => {
    api
      .get("/orders")
      .then((d) => {
        setOrders(d);
        setUpdated(new Date());
        setError("");
      })
      .catch((e) => setError(e.message));
  }, []);

  // live order tracking: refresh every few seconds so status changes made by the seller show up
  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await api.put(`/orders/${id}/cancel`);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <div className="row">
        <h2>My orders</h2>
        <span className="live"><i /> Live · updated {updated ? updated.toLocaleTimeString() : "…"}</span>
      </div>
      <Alert>{error}</Alert>
      {orders && orders.length === 0 && <p className="muted">You have not placed any orders yet.</p>}
      {orders?.map((o) => (
        <div className="panel" key={o.id}>
          <div className="row">
            <strong>Order #{o.id}</strong>
            <span className="muted small">{fmtDate(o.createdAt)}</span>
          </div>
          <Tracker status={o.status} />
          <OrderLines items={o.items} />
          <div className="row">
            <span className="muted small">Ship to: {o.shippingAddress}</span>
            <strong>Total {money(o.total)}</strong>
          </div>
          {o.status === "PLACED" && (
            <button className="btn btn-danger" onClick={() => cancel(o.id)}>Cancel order</button>
          )}
        </div>
      ))}
    </>
  );
}
