import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getSidebarItems } from "../../lib/rbac";
import {
  LayoutDashboard,
  BookOpen,
  Library,
  Settings,
  Monitor,
  ScrollText,
} from "lucide-react";
import type { ElementType } from "react";

const iconMap: Record<string, ElementType> = {
  LayoutDashboard,
  BookOpen,
  Library,
  Settings,
  Monitor,
  ScrollText,
};

export default function Sidebar() {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const items = getSidebarItems(currentUser.role);

  return (
    <aside className="w-56 bg-background border-r border-border/60 flex flex-col shrink-0 overflow-y-auto">
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((item) => {
          const Icon = iconMap[item.icon] || BookOpen;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`
              }
            >
              <Icon size={16} strokeWidth={1.75} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-border/60">
        <p className="text-xs text-muted-foreground">RADIX v1.0.0</p>
        <p className="text-xs text-muted-foreground/60">Edge Server Offline</p>
      </div>
    </aside>
  );
}
