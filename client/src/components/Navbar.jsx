import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 30px",
        borderBottom: "1px solid #ddd",
      }}
    >
      <Link
        to="/"
        style={{
          textDecoration: "none",
          fontWeight: "bold",
          fontSize: "22px",
        }}
      >
        Marketplace
      </Link>

      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "center",
        }}
      >
        <Link to="/">Home</Link>

        {!user && (
          <>
            <Link to="/login">Login</Link>

            <Link to="/register">
              Register
            </Link>
          </>
        )}

        {user && (
          <>
            <Link to="/orders">
              Orders
            </Link>

            {user.role === "seller" && (
              <Link to="/seller">
                Dashboard
              </Link>
            )}

            <button
              onClick={logout}
              style={{
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}