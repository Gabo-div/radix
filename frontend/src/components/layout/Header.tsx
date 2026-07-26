import { LogOut, UserCheck, Sun, Moon, SunMoon, PanelLeft, PanelTop } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAppearance } from "../../context/AppearanceContext";
import { roleLabels, roleColors } from "../../lib/rbac";
import NavItems from "./NavItems";

// El panel de apariencia de la lección es el lugar completo para esto, pero el
// tema tiene que poder cambiarse desde cualquier pantalla, así que acá va un
// ciclo corto entre los tres estados.
const THEME_CYCLE = {
  auto: { next: "light", Icon: SunMoon, label: "Tema: automático" },
  light: { next: "dark", Icon: Sun, label: "Tema: claro" },
  dark: { next: "auto", Icon: Moon, label: "Tema: oscuro" },
} as const;

export default function Header() {
  const { currentUser, logout } = useAuth();
  const { theme, setTheme, navMode, setNavMode } = useAppearance();

  if (!currentUser) return null;

  const { next, Icon, label } = THEME_CYCLE[theme];
  const navOnTop = navMode === "top";
  const navToggle = navOnTop
    ? { icon: PanelLeft, label: "Mover la navegación a la barra lateral", to: "sidebar" as const }
    : { icon: PanelTop, label: "Ocultar la barra lateral y navegar desde arriba", to: "top" as const };
  const NavToggleIcon = navToggle.icon;

  return (
    <header className="h-14 bg-background border-b border-border/60 flex items-center justify-between gap-6 px-6 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <h1 className="text-[15px] font-semibold text-foreground tracking-tight">RADIX</h1>
        {/* Con la navegación arriba el espacio del encabezado se va en los
            enlaces, así que el subtítulo y el estado del nodo se ceden. */}
        {!navOnTop && (
          <>
            <span className="text-border">/</span>
            <span className="text-[13px] text-muted-foreground">Educación Offline</span>
            <span className="flex items-center gap-1.5 ml-2 text-[11px] text-success bg-success/10 px-2 py-0.5 rounded-full">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              Edge activo
            </span>
          </>
        )}
        {navOnTop && (
          <nav className="flex items-center gap-1 ml-3 overflow-x-auto">
            <NavItems role={currentUser.role} layout="top" />
          </nav>
        )}
      </div>
      <div className="flex items-center gap-5 shrink-0">
        <div className="flex items-center gap-2">
          <UserCheck size={15} className={roleColors[currentUser.role]} />
          <span className="text-sm text-foreground">{currentUser.name}</span>
          <span className="text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">
            {roleLabels[currentUser.role]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNavMode(navToggle.to)}
            title={navToggle.label}
            aria-label={navToggle.label}
            className="hidden lg:block text-muted-foreground hover:text-foreground transition-colors"
          >
            <NavToggleIcon size={16} />
          </button>
          <button
            onClick={() => setTheme(next)}
            title={label}
            aria-label={label}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon size={16} />
          </button>
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
