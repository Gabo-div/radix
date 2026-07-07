import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { LibraryItem } from "../types";
import { Card, Badge, Button } from "../components/ui";
import {
  ArrowLeft, Download, FileVideo, FileAudio, FileImage, FileText, Edit, CheckCircle,
} from "lucide-react";

const typeIcon: Record<string, typeof FileVideo> = {
  video: FileVideo, audio: FileAudio, image: FileImage,
  pdf: FileText, text: FileText, document: FileText,
};

export default function LibraryDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [item, setItem] = useState<LibraryItem | null>(null);
  const [content, setContent] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editMsg, setEditMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    api.getLibraryItem(id).then(setItem).catch(() => { });
  }, [id]);

  useEffect(() => {
    if (item?.type === "text") {
      fetch(api.getLibraryFileUrl(item.id), {
        headers: { Authorization: `Bearer ${localStorage.getItem("radix_token")}` },
      }).then((r) => r.text()).then(setContent).catch(() => { });
    }
  }, [item]);

  if (!item) return <p className="text-slate-400">Cargando...</p>;

  const isAdmin = currentUser?.role === "admin";
  const Icon = typeIcon[item.type] || FileText;
  const fileUrl = api.getLibraryFileUrl(item.id);
  const imgTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

  const handleEdit = async () => {
    if (!editTitle) return;
    try {
      const updated = await api.updateLibraryItem(item.id, { title: editTitle, category: editCategory });
      setItem(updated);
      setShowEdit(false);
      setEditMsg("Actualizado exitosamente");
      setTimeout(() => setEditMsg(""), 2000);
    } catch (err) { alert((err as Error).message); }
  };

  return (
    <div className="space-y-6">
      <Link to="/library" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Volver a biblioteca
      </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon size={36} className="text-indigo-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">{item.title}</h1>
              <p className="text-sm text-slate-400">{item.originalFilename}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="secondary" onClick={() => { setEditTitle(item.title); setEditCategory(item.category); setShowEdit(!showEdit); }}>
                <Edit size={14} className="mr-1 inline" />
                {showEdit ? "Cancelar" : "Editar"}
              </Button>
            )}
            <a href={fileUrl} download
              className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors">
              <Download size={16} /> Descargar
            </a>
          </div>
        </div>

        {editMsg && (
          <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700 text-emerald-300 px-4 py-2 rounded-lg text-sm">
            <CheckCircle size={16} /> {editMsg}
          </div>
        )}

        {showEdit && (
          <Card>
            <h2 className="text-sm font-medium text-slate-300 mb-3">Editar Metadatos</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Título" value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
              <input type="text" placeholder="Categoría" value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
              <Button onClick={handleEdit} variant="primary">Guardar Cambios</Button>
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
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <audio controls className="w-full" src={fileUrl}>
            Tu navegador no soporta audio.
          </audio>
        </div>
      )}

      {item.type === "image" && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-center">
          <img src={fileUrl} alt={item.title} className="max-w-full max-h-[500px] rounded-lg object-contain" />
        </div>
      )}

      {item.type === "pdf" && (
        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700" style={{ height: "600px" }}>
          <iframe src={fileUrl} className="w-full h-full" title={item.title} />
        </div>
      )}

      {item.type === "text" && (
        <Card>
          <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-[500px]">
            {content || "Cargando contenido..."}
          </pre>
        </Card>
      )}

      <Card>
        <h2 className="text-sm font-medium text-slate-300 mb-4">Detalles del Archivo</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <span className="text-slate-400">Tipo</span>
          <span className="text-white font-medium capitalize">{item.type}</span>

          <span className="text-slate-400">Tamaño</span>
          <span className="text-white">{item.sizeKB >= 1024 ? `${(item.sizeKB / 1024).toFixed(1)} MB` : `${item.sizeKB} KB`}</span>

          <span className="text-slate-400">Categoría</span>
          <span className="text-white">{item.category || "—"}</span>

          <span className="text-slate-400">Formato</span>
          <span className="text-white">{item.mimeType || item.originalFilename?.split(".").pop() || "—"}</span>

          <span className="text-slate-400">Subido por</span>
          <span className="text-white">{item.uploadedBy || "—"}</span>

          <span className="text-slate-400">Fecha de subida</span>
          <span className="text-white">{item.uploadedAt ? new Date(item.uploadedAt).toLocaleString("es-ES") : "—"}</span>

          <span className="text-slate-400">Última modificación</span>
          <span className="text-white">{item.modifiedAt ? new Date(item.modifiedAt).toLocaleString("es-ES") : "—"}</span>

          {(item.type === "video" || item.type === "audio") && (
            <>
              <span className="text-slate-400">Duración</span>
              <span className="text-white">{item.duration || "—"}</span>
            </>
          )}

          {(item.type === "video" || item.type === "image") && (
            <>
              <span className="text-slate-400">Resolución</span>
              <span className="text-white">{item.resolution || "—"}</span>
            </>
          )}

          <span className="text-slate-400">ID del recurso</span>
          <span className="text-white font-mono text-xs">{item.id}</span>
        </div>
      </Card>
    </div>
  );
}
