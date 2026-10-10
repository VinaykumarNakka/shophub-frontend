import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, money } from "../api.js";
import { useAuth, useCart } from "../context.jsx";
import { Alert, PLACEHOLDER } from "../components.jsx";

export default function Cart() {
  const { items, setQty, remove, clear, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user && user.role !== "CUSTOMER") {
    return <p className="muted">Only customers can place orders.</p>;
  }

  if (items.length === 0) {
    return (
      <div className="panel">
        <h2>Your cart is empty</h2>
        <Link to="/" className="btn btn-primary">Continue shopping</Link>
      </div>
    );
  }

  const placeOrder = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post("/orders", {
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        shippingAddress: address,
      });
      clear();
      navigate("/orders");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="two-col">
      <div className="panel">
        <h2>Shopping cart</h2>
        {items.map((i) => (
          <div className="cart-row" key={i.id}>
            <img src={i.imageUrl || PLACEHOLDER} alt="" onError={(e) => (e.currentTarget.src = PLACEHOLDER)} />
            <div className="grow">
              <strong>{i.name}</strong>
              <div className="muted small">{money(i.price)} each</div>
            </div>
            <input className="qty" type="number" min="1" max={i.stock} value={i.quantity} onChange={(e) => setQty(i.id, e.target.value)} />
            <div className="line-total">{money(i.price * i.quantity)}</div>
            <button className="btn btn-link" onClick={() => remove(i.id)}>Remove</button>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>Checkout</h2>
        <div className="row big"><span>Total</span><strong>{money(total)}</strong></div>
        {!user ? (
          <p><Link to="/login">Login</Link> or <Link to="/register">sign up</Link> to place your order.</p>
        ) : (
          <>
            <Alert>{error}</Alert>
            <label className="form">
              Shipping address
              <textarea rows="3" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no, street, city, PIN" />
            </label>
            <button className="btn btn-primary block" disabled={busy || !address.trim()} onClick={placeOrder}>
              {busy ? "Placing order…" : "Place order"}
            </button>
            <p className="muted small">Payment is simulated (cash on delivery) in this project.</p>
          </>
        )}
      </div>
    </div>
  );
}
