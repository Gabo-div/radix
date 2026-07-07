import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { LibraryItem } from "../types";
import { canUpload } from "../lib/rbac";
import { Card, Button, Badge } from "../components/ui";
import {
  FileVideo, FileAudio, FileImage, FileText, File, Upload, Filter,
} from "lucide-react";

const typeIcon: Record<string, typeof FileVideo> = {
  video: FileVideo,
  audio: FileAudio,
  image: FileImage,
  pdf: FileText,
  text: FileText,
  document: File,
};

const typeColors: Record<string, string> = {
  video: "text-rose-400",
  audio: "text-indigo-400",
  image: "text-emerald-400",
  pdf: "text-red-400",
  text: "text-sky-400",
  document: "text-slate-400",
};

const categories = [
  "Ciencias Naturales", "Matemáticas", "Historia", "Idiomas",
  "Literatura", "Desarrollo", "Imágenes", "Video", "Audio", "General",
];

const typeOptions = ["video", "audio", "image", "pdf", "text", "document"];

export default function Library() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const loadItems = () => {
    api.getLibrary(typeFilter || undefined, catFilter || undefined).then(setItems).catch(() => { });
  };

  useEffect(() => { loadItems(); }, [typeFilter, catFilter]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !file) return;
    setLoading(true);
    try {
      await api.addLibraryItem(title, category, file);
      setTitle(""); setCategory(""); setFile(null);
      setShowForm(false);
      loadItems();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const formatSize = (kb: number) => {
    if (kb >= 1048576) return (kb / 1048576).toFixed(1) + " GB";
    if (kb >= 1024) return (kb / 1024).toFixed(1) + " MB";
    return kb + " KB";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Biblioteca Multimedia</h1>
        {currentUser && canUpload(currentUser.role) && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Upload size={16} className="mr-1.5 inline" />
            {showForm ? "Cancelar" : "Subir Archivo"}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <h2 className="text-sm font-medium text-slate-300 mb-4">Subir Archivo</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <input type="text" placeholder="Título del archivo" value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" required />
            <div className="grid grid-cols-2 gap-4">
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" required>
                <option value="">Categoría</option>
                {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer" required />
            </div>
            {file && <p className="text-xs text-slate-500">Archivo: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
            <Button type="submit" variant="success" disabled={loading}>
              {loading ? "Subiendo..." : "Subir"}
            </Button>
          </form>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap items-center">
        <Filter size={16} className="text-slate-400" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500">
          <option value="">Todos los tipos</option>
          {typeOptions.map((t) => (<option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>))}
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500">
          <option value="">Todas las categorías</option>
          {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        {(typeFilter || catFilter) && (
          <Button variant="ghost" onClick={() => { setTypeFilter(""); setCatFilter(""); }}>Limpiar</Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => {
          const Icon = typeIcon[item.type] || File;
          return (
            <Link key={item.id} to={`/library/${item.id}`}>
              <Card className="flex items-start gap-4 h-full hover:border-indigo-500/50 transition-colors cursor-pointer">
                <Icon size={32} className={typeColors[item.type] || "text-slate-400 shrink-0"} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge>{item.type}</Badge>
                    <Badge>{item.category}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {formatSize(item.sizeKB)}
                    {item.resolution && ` · ${item.resolution}`}
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
        {items.length === 0 && (
          <p className="text-slate-500 text-sm col-span-3">No hay archivos en la biblioteca.</p>
        )}
      </div>
    </div>
  );
}
