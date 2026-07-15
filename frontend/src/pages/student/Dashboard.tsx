import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCourses } from "@/hooks/useCourses";
import { Award, BookCheck, Flame, Trophy } from "lucide-react";

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const { data: courses = [] } = useCourses();

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
        <h1 className="text-xl font-semibold text-foreground">
          Hola, {currentUser.name} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido a tu panel de aprendizaje offline.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-success mb-2">
            <BookCheck size={20} />
            <span className="text-sm font-medium">Lecciones</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {completedCount}/{totalLessons}
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-warning mb-2">
            <Award size={20} />
            <span className="text-sm font-medium">Medallas</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {medals.filter((m) => m.earned).length}/3
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Progreso General</h2>
        <Progress value={progressPct} />
        <p className="text-xs text-muted-foreground mt-2">{progressPct}% completado</p>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-muted-foreground mb-4">Medallas</h2>
        <div className="space-y-3">
          {medals.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.name}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  m.earned ? "bg-secondary/50" : "bg-secondary/30 opacity-50"
                }`}
              >
                <Icon
                  size={20}
                  className={m.earned ? "text-warning" : "text-muted-foreground"}
                />
                <div>
                  <p className="text-sm text-foreground">{m.name}</p>
                  {m.earned ? (
                    <Badge variant="success">Obtenida</Badge>
                  ) : (
                    <Badge variant="secondary">Bloqueada</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Cursos Disponibles</h2>
        <div className="space-y-2">
          {courses.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <span className="text-sm text-foreground">{c.title}</span>
              <Badge>{c.category}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
