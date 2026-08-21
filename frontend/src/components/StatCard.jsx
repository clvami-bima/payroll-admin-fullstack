export default function StatCard({ label, value, sublabel, accent = 'accent' }) {
  const accentClass = {
    accent: 'text-accent',
    success: 'text-success',
    danger: 'text-danger',
  }[accent];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-2xl font-bold text-navy-900 ${accentClass}`}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-slate-400">{sublabel}</p>}
    </div>
  );
}
