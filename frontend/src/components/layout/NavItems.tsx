import { NavLink } from "react-router-dom";
import { LayoutDashboard, BookOpen, Library, Settings } from "lucide-react";
import type { ElementType } from "react";
import type { Role } from "../../types";
import { getNavItems } from "../../lib/rbac";

export const navIcons: Record<string, ElementType> = {
  LayoutDashboard,
  BookOpen,
  Library,
  Settings,
};

interface Props {
  role: Role;
}

// Navegación de la aplicación, en el encabezado. La lista sale de getNavItems,
// que es donde vive el filtro por rol.
export default function NavItems({ role }: Props) {
  const items = getNavItems(role);

  return (
    <>
      {items.map((item) => {
        const Icon = navIcons[item.icon] || BookOpen;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors ${
                isActive
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`
            }
          >
            <Icon size={15} strokeWidth={1.75} />
            {item.label}
          </NavLink>
        );
      })}
    </>
  );
}
