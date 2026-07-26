import { NavLink } from "react-router-dom";
import { LayoutDashboard, BookOpen, Library, Settings } from "lucide-react";
import type { ElementType } from "react";
import type { Role } from "../../types";
import { getSidebarItems } from "../../lib/rbac";

export const navIcons: Record<string, ElementType> = {
  LayoutDashboard,
  BookOpen,
  Library,
  Settings,
};

interface Props {
  role: Role;
  /** "sidebar": una fila por elemento; "top": botones compactos en el encabezado. */
  layout: "sidebar" | "top";
}

// Los mismos elementos de navegación en las dos disposiciones — la lista sigue
// saliendo de getSidebarItems, que es donde vive el filtro por rol.
export default function NavItems({ role, layout }: Props) {
  const items = getSidebarItems(role);
  const top = layout === "top";

  return (
    <>
      {items.map((item) => {
        const Icon = navIcons[item.icon] || BookOpen;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg transition-colors ${
                top ? "px-2.5 py-1 text-[13px]" : "px-3 py-2 text-sm"
              } ${
                isActive
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`
            }
          >
            <Icon size={top ? 15 : 16} strokeWidth={1.75} />
            {item.label}
          </NavLink>
        );
      })}
    </>
  );
}
