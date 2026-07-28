import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getToken } from "@/lib/api";
import type { LibraryItem } from "../types";
import { Gamepad2, Maximize, Minimize, X } from "lucide-react";

interface Props {
  item: LibraryItem;
  onClose: () => void;
}

// Reproductor de videojuegos HTML. El juego NUNCA se sirve por su URL directa:
// se pide con fetch (cabecera Authorization, no ?token= en la URL) y se carga
// como blob dentro de un <iframe sandbox="allow-scripts">. Sin
// allow-same-origin el navegador le da un origen opaco: no puede leer el
// localStorage de la app (donde vive el token de sesión) ni tocar el DOM
// padre. Consecuencia: el juego debe ser un único .html autocontenido, porque
// las URLs relativas no resuelven desde un blob.
export default function GamePlayer({ item, onClose }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let alive = true;
    let url: string | null = null;
    fetch(`/api/v1/library/${item.id}/file`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        if (!alive) return;
        url = URL.createObjectURL(new Blob([blob], { type: "text/html" }));
        setBlobUrl(url);
      })
      .catch(() => {
        toast.error("No se pudo cargar el juego");
        onClose();
      });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const fs = fullscreen
    ? "!inset-0 !h-screen !w-screen !max-w-none !max-h-none !translate-x-0 !translate-y-0 !rounded-none !p-0"
    : "";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={`max-w-5xl h-[80vh] flex flex-col gap-3 ${fs}`} showClose={!fullscreen}>
        <DialogTitle className={`flex items-center gap-2 text-base ${fullscreen ? "absolute top-4 left-4 z-10 pr-4" : "pr-6"}`}>
          <Gamepad2 size={18} className="text-primary shrink-0" />
          <span className={`truncate ${fullscreen ? "text-white drop-shadow-md" : ""}`}>{item.title}</span>
        </DialogTitle>
        {!fullscreen && (
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="absolute top-4 right-10 text-muted-foreground hover:text-foreground transition-colors"
            title="Pantalla completa"
          >
            <Maximize size={16} />
          </button>
        )}
        {blobUrl ? (
          <iframe
            src={blobUrl}
            sandbox="allow-scripts"
            title={item.title}
            className={`flex-1 min-h-0 w-full bg-black ${fullscreen ? "rounded-none border-0" : "rounded-lg border border-border"}`}
          />
        ) : (
          <div className="flex-1 min-h-0 flex items-center justify-center text-sm text-muted-foreground">
            Cargando juego...
          </div>
        )}
        {fullscreen && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="text-white/70 hover:text-white transition-colors drop-shadow-md"
              title="Salir de pantalla completa"
            >
              <Minimize size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors drop-shadow-md"
              title="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
