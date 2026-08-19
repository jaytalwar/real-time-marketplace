import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, Sparkles, Radio, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = await loginUser(form);
      login(data.token, data);
      toast.success("Login successful");
      navigate(location.state?.from || "/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center px-4 py-10 sm:px-6">
      <div className="grid w-full grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 shadow-card lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 p-10 text-white lg:flex">
          <div>
            <span className="rounded-lg bg-accent-500 px-2 py-1 text-lg font-extrabold">K</span>
            <h2 className="mt-6 text-2xl font-bold leading-snug">
              Welcome back to Kartly
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Track your orders live and get instant help from our AI shopping assistant.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-2.5">
              <Radio size={15} className="text-accent-300" /> Real-time order tracking
            </li>
            <li className="flex items-center gap-2.5">
              <Sparkles size={15} className="text-accent-300" /> AI-powered product search
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck size={15} className="text-accent-300" /> Secure, JWT-based sessions
            </li>
          </ul>
        </div>

        <div className="bg-white p-8 sm:p-10">
          <h1 className="text-xl font-bold text-slate-900">Login to your account</h1>
          <p className="mt-1 text-sm text-slate-500">Enter your details to continue</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              Login
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New to Kartly?{" "}
            <Link to="/register" className="font-semibold text-brand-600 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
