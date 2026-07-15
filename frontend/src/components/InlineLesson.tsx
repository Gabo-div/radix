import { Link } from "react-router-dom";
import type { LessonUsage } from "../types";
import { BookOpen, ChevronRight } from "lucide-react";

interface Props {
  lesson: LessonUsage;
}

export default function InlineLesson({ lesson }: Props) {
  return (
    <Link to={`/courses/${lesson.courseId}/lessons/${lesson.lessonId}`}
      className="flex items-center gap-3 p-4 my-3 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors group not-prose">
      <BookOpen size={24} className="text-primary" />
      <div className="flex-1">
        <p className="text-sm text-foreground group-hover:text-primary transition-colors">{lesson.lessonTitle}</p>
        <p className="text-xs text-muted-foreground">{lesson.courseTitle}</p>
      </div>
      <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}
