import { useCallback, useEffect, useState } from "react";
import { api, fmtDate, money } from "../api.js";
import { Alert, Badge, OrderLines, Stat, Tabs } from "../components.jsx";

export default function Admin() {
  const [tab, setTab] = useState("Dashboard");
  return (
    <>
      <h2>Admin panel</h2>
      <Tabs tabs={["Dashboard", "Users", "Orders"]} active={tab} onChange={setTab} />
      {tab === "Dashboard" && <Dashboard />}
      {tab === "Users" && <Users />}
      {tab === "Orders" && <AllOrders />}
    </>
  );
}

function Dashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const load = () => api.get("/admin/dashboard").then(setS).catch((e) => setError(e.message));
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);
  if (error) return <Alert>{error}</Alert>;
  if (!s) return <p className="muted">Loading…</p>;
  return (
    <div className="stats">
      <Stat label="Total users" value={s.totalUsers} />
      <Stat label="Customers" value={s.customers} />
      <Stat label="Sellers" value={s.sellers} />
      <Stat label="Sellers awaiting approval" value={s.pendingSellers} />
      <Stat label="Active products" value={s.activeProducts} />
      <Stat label="Orders" value={s.totalOrders} />
      <Stat label="Revenue (excl. cancelled)" value={money(s.revenue)} />
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const load = useCallback(() => api.get("/admin/users").then(setUsers).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const act = async (path) => {
    setError("");
    try {
      await api.put(path);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="panel">
      <Alert>{error}</Alert>
      <table className="table">
        <thead><tr><th>Name</th><th>E-mail</th><th>Role</th><th>Status</th><th /></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                {!u.enabled ? <span className="bad">Disabled</span>
                  : u.role === "SELLER" && !u.approved ? <span className="warn">Pending approval</span>
                  : <span className="ok">Active</span>}
              </td>
              <td className="actions">
                {u.role === "SELLER" && !u.approved && (
                  <button className="btn btn-primary btn-sm" onClick={() => act(`/admin/users/${u.id}/approve`)}>Approve</button>
                )}
                {u.role !== "ADMIN" && (
                  <button className="btn btn-light btn-sm" onClick={() => act(`/admin/users/${u.id}/toggle`)}>
                    {u.enabled ? "Disable" : "Enable"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AllOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/admin/orders").then(setOrders).catch((e) => setError(e.message));
  }, []);
  if (error) return <Alert>{error}</Alert>;
  if (!orders) return <p className="muted">Loading…</p>;
  return (
    <>
      {orders.length === 0 && <p className="muted">No orders yet.</p>}
      {orders.map((o) => (
        <div className="panel" key={o.id}>
          <div className="row">
            <strong>Order #{o.id} · {o.customerName}</strong>
            <Badge status={o.status} />
          </div>
          <div className="muted small">{fmtDate(o.createdAt)}</div>
          <OrderLines items={o.items} />
          <strong>Total {money(o.total)}</strong>
        </div>
      ))}
    </>
  );
}
