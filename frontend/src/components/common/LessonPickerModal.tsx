import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAllLessons } from "@/hooks/useLessons";
import { Search } from "lucide-react";

interface Props {
  currentLessonId?: string;
  onSelect: (lessonId: string) => void;
  onClose: () => void;
}

export default function LessonPickerModal({ currentLessonId, onSelect, onClose }: Props) {
  const { data: lessons = [] } = useAllLessons();
  const [search, setSearch] = useState("");

  const filtered = lessons.filter(
    (l) =>
      l.lessonId !== currentLessonId &&
      (!search || l.lessonTitle.toLowerCase().includes(search.toLowerCase()) || l.courseTitle.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enlazar Lección</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
            <Search size={14} className="text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar lecciones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-auto border-0 bg-transparent p-0 focus-visible:ring-0"
            />
          </div>
          {filtered.map((lesson) => (
            <button key={lesson.lessonId} onClick={() => { onSelect(lesson.lessonId); onClose(); }}
              className="w-full flex items-center gap-3 p-3 bg-secondary/30 hover:bg-secondary/60 rounded-lg text-left transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{lesson.lessonTitle}</p>
                <div className="flex gap-2 mt-1">
                  <Badge>{lesson.courseTitle}</Badge>
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{lesson.lessonId}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Sin resultados</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
