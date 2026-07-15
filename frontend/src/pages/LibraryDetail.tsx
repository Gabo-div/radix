import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getToken } from "@/lib/api";
import { useAuth } from "../context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLibraryItem, useLibraryItemUsage, useUpdateLibraryItem } from "@/hooks/useLibrary";
import {
  ArrowLeft, Download, FileVideo, FileAudio, FileImage, FileText, Edit, CheckCircle, BookOpen,
} from "lucide-react";

const typeIcon: Record<string, typeof FileVideo> = {
  video: FileVideo, audio: FileAudio, image: FileImage,
  pdf: FileText, text: FileText, document: FileText,
};

export default function LibraryDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { data: item } = useLibraryItem(id);
  const { data: usage = [] } = useLibraryItemUsage(id);
  const updateItem = useUpdateLibraryItem(id!);

  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const fileUrl = item ? api.getLibraryFileUrl(item.id) : "";

  const { data: textContent } = useQuery({
    queryKey: ["library", id, "text-content", fileUrl],
    queryFn: () => fetch(fileUrl, { headers: { Authorization: `Bearer ${getToken()}` } }).then((r) => r.text()),
    enabled: item?.type === "text" && !!fileUrl,
  });

  if (!item) return <p className="text-muted-foreground">Cargando...</p>;

  const isAdmin = currentUser?.role === "admin";
  const Icon = typeIcon[item.type] || FileText;

  const handleEdit = () => {
    if (!editTitle) return;
    updateItem.mutate(
      { title: editTitle, category: editCategory },
      {
        onSuccess: () => {
          setShowEdit(false);
          toast.success("Actualizado exitosamente", { icon: <CheckCircle className="size-4" /> });
        },
        onError: (err) => toast.error((err as Error).message),
      }
    );
  };

  return (
    <div className="space-y-6">
      <Link to="/library" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Volver a biblioteca
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon size={36} className="text-primary" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">{item.title}</h1>
            <p className="text-sm text-muted-foreground">{item.originalFilename}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="secondary" onClick={() => { setEditTitle(item.title); setEditCategory(item.category); setShowEdit(!showEdit); }}>
              <Edit size={14} />
              {showEdit ? "Cancelar" : "Editar"}
            </Button>
          )}
          <a href={fileUrl} download
            className="flex items-center gap-1.5 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors">
            <Download size={16} /> Descargar
          </a>
        </div>
      </div>

      {showEdit && (
        <Card>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Editar Metadatos</h2>
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Título"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Categoría"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
            />
            <Button onClick={handleEdit} disabled={updateItem.isPending}>
              {updateItem.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </Card>
      )}

      {item.type === "video" && (
        <div className="bg-black rounded-xl overflow-hidden">
          <video controls className="w-full max-h-[500px]" src={fileUrl}>
            Tu navegador no soporta video.
          </video>
        </div>
      )}

      {item.type === "audio" && (
        <div className="bg-card rounded-xl p-6 border border-border">
          <audio controls className="w-full" src={fileUrl}>
            Tu navegador no soporta audio.
          </audio>
        </div>
      )}

      {item.type === "image" && (
        <div className="bg-card rounded-xl p-4 border border-border flex items-center justify-center">
          <img src={fileUrl} alt={item.title} className="max-w-full max-h-[500px] rounded-lg object-contain" />
        </div>
      )}

      {item.type === "pdf" && (
        <div className="bg-card rounded-xl overflow-hidden border border-border" style={{ height: "600px" }}>
          <iframe src={fileUrl} className="w-full h-full" title={item.title} />
        </div>
      )}

      {item.type === "text" && (
        <Card>
          <pre className="text-sm text-foreground/90 font-mono whitespace-pre-wrap overflow-x-auto max-h-[500px]">
            {textContent || "Cargando contenido..."}
          </pre>
        </Card>
      )}

      <Card>
        <h2 className="text-sm font-medium text-muted-foreground mb-4">Detalles del Archivo</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <span className="text-muted-foreground">Tipo</span>
          <span className="text-foreground font-medium capitalize">{item.type}</span>

          <span className="text-muted-foreground">Tamaño</span>
          <span className="text-foreground">{item.sizeKB >= 1024 ? `${(item.sizeKB / 1024).toFixed(1)} MB` : `${item.sizeKB} KB`}</span>

          <span className="text-muted-foreground">Categoría</span>
          <span className="text-foreground">{item.category || "—"}</span>

          <span className="text-muted-foreground">Formato</span>
          <span className="text-foreground">{item.mimeType || item.originalFilename?.split(".").pop() || "—"}</span>

          <span className="text-muted-foreground">Subido por</span>
          <span className="text-foreground">{item.uploadedBy || "—"}</span>

          <span className="text-muted-foreground">Fecha de subida</span>
          <span className="text-foreground">{item.uploadedAt ? new Date(item.uploadedAt).toLocaleString("es-ES") : "—"}</span>

          <span className="text-muted-foreground">Última modificación</span>
          <span className="text-foreground">{item.modifiedAt ? new Date(item.modifiedAt).toLocaleString("es-ES") : "—"}</span>

          {(item.type === "video" || item.type === "audio") && (
            <>
              <span className="text-muted-foreground">Duración</span>
              <span className="text-foreground">{item.duration || "—"}</span>
            </>
          )}

          {(item.type === "video" || item.type === "image") && (
            <>
              <span className="text-muted-foreground">Resolución</span>
              <span className="text-foreground">{item.resolution || "—"}</span>
            </>
          )}

          <span className="text-muted-foreground">ID del recurso</span>
          <span className="text-foreground font-mono text-xs">{item.id}</span>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-1.5">
          <BookOpen size={16} /> Usado en estas lecciones
        </h2>
        {usage.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este archivo no está enlazado en ninguna lección.</p>
        ) : (
          <div className="space-y-2">
            {usage.map((u) => (
              <Link key={u.lessonId} to={`/courses/${u.courseId}/lessons/${u.lessonId}`}
                className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                <div>
                  <p className="text-sm text-foreground">{u.lessonTitle}</p>
                  <p className="text-xs text-muted-foreground">{u.courseTitle}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
