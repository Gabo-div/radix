import { Link } from "react-router-dom";
import type { QuizUsage } from "../types";
import { FileQuestion, ChevronRight } from "lucide-react";

interface Props {
  quiz: QuizUsage;
}

export default function InlineQuiz({ quiz }: Props) {
  return (
    <Link to={`/courses/${quiz.courseId}/quizzes/${quiz.quizId}`}
      className="flex items-center gap-3 p-4 my-3 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors group not-prose">
      <FileQuestion size={24} className="text-primary" />
      <div className="flex-1">
        <p className="text-sm text-foreground group-hover:text-primary transition-colors">{quiz.quizTitle}</p>
        <p className="text-xs text-muted-foreground">{quiz.courseTitle}</p>
      </div>
      <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}
