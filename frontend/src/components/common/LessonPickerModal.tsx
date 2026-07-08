import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import type { LessonUsage } from "../../types";
import { Badge } from "../ui";
import { Search } from "lucide-react";

interface Props {
  currentLessonId?: string;
  onSelect: (lessonId: string) => void;
  onClose: () => void;
}

export default function LessonPickerModal({ currentLessonId, onSelect, onClose }: Props) {
  const [lessons, setLessons] = useState<LessonUsage[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.getAllLessons().then(setLessons).catch(() => {});
  }, []);

  const filtered = lessons.filter(
    (l) =>
      l.lessonId !== currentLessonId &&
      (!search || l.lessonTitle.toLowerCase().includes(search.toLowerCase()) || l.courseTitle.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-slate-700">
          <span className="text-sm font-medium text-white">Enlazar Lección</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
            <Search size={14} className="text-slate-400" />
            <input type="text" placeholder="Buscar lecciones..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none flex-1" />
          </div>
          {filtered.map((lesson) => (
            <button key={lesson.lessonId} onClick={() => { onSelect(lesson.lessonId); onClose(); }}
              className="w-full flex items-center gap-3 p-3 bg-slate-700/30 hover:bg-slate-700/60 rounded-lg text-left transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{lesson.lessonTitle}</p>
                <div className="flex gap-2 mt-1">
                  <Badge>{lesson.courseTitle}</Badge>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-mono">{lesson.lessonId}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin resultados</p>}
        </div>
      </div>
    </div>
  );
}
