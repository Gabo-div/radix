import { useAuth } from "../../context/AuthContext";
import { useAppearance } from "../../context/AppearanceContext";
import NavItems from "./NavItems";

export default function Sidebar() {
  const { currentUser } = useAuth();
  const { navMode } = useAppearance();

  // Con la navegación arriba no hay barra lateral: los mismos enlaces los rinde
  // Header (ver el panel de apariencia o el botón del encabezado).
  if (!currentUser || navMode === "top") return null;

  return (
    <aside className="w-56 bg-background border-r border-border/60 flex flex-col shrink-0 overflow-y-auto">
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <NavItems role={currentUser.role} layout="sidebar" />
      </nav>
      <div className="px-4 py-3 border-t border-border/60">
        <p className="text-xs text-muted-foreground">RADIX v1.0.0</p>
        <p className="text-xs text-muted-foreground/60">Edge Server Offline</p>
      </div>
    </aside>
  );
}
