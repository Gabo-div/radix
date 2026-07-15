import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCourseQuizzes } from "@/hooks/useQuizzes";
import { Search } from "lucide-react";

interface Props {
  courseId: string;
  onSelect: (quizId: string) => void;
  onClose: () => void;
}

export default function QuizPickerModal({ courseId, onSelect, onClose }: Props) {
  const { data: quizzes = [] } = useCourseQuizzes(courseId);
  const [search, setSearch] = useState("");

  const filtered = quizzes.filter((q) => !search || q.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enlazar Cuestionario</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
            <Search size={14} className="text-muted-foreground" />
            <Input type="text" placeholder="Buscar cuestionarios..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent h-auto p-0 focus-visible:ring-0" />
          </div>
          {filtered.map((quiz) => (
            <button key={quiz.id} onClick={() => { onSelect(quiz.id); onClose(); }}
              className="w-full flex items-center gap-3 p-3 bg-secondary/50 hover:bg-secondary rounded-lg text-left transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{quiz.title}</p>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{quiz.id}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Sin resultados</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
