import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import type { LibraryItem } from "../../types";
import { Card, Button, Badge } from "../ui";
import { Upload, Search } from "lucide-react";

interface Props {
  onSelect: (fileId: string) => void;
  onClose: () => void;
}

export default function FilePickerModal({ onSelect, onClose }: Props) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [tab, setTab] = useState<"select" | "upload">("select");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getLibrary().then(setItems).catch(() => {});
  }, []);

  const filtered = items.filter(
    (i) => !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.id.includes(search)
  );

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) return;
    setLoading(true);
    try {
      const item = await api.addLibraryItem(title, category, file);
      onSelect(item.id);
      onClose();
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex border-b border-slate-700">
          <button onClick={() => setTab("select")}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${tab === "select" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-400 hover:text-white"}`}>
            Seleccionar Archivo
          </button>
          <button onClick={() => setTab("upload")}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${tab === "upload" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-400 hover:text-white"}`}>
            Subir Nuevo
          </button>
        </div>

        {tab === "select" ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
              <Search size={14} className="text-slate-400" />
              <input type="text" placeholder="Buscar archivos..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none flex-1" />
            </div>
            {filtered.map((item) => (
              <button key={item.id} onClick={() => { onSelect(item.id); onClose(); }}
                className="w-full flex items-center gap-3 p-3 bg-slate-700/30 hover:bg-slate-700/60 rounded-lg text-left transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.title}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge>{item.type}</Badge>
                    <span className="text-xs text-slate-500">{item.originalFilename}</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-mono">{item.id}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin resultados</p>}
          </div>
        ) : (
          <div className="p-4">
            <form onSubmit={handleUpload} className="space-y-4">
              <input type="text" placeholder="Título del archivo" value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" required />
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                <option value="">Sin categoría</option>
                {["Ciencias Naturales", "Matemáticas", "Historia", "Idiomas", "Literatura", "Desarrollo", "Imágenes", "General"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer" required />
              <div className="flex gap-2">
                <Button type="submit" variant="primary" disabled={loading}>
                  <Upload size={14} className="mr-1.5 inline" />
                  {loading ? "Subiendo..." : "Subir e Insertar"}
                </Button>
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
