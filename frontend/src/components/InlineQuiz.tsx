import { Link } from "react-router-dom";
import type { QuizUsage } from "../types";
import { FileQuestion, ChevronRight } from "lucide-react";

interface Props {
  quiz: QuizUsage;
}

export default function InlineQuiz({ quiz }: Props) {
  return (
    <Link to={`/courses/${quiz.courseId}/quizzes/${quiz.quizId}`}
      className="flex items-center gap-3 p-4 my-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-indigo-500/50 transition-colors group not-prose">
      <FileQuestion size={24} className="text-indigo-400" />
      <div className="flex-1">
        <p className="text-sm text-white group-hover:text-indigo-300">{quiz.quizTitle}</p>
        <p className="text-xs text-slate-500">{quiz.courseTitle}</p>
      </div>
      <ChevronRight size={16} className="text-slate-500 group-hover:text-indigo-400" />
    </Link>
  );
}
