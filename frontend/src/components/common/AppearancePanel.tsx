import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useAppearance } from "../../context/AppearanceContext";

interface Option<T> {
  value: T;
  label: string;
}

// Grupo de radios nativos: es el control correcto para "elegí uno" y ya viene
// con teclado y lector de pantalla resueltos.
function RadioGroup<T extends string>({
  title,
  name,
  options,
  value,
  onChange,
}: {
  title: string;
  name: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="border-t border-border pt-2">
      <legend className="text-[11px] font-medium text-muted-foreground pr-2">{title}</legend>
      <div className="space-y-1.5 mt-1">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="size-3.5"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const TEXT_OPTIONS = [
  { value: "small", label: "Pequeño" },
  { value: "standard", label: "Estándar" },
  { value: "large", label: "Grande" },
] as const;

const WIDTH_OPTIONS = [
  { value: "standard", label: "Estándar" },
  { value: "wide", label: "Ancho" },
] as const;

const NAV_OPTIONS = [
  { value: "sidebar", label: "Barra lateral" },
  { value: "top", label: "Arriba" },
] as const;

const THEME_OPTIONS = [
  { value: "auto", label: "Automático" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
] as const;

// Panel de apariencia de la lección: tamaño de texto, anchura de lectura, tema
// y dónde va la navegación. Las preferencias se guardan y valen para toda la
// aplicación, no solo para la lección abierta.
export default function AppearancePanel() {
  const { theme, setTheme, textSize, setTextSize, width, setWidth, navMode, setNavMode } = useAppearance();
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <SlidersHorizontal size={14} /> Apariencia
        </h3>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {open ? "ocultar" : "mostrar"}
        </button>
      </div>

      {open && (
        <div className="space-y-3">
          <RadioGroup title="Texto" name="apariencia-texto" options={TEXT_OPTIONS} value={textSize} onChange={setTextSize} />
          <RadioGroup title="Anchura" name="apariencia-anchura" options={WIDTH_OPTIONS} value={width} onChange={setWidth} />
          <RadioGroup title="Color" name="apariencia-color" options={THEME_OPTIONS} value={theme} onChange={setTheme} />
          <RadioGroup title="Navegación" name="apariencia-nav" options={NAV_OPTIONS} value={navMode} onChange={setNavMode} />
        </div>
      )}
    </div>
  );
}
