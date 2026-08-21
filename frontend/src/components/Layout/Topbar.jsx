import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-navy-900">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-navy-900">{user?.name}</p>
          <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-slate-500 hover:text-danger px-3 py-1.5 rounded-lg border border-slate-200 hover:border-danger transition-colors"
        >
          Keluar
        </button>
      </div>
    </header>
  );
}
