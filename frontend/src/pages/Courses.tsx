import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCourses } from "@/hooks/useCourses";
import { BookOpen, Lock } from "lucide-react";

export default function Courses() {
  const { currentUser } = useAuth();
  const { data: courses = [] } = useCourses();

  const isLocked = (courseId: string) =>
    currentUser?.role === "student" && !(currentUser.enrolledCourses || []).includes(courseId);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Cursos Disponibles</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {courses.map((c) => {
          const locked = isLocked(c.id);
          return (
            <Link key={c.id} to={`/courses/${c.id}`}>
              <Card className={`h-full transition-colors cursor-pointer ${locked ? "opacity-60" : "hover:border-primary/50"}`}>
                <div className="flex items-center justify-between text-primary mb-3">
                  <BookOpen size={20} />
                  {locked && <Lock size={16} className="text-muted-foreground" />}
                </div>
                <h2 className="text-base font-semibold text-foreground mb-2">{c.title}</h2>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{c.description}</p>
                <div className="flex items-center gap-2">
                  <Badge>{c.category}</Badge>
                  {locked && <span className="text-xs text-muted-foreground">No inscrito</span>}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
