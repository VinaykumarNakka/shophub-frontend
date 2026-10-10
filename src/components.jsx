import { money } from "./api.js";

export const STEPS = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

export function Badge({ status }) {
  return <span className={`badge badge-${String(status).toLowerCase()}`}>{status}</span>;
}

/** Order-tracking progress bar: PLACED -> CONFIRMED -> SHIPPED -> DELIVERED */
export function Tracker({ status }) {
  if (status === "CANCELLED") return <Badge status="CANCELLED" />;
  const current = STEPS.indexOf(status);
  return (
    <div className="tracker">
      {STEPS.map((s, i) => (
        <div key={s} className={`step ${i <= current ? "done" : ""}`}>
          <div className="dot">{i <= current ? "✓" : i + 1}</div>
          <div className="label">{s}</div>
        </div>
      ))}
    </div>
  );
}

export function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t} className={t === active ? "tab active" : "tab"} onClick={() => onChange(t)}>
          {t}
        </button>
      ))}
    </div>
  );
}

export function OrderLines({ items }) {
  return (
    <ul className="lines">
      {items.map((i, idx) => (
        <li key={idx}>
          <span>
            {i.productName} × {i.quantity}
          </span>
          <span>{money(i.price * i.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}

export function Alert({ kind = "error", children }) {
  if (!children) return null;
  return <div className={`alert alert-${kind}`}>{children}</div>;
}

export const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='#e5e7eb'/><text x='50%' y='50%' fill='#9ca3af' font-family='sans-serif' font-size='24' text-anchor='middle'>No image</text></svg>`
  );
