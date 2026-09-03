const VARIANTS = {
  primary:
    "bg-accent-500 text-white hover:bg-accent-600 shadow-sm shadow-accent-500/30",
  secondary:
    "bg-brand-900 text-white hover:bg-brand-800",
  outline:
    "border border-slate-300 text-slate-700 bg-white hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-danger-500 text-white hover:bg-danger-600",
};

const SIZES = {
  sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-lg gap-2",
  lg: "text-base px-6 py-3 rounded-xl gap-2",
};

export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  disabled = false,
  children,
  type,
  ...props
}) {
  return (
    <Component
      // A native <button> with no explicit type defaults to "submit", which
      // silently submits the nearest <form> — surprising for any button that
      // isn't the actual submit action. Buttons that ARE the submit action
      // already pass type="submit" explicitly; everything else gets a safe
      // default here instead of relying on every call site to remember it.
      type={Component === "button" ? type || "button" : type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      )}
      {children}
    </Component>
  );
}
