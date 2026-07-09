import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Course } from "../types";
import { Card, Badge } from "../components/ui";
import { BookOpen, Lock } from "lucide-react";

export default function Courses() {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    api.getCourses().then(setCourses).catch(() => { });
  }, []);

  const isLocked = (courseId: string) =>
    currentUser?.role === "student" && !(currentUser.enrolledCourses || []).includes(courseId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Cursos Disponibles</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {courses.map((c) => {
          const locked = isLocked(c.id);
          return (
            <Link key={c.id} to={`/courses/${c.id}`}>
              <Card className={`h-full transition-colors cursor-pointer ${locked ? "opacity-60" : "hover:border-indigo-500/50"}`}>
                <div className="flex items-center justify-between text-indigo-400 mb-3">
                  <BookOpen size={20} />
                  {locked && <Lock size={16} className="text-slate-500" />}
                </div>
                <h2 className="text-base font-semibold text-white mb-2">{c.title}</h2>
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{c.description}</p>
                <div className="flex items-center gap-2">
                  <Badge>{c.category}</Badge>
                  {locked && <span className="text-xs text-slate-500">No inscrito</span>}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
