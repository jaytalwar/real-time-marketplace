import { formatPrice } from "../../utils/format";

export default function PriceTag({ price, size = "md", className = "" }) {
  const sizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <span className={`font-bold text-slate-900 ${sizes[size]} ${className}`}>
      {formatPrice(price)}
    </span>
  );
}
