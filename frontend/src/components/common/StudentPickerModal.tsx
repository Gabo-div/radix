import { useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAvailableStudents } from "@/hooks/useCourses";

interface Props {
  courseId: string;
  onSelect: (userId: string) => void;
  onClose: () => void;
}

export default function StudentPickerModal({ courseId, onSelect, onClose }: Props) {
  const { data: students = [] } = useAvailableStudents(courseId);
  const [search, setSearch] = useState("");

  const filtered = students.filter(
    (s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar Estudiante</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
            <Search size={14} className="text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar estudiantes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
            />
          </div>
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => { onSelect(s.id); onClose(); }}
              className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/60 rounded-lg text-left transition-colors"
            >
              <div>
                <p className="text-sm text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.email}</p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">Todos los estudiantes ya están inscritos.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
