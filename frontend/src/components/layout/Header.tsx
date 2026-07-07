import { LogOut, UserCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { roleLabels, roleColors } from "../../lib/rbac";

export default function Header() {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  return (
    <header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-white tracking-tight">
          RADIX <span className="text-emerald-400">Educación Offline</span>
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <UserCheck size={16} className={roleColors[currentUser.role]} />
          <span className={`text-sm font-medium ${roleColors[currentUser.role]}`}>
            {currentUser.name}
          </span>
          <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">
            {roleLabels[currentUser.role]}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={14} />
          Salir
        </button>
      </div>
    </header>
  );
}
