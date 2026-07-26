import type { ReactNode } from "react";
import { useAppearance } from "../../context/AppearanceContext";

interface Props {
  sidebar: ReactNode;
  children: ReactNode;
}

// Disposición de lectura de lecciones y cuestionarios: tres columnas de igual
// peso a los costados, así la columna de contenido queda centrada de verdad en
// la pantalla y no corrida hacia la izquierda por la barra de la derecha. La
// primera columna es un hueco vacío que existe solo para esa simetría.
//
// El título, el volver y el botón de editar van dentro de `children`, o sea
// dentro de la misma medida que el contenido: si estuvieran fuera de la
// rejilla ocuparían todo el ancho y se despegarían del texto.
export default function ReadingLayout({ sidebar, children }: Props) {
  const { width } = useAppearance();
  const columns =
    width === "wide"
      ? "lg:grid-cols-[0_minmax(0,1fr)_16rem]"
      : "lg:grid-cols-[16rem_minmax(0,48rem)_16rem]";

  // justify-center va solo en lg: abajo hay una única columna implícita y
  // centrarla la haría encogerse al ancho de su contenido.
  return (
    <div className={`grid w-full gap-6 lg:justify-center ${columns}`}>
      <div className="hidden lg:block" aria-hidden />
      <div className="min-w-0 space-y-6">{children}</div>
      <aside className="hidden lg:block">{sidebar}</aside>
    </div>
  );
}
