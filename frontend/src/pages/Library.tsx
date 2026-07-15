import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { canUpload } from "../lib/rbac";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLibrary, useAddLibraryItem } from "@/hooks/useLibrary";
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
  video: "text-destructive",
  audio: "text-primary",
  image: "text-success",
  pdf: "text-destructive",
  text: "text-primary",
  document: "text-muted-foreground",
};

const categories = [
  "Ciencias Naturales", "Matemáticas", "Historia", "Idiomas",
  "Literatura", "Desarrollo", "Imágenes", "Video", "Audio", "General",
];

const typeOptions = ["video", "audio", "image", "pdf", "text", "document"];

export default function Library() {
  const { currentUser } = useAuth();
  const [typeFilter, setTypeFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: items = [] } = useLibrary(
    typeFilter === "all" ? undefined : typeFilter,
    catFilter === "all" ? undefined : catFilter
  );
  const addItem = useAddLibraryItem();

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !file) return;
    addItem.mutate(
      { title, category, file },
      {
        onSuccess: () => {
          setTitle(""); setCategory(""); setFile(null);
          setShowForm(false);
        },
        onError: (err) => toast.error((err as Error).message),
      }
    );
  };

  const formatSize = (kb: number) => {
    if (kb >= 1048576) return (kb / 1048576).toFixed(1) + " GB";
    if (kb >= 1024) return (kb / 1024).toFixed(1) + " MB";
    return kb + " KB";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Biblioteca Multimedia</h1>
        {currentUser && canUpload(currentUser.role) && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Upload size={16} />
            {showForm ? "Cancelar" : "Subir Archivo"}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Subir Archivo</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <Input
              type="text"
              placeholder="Título del archivo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            {file && <p className="text-xs text-muted-foreground">Archivo: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
            <Button type="submit" variant="success" disabled={addItem.isPending}>
              {addItem.isPending ? "Subiendo..." : "Subir"}
            </Button>
          </form>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap items-center">
        <Filter size={16} className="text-muted-foreground" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {typeOptions.map((t) => (
              <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(typeFilter !== "all" || catFilter !== "all") && (
          <Button variant="ghost" onClick={() => { setTypeFilter("all"); setCatFilter("all"); }}>Limpiar</Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => {
          const Icon = typeIcon[item.type] || File;
          return (
            <Link key={item.id} to={`/library/${item.id}`}>
              <Card className="flex items-start gap-4 h-full hover:border-primary/50 transition-colors cursor-pointer">
                <Icon size={32} className={typeColors[item.type] || "text-muted-foreground shrink-0"} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge>{item.type}</Badge>
                    <Badge>{item.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatSize(item.sizeKB)}
                    {item.resolution && ` · ${item.resolution}`}
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
        {items.length === 0 && (
          <p className="text-muted-foreground text-sm col-span-3">No hay archivos en la biblioteca.</p>
        )}
      </div>
    </div>
  );
}
