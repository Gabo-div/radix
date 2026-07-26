import type { ReactNode } from "react";
import { useAppearance } from "../../context/AppearanceContext";
import AppearancePanel from "../common/AppearancePanel";

interface Props {
  /** Volver, título y acciones: ocupan solo la medida del contenido. */
  header: ReactNode;
  /** Índice y enlaces de la lección — riel izquierdo. */
  sidebar: ReactNode;
  children: ReactNode;
}

// Disposición de lectura de lecciones y cuestionarios: tres columnas con los
// rieles del mismo ancho, así la columna de contenido queda centrada de verdad
// en la pantalla.
//
//     [ índice y enlaces ] [ contenido ] [ apariencia ]
//
// Son dos filas de la misma rejilla: la cabecera va sola en la primera y ocupa
// únicamente la columna del medio. Eso es lo que hace que los rieles arranquen
// a la altura del contenido y no a la del botón de volver.
export default function ReadingLayout({ header, sidebar, children }: Props) {
  const { width } = useAppearance();
  const columns =
    width === "wide"
      ? "lg:grid-cols-[16rem_minmax(0,1fr)_16rem]"
      : "lg:grid-cols-[16rem_minmax(0,48rem)_16rem]";

  // justify-center va solo en lg: abajo hay una única columna implícita y
  // centrarla la haría encogerse al ancho de su contenido.
  return (
    <div className={`grid w-full gap-x-6 gap-y-4 lg:justify-center ${columns}`}>
      <div className="hidden lg:block" aria-hidden />
      <div className="min-w-0 space-y-4">{header}</div>
      <div className="hidden lg:block" aria-hidden />

      {/* self-start: sin él la rejilla estira los rieles a la altura del
          contenido y el sticky de adentro no tiene margen para pegarse. */}
      <div className="hidden lg:block self-start">{sidebar}</div>
      <div className="min-w-0 space-y-6">{children}</div>
      <aside className="hidden lg:block self-start sticky top-0">
        <AppearancePanel />
      </aside>
    </div>
  );
}
