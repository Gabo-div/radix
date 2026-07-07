import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Card, ProgressBar, Badge } from "../../components/ui";
import { Award, BookCheck, Flame, Trophy } from "lucide-react";

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<{ id: string; title: string; category: string }[]>([]);

  useEffect(() => {
    api.getCourses().then(setCourses).catch(() => {});
  }, []);

  if (!currentUser) return null;

  const totalLessons = 6;
  const completedCount = currentUser.completedLessons?.length || 0;
  const progressPct = Math.round((completedCount / totalLessons) * 100);

  const medals = [
    { name: "Primera Lección", earned: completedCount >= 1, icon: BookCheck },
    { name: "Mitad del Camino", earned: completedCount >= 3, icon: Flame },
    { name: "Maestro", earned: completedCount >= totalLessons, icon: Trophy },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Hola, {currentUser.name} 👋
        </h1>
        <p className="text-slate-400 mt-1">
          Bienvenido a tu panel de aprendizaje offline.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <Flame size={20} />
            <span className="text-sm font-medium">Puntos (XP)</span>
          </div>
          <p className="text-3xl font-bold text-white">{currentUser.points}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <BookCheck size={20} />
            <span className="text-sm font-medium">Lecciones</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {completedCount}/{totalLessons}
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Award size={20} />
            <span className="text-sm font-medium">Medallas</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {medals.filter((m) => m.earned).length}/3
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-medium text-slate-300 mb-3">Progreso General</h2>
        <ProgressBar value={completedCount} max={totalLessons} />
        <p className="text-xs text-slate-500 mt-2">{progressPct}% completado</p>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-slate-300 mb-4">Medallas</h2>
        <div className="space-y-3">
          {medals.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.name}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  m.earned ? "bg-slate-700/50" : "bg-slate-800/50 opacity-50"
                }`}
              >
                <Icon
                  size={20}
                  className={m.earned ? "text-amber-400" : "text-slate-600"}
                />
                <div>
                  <p className="text-sm text-white">{m.name}</p>
                  {m.earned ? (
                    <Badge color="emerald">Obtenida</Badge>
                  ) : (
                    <Badge color="slate">Bloqueada</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-slate-300 mb-3">Cursos Disponibles</h2>
        <div className="space-y-2">
          {courses.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <span className="text-sm text-white">{c.title}</span>
              <Badge>{c.category}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
