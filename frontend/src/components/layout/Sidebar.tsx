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
    <aside className="w-56 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0 overflow-y-auto">
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const Icon = iconMap[item.icon] || BookOpen;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-slate-700">
        <p className="text-xs text-slate-500">RADIX v1.0.0</p>
        <p className="text-xs text-slate-600">Edge Server Offline</p>
      </div>
    </aside>
  );
}
