import { Link } from "react-router-dom";
import { List, Paperclip, BookOpen } from "lucide-react";
import type { LibraryItem, LessonUsage } from "../../types";
import type { TocEntry } from "../../lib/markdown";

interface Props {
  toc: TocEntry[];
  linkedItems: LibraryItem[];
  relatedLessons?: LessonUsage[];
}

export default function LessonSidebar({ toc, linkedItems, relatedLessons = [] }: Props) {
  return (
    <aside className="space-y-6 sticky top-0">
      {toc.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            <List size={14} /> Índice
          </h3>
          <nav className="space-y-1">
            {toc.map((entry, i) => (
              <a key={i} href={`#${entry.id}`}
                className={`block text-xs text-slate-400 hover:text-white transition-colors ${entry.level === 1 ? "font-medium pl-0" : entry.level === 2 ? "pl-3" : "pl-6"}`}>
                {entry.text}
              </a>
            ))}
          </nav>
        </div>
      )}

      {linkedItems.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            <Paperclip size={14} /> Archivos Enlazados
          </h3>
          <div className="space-y-2">
            {linkedItems.map((item) => (
              <Link key={item.id} to={`/library/${item.id}`}
                className="flex items-center gap-2 p-2 bg-slate-700/30 hover:bg-slate-700/60 rounded-lg transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate group-hover:text-indigo-300 transition-colors">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.originalFilename || item.type}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {relatedLessons.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            <BookOpen size={14} /> Lecciones Relacionadas
          </h3>
          <div className="space-y-2">
            {relatedLessons.map((lesson) => (
              <Link key={lesson.lessonId} to={`/courses/${lesson.courseId}/lessons/${lesson.lessonId}`}
                className="flex items-center gap-2 p-2 bg-slate-700/30 hover:bg-slate-700/60 rounded-lg transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate group-hover:text-indigo-300 transition-colors">{lesson.lessonTitle}</p>
                  <p className="text-xs text-slate-500">{lesson.courseTitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
