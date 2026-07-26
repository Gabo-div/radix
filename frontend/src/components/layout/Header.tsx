import { LogOut, UserCheck, Sun, Moon, SunMoon } from "lucide-react";
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
  const { theme, setTheme } = useAppearance();

  if (!currentUser) return null;

  const { next, Icon, label } = THEME_CYCLE[theme];

  return (
    <header className="h-14 bg-background border-b border-border/60 flex items-center justify-between gap-6 px-6 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <h1 className="text-[15px] font-semibold text-foreground tracking-tight">RADIX</h1>
        {/* El subtítulo y el estado del nodo ceden el paso a la navegación en
            cuanto la pantalla se angosta: los enlaces importan más. */}
        <span className="hidden xl:inline text-border">/</span>
        <span className="hidden xl:inline text-[13px] text-muted-foreground">Educación Offline</span>
        <span className="hidden xl:flex items-center gap-1.5 text-[11px] text-success bg-success/10 px-2 py-0.5 rounded-full">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          Edge activo
        </span>
        <nav className="flex items-center gap-1 ml-3 overflow-x-auto">
          <NavItems role={currentUser.role} />
        </nav>
      </div>
      <div className="flex items-center gap-5 shrink-0">
        <div className="flex items-center gap-2">
          <UserCheck size={15} className={roleColors[currentUser.role]} />
          <span className="text-sm text-foreground">{currentUser.name}</span>
          <span className="text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">
            {roleLabels[currentUser.role]}
          </span>
        </div>
        <button
          onClick={() => setTheme(next)}
          title={label}
          aria-label={label}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon size={16} />
        </button>
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
