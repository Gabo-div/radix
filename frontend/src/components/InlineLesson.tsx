import { Link } from "react-router-dom";
import type { LessonUsage } from "../types";
import { BookOpen, ChevronRight } from "lucide-react";

interface Props {
  lesson: LessonUsage;
}

export default function InlineLesson({ lesson }: Props) {
  return (
    <Link to={`/courses/${lesson.courseId}/lessons/${lesson.lessonId}`}
      className="flex items-center gap-3 p-4 my-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-indigo-500/50 transition-colors group not-prose">
      <BookOpen size={24} className="text-indigo-400" />
      <div className="flex-1">
        <p className="text-sm text-white group-hover:text-indigo-300">{lesson.lessonTitle}</p>
        <p className="text-xs text-slate-500">{lesson.courseTitle}</p>
      </div>
      <ChevronRight size={16} className="text-slate-500 group-hover:text-indigo-400" />
    </Link>
  );
}
