import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import type { CourseStudent } from "../../types";
import { Search } from "lucide-react";

interface Props {
  courseId: string;
  onSelect: (userId: string) => void;
  onClose: () => void;
}

export default function StudentPickerModal({ courseId, onSelect, onClose }: Props) {
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.getAvailableStudents(courseId).then(setStudents).catch(() => {});
  }, [courseId]);

  const filtered = students.filter(
    (s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-slate-700">
          <span className="text-sm font-medium text-white">Agregar Estudiante</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
            <Search size={14} className="text-slate-400" />
            <input type="text" placeholder="Buscar estudiantes..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none flex-1" />
          </div>
          {filtered.map((s) => (
            <button key={s.id} onClick={() => { onSelect(s.id); onClose(); }}
              className="w-full flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/60 rounded-lg text-left transition-colors">
              <div>
                <p className="text-sm text-white">{s.name}</p>
                <p className="text-xs text-slate-500">{s.email}</p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Todos los estudiantes ya están inscritos.</p>}
        </div>
      </div>
    </div>
  );
}
