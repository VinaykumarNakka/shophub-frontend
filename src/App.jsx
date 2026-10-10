import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth, useCart } from "./context.jsx";
import Products from "./pages/Products.jsx";
import { Login, Register } from "./pages/Auth.jsx";
import Cart from "./pages/Cart.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import Seller from "./pages/Seller.jsx";
import Admin from "./pages/Admin.jsx";

function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const isCustomerOrGuest = !user || user.role === "CUSTOMER";

  return (
    <header className="navbar">
      <NavLink to="/" className="brand">
        🛍️ ShopHub
      </NavLink>
      <nav>
        <NavLink to="/">Shop</NavLink>
        {isCustomerOrGuest && <NavLink to="/cart">Cart{count > 0 && <span className="pill">{count}</span>}</NavLink>}
        {user?.role === "CUSTOMER" && <NavLink to="/orders">My Orders</NavLink>}
        {user?.role === "SELLER" && <NavLink to="/seller">Seller Panel</NavLink>}
        {user?.role === "ADMIN" && <NavLink to="/admin">Admin Panel</NavLink>}
      </nav>
      <div className="auth-links">
        {user ? (
          <>
            <span className="hello">
              {user.name} <small>({user.role})</small>
            </span>
            <button
              className="btn btn-light"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register" className="btn btn-light">
              Sign up
            </NavLink>
          </>
        )}
      </div>
    </header>
  );
}

function Protected({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Products />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Protected role="CUSTOMER"><MyOrders /></Protected>} />
          <Route path="/seller" element={<Protected role="SELLER"><Seller /></Protected>} />
          <Route path="/admin" element={<Protected role="ADMIN"><Admin /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">ShopHub · Spring Boot + React + MySQL</footer>
    </>
  );
}
