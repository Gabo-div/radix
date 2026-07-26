import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAddCourse } from "@/hooks/useCourses";
import MonitorPanel from "@/components/admin/MonitorPanel";
import LogsPanel from "@/components/admin/LogsPanel";
import { BookPlus, Link2, Settings, Activity, ScrollText } from "lucide-react";

const TABS = ["general", "monitor", "logs"] as const;
type Tab = (typeof TABS)[number];

export default function AdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseCat, setCourseCat] = useState("");

  // La pestaña vive en la URL (?tab=), igual que en CourseDetail: así el back
  // del navegador funciona entre pestañas y se puede compartir el enlace.
  const tabParam = searchParams.get("tab");
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "general";
  const setTab = (t: string) => setSearchParams(t === "general" ? {} : { tab: t });

  const addCourse = useAddCourse();

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle) return;
    addCourse.mutate(
      { title: courseTitle, description: courseDesc, category: courseCat },
      {
        onSuccess: () => {
          setCourseTitle("");
          setCourseDesc("");
          setCourseCat("");
          toast.success("Curso creado exitosamente");
        },
        onError: (err) => toast.error((err as Error).message),
      }
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Panel de Administración</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="general"><Settings size={14} /> General</TabsTrigger>
          <TabsTrigger value="monitor"><Activity size={14} /> Monitor</TabsTrigger>
          <TabsTrigger value="logs"><ScrollText size={14} /> Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
              <BookPlus size={18} /> Crear Curso
            </h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <Label htmlFor="courseTitle" className="block mb-1.5">Título del curso</Label>
                <Input
                  id="courseTitle"
                  type="text"
                  placeholder="Título del curso"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="courseDesc" className="block mb-1.5">Descripción</Label>
                <Textarea
                  id="courseDesc"
                  placeholder="Descripción"
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="courseCat" className="block mb-1.5">Categoría</Label>
                <Input
                  id="courseCat"
                  type="text"
                  placeholder="Categoría"
                  value={courseCat}
                  onChange={(e) => setCourseCat(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={addCourse.isPending}>
                {addCourse.isPending ? "Creando..." : "Crear Curso"}
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
              <Link2 size={18} /> Vincular Recursos
            </h2>
            <p className="text-sm text-muted-foreground">
              Usa la sintaxis <code className="text-primary bg-secondary px-1.5 py-0.5 rounded text-xs">[[id_del_archivo]]</code> en el contenido de la lección para enlazar archivos de la biblioteca.
            </p>
            <div className="mt-3">
              <Link to="/library" className="text-sm text-primary hover:text-primary/80">Ir a la biblioteca →</Link>
            </div>
          </Card>
        </TabsContent>

        {/* Montadas solo con su pestaña activa: las dos hacen polling
            (Monitor 3 s, logs en vivo 1,5 s) y no tiene sentido que sigan
            pidiendo datos desde una pestaña que no se está viendo. */}
        <TabsContent value="monitor">
          <MonitorPanel />
        </TabsContent>

        <TabsContent value="logs">
          <LogsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
