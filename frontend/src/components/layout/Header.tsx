import { LogOut, UserCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { roleLabels, roleColors } from "../../lib/rbac";

export default function Header() {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  return (
    <header className="h-14 bg-background border-b border-border/60 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2.5">
        <h1 className="text-[15px] font-semibold text-foreground tracking-tight">RADIX</h1>
        <span className="text-border">/</span>
        <span className="text-[13px] text-muted-foreground">Educación Offline</span>
        <span className="flex items-center gap-1.5 ml-2 text-[11px] text-success bg-success/10 px-2 py-0.5 rounded-full">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          Edge activo
        </span>
      </div>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <UserCheck size={15} className={roleColors[currentUser.role]} />
          <span className="text-sm text-foreground">{currentUser.name}</span>
          <span className="text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">
            {roleLabels[currentUser.role]}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut size={14} />
          Salir
        </button>
      </div>
    </header>
  );
}
