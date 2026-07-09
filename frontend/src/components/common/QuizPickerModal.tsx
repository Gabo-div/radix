import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import type { Quiz } from "../../types";
import { Search } from "lucide-react";

interface Props {
  courseId: string;
  onSelect: (quizId: string) => void;
  onClose: () => void;
}

export default function QuizPickerModal({ courseId, onSelect, onClose }: Props) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.getCourseQuizzes(courseId).then(setQuizzes).catch(() => {});
  }, [courseId]);

  const filtered = quizzes.filter((q) => !search || q.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-slate-700">
          <span className="text-sm font-medium text-white">Enlazar Cuestionario</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
            <Search size={14} className="text-slate-400" />
            <input type="text" placeholder="Buscar cuestionarios..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none flex-1" />
          </div>
          {filtered.map((quiz) => (
            <button key={quiz.id} onClick={() => { onSelect(quiz.id); onClose(); }}
              className="w-full flex items-center gap-3 p-3 bg-slate-700/30 hover:bg-slate-700/60 rounded-lg text-left transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{quiz.title}</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">{quiz.id}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin resultados</p>}
        </div>
      </div>
    </div>
  );
}
