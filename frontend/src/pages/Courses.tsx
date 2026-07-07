import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Course } from "../types";
import { Card, Badge } from "../components/ui";
import { BookOpen } from "lucide-react";

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    api.getCourses().then(setCourses).catch(() => { });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Cursos Disponibles</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {courses.map((c) => (
          <Link key={c.id} to={`/courses/${c.id}`}>
            <Card className="h-full hover:border-indigo-500/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 text-indigo-400 mb-3">
                <BookOpen size={20} />
              </div>
              <h2 className="text-base font-semibold text-white mb-2">{c.title}</h2>
              <p className="text-sm text-slate-400 mb-3 line-clamp-2">{c.description}</p>
              <Badge>{c.category}</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
