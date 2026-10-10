```jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context.jsx";
import { Alert } from "../components.jsx";

const home = (role) =>
  role === "SELLER" ? "/seller" : role === "ADMIN" ? "/admin" : "/";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const u = await login(form.email, form.password);
      navigate(home(u.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel narrow">
      <h2>Login</h2>
      <Alert>{error}</Alert>

      <form onSubmit={submit} className="form">
        <label>
          E-mail
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </label>

        <label>
          Password
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />
        </label>

        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Signing in…" : "Login"}
        </button>
      </form>

      <p className="muted small">
        No account? <Link to="/register">Sign up</Link>
      </p>
    </div>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const u = await register(form);
      navigate(home(u.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel narrow">
      <h2>Create your account</h2>
      <Alert>{error}</Alert>

      <form onSubmit={submit} className="form">
        <label>
          Full name
          <input
            required
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
        </label>

        <label>
          E-mail
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </label>

        <label>
          Password (min 6 characters)
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />
        </label>

        <label>
          I want to
          <select
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
          >
            <option value="CUSTOMER">
              Buy products (Customer)
            </option>
            <option value="SELLER">
              Sell products (Seller – needs admin approval)
            </option>
          </select>
        </label>

        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Creating…" : "Sign up"}
        </button>
      </form>

      <p className="muted small">
        Already registered? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
```
