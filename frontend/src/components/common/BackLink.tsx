import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface Props {
  /** Ruta a usar solo cuando no hay historial propio al que volver. */
  fallback: string;
  label?: string;
  className?: string;
}

const baseClass =
  "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors";

// Botón de volver que realmente vuelve: si llegaste a un archivo desde una
// lección, te devuelve a la lección y no al índice de la biblioteca.
//
// `fallback` cubre la entrada directa (enlace compartido, pestaña nueva), donde
// no hay ninguna entrada previa de la aplicación que sacar del historial:
// react-router numera sus entradas en history.state.idx, y 0 significa que esta
// es la primera. Se mira el índice y no location.key porque el key vuelve a
// "default" al recargar, y ahí sí hay historial real al que volver.
export default function BackLink({ fallback, label = "Volver atrás", className }: Props) {
  const navigate = useNavigate();
  const cls = className ? `${baseClass} ${className}` : baseClass;
  const content = (
    <>
      <ArrowLeft size={16} /> {label}
    </>
  );

  const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
  if (idx <= 0) {
    return <Link to={fallback} className={cls}>{content}</Link>;
  }
  return (
    <button type="button" onClick={() => navigate(-1)} className={cls}>
      {content}
    </button>
  );
}
