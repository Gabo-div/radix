import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLibrary, useAddLibraryItem } from "@/hooks/useLibrary";
import { Upload, Search } from "lucide-react";

interface Props {
  onSelect: (fileId: string) => void;
  onClose: () => void;
}

const categories = ["Ciencias Naturales", "Matemáticas", "Historia", "Idiomas", "Literatura", "Desarrollo", "Imágenes", "General"];

export default function FilePickerModal({ onSelect, onClose }: Props) {
  const { data: items = [] } = useLibrary();
  const addItem = useAddLibraryItem();

  const [tab, setTab] = useState("select");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const filtered = items.filter(
    (i) => !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.id.includes(search)
  );

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) return;
    addItem.mutate(
      { title, category, file },
      {
        onSuccess: (item) => {
          onSelect(item.id);
          onClose();
        },
        onError: (err) => toast.error((err as Error).message),
      }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[80vh]">
        <DialogTitle className="sr-only">Seleccionar o subir archivo</DialogTitle>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 min-h-0 flex flex-col">
          <TabsList>
            <TabsTrigger value="select">Seleccionar Archivo</TabsTrigger>
            <TabsTrigger value="upload">Subir Nuevo</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="flex-1 overflow-y-auto space-y-3 max-h-[55vh]">
            <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
              <Search size={14} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar archivos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none flex-1"
              />
            </div>
            {filtered.map((item) => (
              <button key={item.id} onClick={() => { onSelect(item.id); onClose(); }}
                className="w-full flex items-center gap-3 p-3 bg-secondary/30 hover:bg-secondary/60 rounded-lg text-left transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{item.title}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge>{item.type}</Badge>
                    <span className="text-xs text-muted-foreground">{item.originalFilename}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{item.id}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Sin resultados</p>}
          </TabsContent>

          <TabsContent value="upload">
            <form onSubmit={handleUpload} className="space-y-4">
              <Input
                type="text"
                placeholder="Título del archivo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin categoría" />
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
              <div className="flex gap-2">
                <Button type="submit" disabled={addItem.isPending}>
                  <Upload size={14} />
                  {addItem.isPending ? "Subiendo..." : "Subir e Insertar"}
                </Button>
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
