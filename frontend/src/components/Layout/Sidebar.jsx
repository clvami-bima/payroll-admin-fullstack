import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '\u25A6' },
  { to: '/employees', label: 'Karyawan', icon: '\u25A4' },
  { to: '/payroll', label: 'Proses Payroll', icon: '\u25C9' },
  { to: '/reports', label: 'Laporan', icon: '\u25A9' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-navy-950 text-slate-300 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-navy-800">
        <p className="text-white font-bold text-lg leading-tight">Payroll Admin</p>
        <p className="text-xs text-slate-400 mt-0.5">Manajemen Gaji Karyawan</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-accent text-white' : 'hover:bg-navy-800 hover:text-white'
              }`
            }
          >
            <span aria-hidden="true">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-navy-800 text-xs text-slate-500">
        v1.0 &middot; Data gaji bersifat rahasia
      </div>
    </aside>
  );
}
