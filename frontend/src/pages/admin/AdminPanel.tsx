import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import type { LibraryItem } from "../../types";
import { Card, Button } from "../../components/ui";
import {
  BookPlus, Link2, CheckCircle,
} from "lucide-react";

export default function AdminPanel() {
  const [courses, setCourses] = useState<any[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);

  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseCat, setCourseCat] = useState("");

  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const c = await api.getCourses();
      setCourses(c);
      const l = await api.getLibrary();
      setLibrary(l);
      const allLessons: any[] = [];
      for (const course of c) {
        const detail = await api.getCourse(course.id);
        allLessons.push(...detail.lessons.map((ls: any) => ({ ...ls, courseTitle: course.title })));
      }
      setLessons(allLessons);
    } catch { }
  };

  useEffect(() => { load(); }, []);

  const showMsg = (text: string) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle) return;
    try {
      await api.addCourse(courseTitle, courseDesc, courseCat);
      setCourseTitle(""); setCourseDesc(""); setCourseCat("");
      showMsg("Curso creado exitosamente");
      load();
    } catch (err) { alert((err as Error).message); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>

      {msg && (
        <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700 text-emerald-300 px-4 py-2 rounded-lg text-sm">
          <CheckCircle size={16} /> {msg}
        </div>
      )}

      <Card>
        <h2 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-4">
          <BookPlus size={18} /> Crear Curso
        </h2>
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <input type="text" placeholder="Título del curso" value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" required />
          <textarea placeholder="Descripción" value={courseDesc} onChange={(e) => setCourseDesc(e.target.value)} rows={2}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none" />
          <input type="text" placeholder="Categoría" value={courseCat} onChange={(e) => setCourseCat(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
          <Button type="submit" variant="primary">Crear Curso</Button>
        </form>
      </Card>

      <Card>
        <h2 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-4">
          <Link2 size={18} /> Vincular Recursos
        </h2>
        <p className="text-sm text-slate-400">Usa la sintaxis <code className="text-indigo-400 bg-slate-700 px-1.5 py-0.5 rounded text-xs">[[id_del_archivo]]</code> en el contenido de la lección para enlazar archivos de la biblioteca.</p>
        <div className="mt-3">
          <Link to="/library" className="text-sm text-indigo-400 hover:text-indigo-300">Ir a la biblioteca →</Link>
        </div>
      </Card>
    </div>
  );
}
