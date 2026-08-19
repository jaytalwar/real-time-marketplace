import { Link } from "react-router-dom";
import { Sparkles, Radio, ShieldCheck, Truck } from "lucide-react";

const COLUMNS = [
  {
    title: "Kartly",
    links: [
      { label: "About", to: "/" },
      { label: "Careers", to: "/" },
      { label: "Blog", to: "/" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Track your order", to: "/orders" },
      { label: "Returns", to: "/" },
      { label: "Contact us", to: "/" },
    ],
  },
  {
    title: "Sell on Kartly",
    links: [
      { label: "Become a seller", to: "/register" },
      { label: "Seller dashboard", to: "/seller" },
      { label: "Add a product", to: "/seller/add" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-brand-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-1 lg:col-span-2 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold text-white">{col.title}</h4>
              <ul className="space-y-2 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <h4 className="mb-3 text-sm font-semibold text-white">Why shop with us</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2.5">
              <Radio size={16} className="text-accent-400" /> Live order tracking, powered by websockets
            </li>
            <li className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-accent-400" /> AI shopping assistant to help you find products
            </li>
            <li className="flex items-center gap-2.5">
              <Truck size={16} className="text-accent-400" /> Fast, transparent order status updates
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-accent-400" /> Secure JWT-based authentication
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Kartly. Built as a real-time marketplace demo.
      </div>
    </footer>
  );
}
