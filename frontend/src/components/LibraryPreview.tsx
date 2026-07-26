import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { LibraryItem } from "../types";
import { FileVideo, FileAudio, FileImage, FileText, File } from "lucide-react";

interface Props {
  item: LibraryItem;
  className?: string;
}

const typeIcon: Record<string, typeof FileVideo> = {
  video: FileVideo,
  audio: FileAudio,
  image: FileImage,
  pdf: FileText,
  text: FileText,
  document: File,
};

const typeColor: Record<string, string> = {
  video: "text-destructive",
  audio: "text-primary",
  image: "text-success",
  pdf: "text-destructive",
  text: "text-primary",
  document: "text-muted-foreground",
};

// Cuántos caracteres del archivo de texto se piden para la vista previa. Es un
// Range, así que de un archivo grande solo viaja este trozo.
const TEXT_PREVIEW_BYTES = 400;

// Miniatura de un elemento de la biblioteca: la imagen o el primer fotograma
// del video de verdad, no un icono genérico. Para audio, PDF y documentos sí
// queda el icono — un PDF exigiría montar un iframe por tarjeta y no vale ese
// costo en una cuadrícula.
export default function LibraryPreview({ item, className }: Props) {
  const url = api.getLibraryFileUrl(item.id);
  // filePath no se serializa al cliente, pero originalFilename solo lo tiene un
  // elemento subido de verdad: el endpoint antiguo (solo metadatos) lo deja
  // vacío y no hay archivo que mostrar.
  const hasFile = !!item.originalFilename;
  const [failed, setFailed] = useState(false);
  const [snippet, setSnippet] = useState("");

  useEffect(() => {
    if (item.type !== "text" || !hasFile) return;
    let alive = true;
    fetch(url, { headers: { Range: `bytes=0-${TEXT_PREVIEW_BYTES - 1}` } })
      .then((r) => r.text())
      .then((text) => alive && setSnippet(text))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [item.type, hasFile, url]);

  const box = `relative flex items-center justify-center overflow-hidden bg-secondary/40 ${className ?? ""}`;
  const Icon = typeIcon[item.type] || File;
  const fallback = (
    <div className={box}>
      <Icon size={36} className={typeColor[item.type] || "text-muted-foreground"} />
    </div>
  );

  if (!hasFile || failed) return fallback;

  switch (item.type) {
    case "image":
      return (
        <div className={box}>
          <img
            src={url}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        </div>
      );
    case "video":
      return (
        <div className={`${box} bg-black`}>
          {/* preload="metadata" + #t=0.1 hace que el navegador pida solo el
              principio del archivo y pinte ese fotograma; sin el fragmento
              temporal la mayoría muestra un rectángulo negro. */}
          <video
            src={`${url}#t=0.1`}
            preload="metadata"
            muted
            playsInline
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
            {item.duration || "video"}
          </span>
        </div>
      );
    case "text":
      return (
        <div className={`${box} items-start justify-start`}>
          <pre className="h-full w-full overflow-hidden whitespace-pre-wrap p-2 font-mono text-[10px] leading-snug text-muted-foreground">
            {snippet || "…"}
          </pre>
        </div>
      );
    default:
      return fallback;
  }
}
