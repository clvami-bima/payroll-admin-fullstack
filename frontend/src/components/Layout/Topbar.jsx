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
      <h1 className="text-lg font-semibold text-navy-900">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {/* User Profile */}
        <div className="flex items-center gap-2.5">
          
          {/* User Circle Icon */}
          <div className="w-10 h-10 flex items-center justify-center text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={28}
              height={28}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path
                stroke="none"
                d="M0 0h24v24H0z"
                fill="none"
              />
              <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
              <path d="M9 10a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
              <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
            </svg>
          </div>

          {/* Role */}
          <div className="text-right">
            <p className="text-xs text-slate-400 capitalize">
              {user?.role}
            </p>
          </div>
        </div>

        {/* Logout */}
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