import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  Package,
  LogOut,
  Store,
  Sparkles,
  PlusCircle,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import useCategories from "../hooks/useCategories";
import { getCategoryIconComponent } from "./CategoryIcon";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { categories } = useCategories();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/products?search=${encodeURIComponent(query.trim())}` : "/products");
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      <div className="bg-brand-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
          <button
            className="rounded-lg p-1.5 hover:bg-white/10 lg:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="flex shrink-0 items-center gap-1.5 font-extrabold tracking-tight">
            <span className="rounded-lg bg-accent-500 px-2 py-1 text-lg leading-none text-white">K</span>
            <span className="hidden text-xl sm:inline">Kartly</span>
          </Link>

          <form
            onSubmit={submitSearch}
            className="hidden flex-1 items-center overflow-hidden rounded-lg bg-white sm:flex"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, brands and more"
              className="w-full px-4 py-2.5 text-sm text-slate-800 outline-none"
            />
            <button
              type="submit"
              className="flex h-full items-center bg-accent-500 px-4 py-2.5 text-white transition-colors hover:bg-accent-600"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              to="/assistant"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10 md:flex"
            >
              <Sparkles size={17} className="text-accent-300" />
              Ask AI
            </Link>

            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-white/10 sm:px-3"
              >
                <User size={18} />
                <span className="hidden sm:inline">
                  {user ? user.name.split(" ")[0] : "Login"}
                </span>
                <ChevronDown size={14} className="hidden sm:inline" />
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 text-slate-700 shadow-xl">
                  {!user ? (
                    <div className="p-3">
                      <Link
                        to="/login"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-lg bg-accent-500 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-accent-600"
                      >
                        Login
                      </Link>
                      <p className="mt-2 text-center text-xs text-slate-500">
                        New here?{" "}
                        <Link to="/register" onClick={() => setAccountOpen(false)} className="font-semibold text-brand-600">
                          Create account
                        </Link>
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                      <Link
                        to="/orders"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50"
                      >
                        <Package size={16} /> My Orders
                      </Link>
                      {(user.role === "seller" || user.role === "admin") && (
                        <>
                          <Link
                            to="/seller"
                            onClick={() => setAccountOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50"
                          >
                            <Store size={16} /> Seller Dashboard
                          </Link>
                          <Link
                            to="/seller/add"
                            onClick={() => setAccountOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50"
                          >
                            <PlusCircle size={16} /> Add Product
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setAccountOpen(false);
                          navigate("/");
                        }}
                        className="flex w-full items-center gap-2.5 border-t border-slate-100 px-4 py-2.5 text-left text-sm text-danger-600 hover:bg-slate-50"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <Link
              to="/cart"
              className="relative flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-white/10 sm:px-3"
            >
              <ShoppingCart size={19} />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-[11px] font-bold text-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <form onSubmit={submitSearch} className="flex items-center px-4 pb-3 sm:hidden">
          <div className="flex w-full items-center overflow-hidden rounded-lg bg-white">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="w-full px-3 py-2 text-sm text-slate-800 outline-none"
            />
            <button type="submit" className="flex items-center bg-accent-500 px-3 py-2 text-white">
              <Search size={16} />
            </button>
          </div>
        </form>
      </div>

      <nav className="hidden border-b border-slate-200 bg-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-6 py-2.5 text-sm font-medium text-slate-600 no-scrollbar">
          <Link to="/products" className="shrink-0 hover:text-brand-700">
            All Products
          </Link>
          {categories.slice(0, 12).map((cat) => {
            const IconComp = getCategoryIconComponent(cat);
            return (
              <Link
                key={cat}
                to={`/products?category=${encodeURIComponent(cat)}`}
                className="flex shrink-0 items-center gap-1.5 hover:text-brand-700"
              >
                <IconComp size={15} />
                {cat}
              </Link>
            );
          })}
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-white/10 bg-brand-900 px-4 py-3 text-white lg:hidden">
          <Link to="/products" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium">
            All Products
          </Link>
          {categories.slice(0, 10).map((cat) => (
            <Link
              key={cat}
              to={`/products?category=${encodeURIComponent(cat)}`}
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-medium text-white/90"
            >
              {cat}
            </Link>
          ))}
          <Link to="/assistant" onClick={() => setMenuOpen(false)} className="flex items-center gap-1.5 py-2 text-sm font-medium">
            <Sparkles size={16} className="text-accent-300" /> Ask AI
          </Link>
        </div>
      )}
    </header>
  );
}
