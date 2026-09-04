export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
      {Icon && (
        <div className="rounded-full bg-slate-100 p-4 text-slate-400">
          <Icon size={32} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action}
    </div>
  );
}
