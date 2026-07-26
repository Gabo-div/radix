import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type ThemePref = "auto" | "light" | "dark";
export type TextSize = "small" | "standard" | "large";
export type ReadingWidth = "standard" | "wide";
export type NavMode = "sidebar" | "top";

interface Appearance {
  theme: ThemePref;
  setTheme: (v: ThemePref) => void;
  textSize: TextSize;
  setTextSize: (v: TextSize) => void;
  width: ReadingWidth;
  setWidth: (v: ReadingWidth) => void;
  /** Dónde vive la navegación: barra lateral propia o botones en el encabezado. */
  navMode: NavMode;
  setNavMode: (v: NavMode) => void;
  /** Tema resuelto: con "auto" ya resuelto contra la preferencia del sistema. */
  isDark: boolean;
}

const KEYS = {
  theme: "radix_theme",
  textSize: "radix_text_size",
  width: "radix_reading_width",
  navMode: "radix_nav_mode",
} as const;

const AppearanceContext = createContext<Appearance | null>(null);

function read<T extends string>(key: string, valid: readonly T[], fallback: T): T {
  const stored = localStorage.getItem(key);
  return valid.includes(stored as T) ? (stored as T) : fallback;
}

const prefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

// Preferencias de lectura, al estilo del panel "Apariencia" de Wikipedia. Solo
// el tema toca el DOM (la clase .dark en <html>, que es lo que mira Tailwind);
// el tamaño de texto y la anchura los aplican los componentes que leen este
// contexto, así usan la escala de Tailwind en lugar de CSS a mano.
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>(() =>
    read(KEYS.theme, ["auto", "light", "dark"] as const, "auto")
  );
  const [textSize, setTextSizeState] = useState<TextSize>(() =>
    read(KEYS.textSize, ["small", "standard", "large"] as const, "standard")
  );
  const [width, setWidthState] = useState<ReadingWidth>(() =>
    read(KEYS.width, ["standard", "wide"] as const, "standard")
  );
  const [navMode, setNavModeState] = useState<NavMode>(() =>
    read(KEYS.navMode, ["sidebar", "top"] as const, "sidebar")
  );
  const [systemDark, setSystemDark] = useState(prefersDark);

  // Con "auto" hay que seguir al sistema mientras la pestaña está abierta, no
  // solo al cargar.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const isDark = theme === "dark" || (theme === "auto" && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const setTheme = useCallback((v: ThemePref) => {
    localStorage.setItem(KEYS.theme, v);
    setThemeState(v);
  }, []);
  const setTextSize = useCallback((v: TextSize) => {
    localStorage.setItem(KEYS.textSize, v);
    setTextSizeState(v);
  }, []);
  const setWidth = useCallback((v: ReadingWidth) => {
    localStorage.setItem(KEYS.width, v);
    setWidthState(v);
  }, []);
  const setNavMode = useCallback((v: NavMode) => {
    localStorage.setItem(KEYS.navMode, v);
    setNavModeState(v);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, textSize, setTextSize, width, setWidth, navMode, setNavMode, isDark }),
    [theme, setTheme, textSize, setTextSize, width, setWidth, navMode, setNavMode, isDark]
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): Appearance {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance requiere AppearanceProvider");
  return ctx;
}

/** Clases de la tipografía de lectura — definidas en index.css (.reading*). */
export function readingTextClass(size: TextSize): string {
  return `reading reading-${size}`;
}

