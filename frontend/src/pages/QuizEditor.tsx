import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import type { LibraryItem, LessonUsage } from "../types";
import { extractWikiRefs } from "../lib/markdown";
import { Card, Button } from "../components/ui";
import MarkdownEditor from "../components/MarkdownEditor";
import QuizQuestionsEditor from "../components/QuizQuestionsEditor";
import FilePickerModal from "../components/common/FilePickerModal";
import LessonPickerModal from "../components/common/LessonPickerModal";
import { ArrowLeft, Save, Paperclip, BookOpen, CheckCircle } from "lucide-react";

export default function QuizEditor() {
  const { courseId, quizId } = useParams<{ courseId: string; quizId?: string }>();
  const isEditing = !!quizId;
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [allLessons, setAllLessons] = useState<LessonUsage[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([{ text: "", options: ["", "", "", ""], correctIndex: 0 }]);
  const [loadingQuiz, setLoadingQuiz] = useState(isEditing);
  const [showPreview, setShowPreview] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!courseId) return;
    api.getCourse(courseId).then((d) => setCourse(d.course)).catch(() => {});
    api.getLibrary().then(setLibrary).catch(() => {});
    api.getAllLessons().then(setAllLessons).catch(() => {});
    if (quizId) {
      api.getQuiz(quizId).then((q) => {
        setTitle(q.title);
        setDescription(q.description);
        setQuestions(q.questions);
        setLoadingQuiz(false);
      }).catch(() => setLoadingQuiz(false));
    }
  }, [courseId, quizId]);

  const wikiRefs = useMemo(() => extractWikiRefs(description), [description]);
  const linkedItems = useMemo(() => library.filter((li) => wikiRefs.includes(li.id)), [wikiRefs, library]);
  const linkedLessons = useMemo(() => allLessons.filter((l) => wikiRefs.includes(l.lessonId)), [wikiRefs, allLessons]);

  const showMsg = (text: string) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  const insertWikiLink = (id: string) => {
    setDescription((prev) => prev + `[[${id}]]`);
    setShowFilePicker(false);
    setShowLessonPicker(false);
  };

  const handleSave = async () => {
    if (!courseId || !title || !questions[0].text) { alert("Título y al menos una pregunta son obligatorios."); return; }
    setSaving(true);
    try {
      if (isEditing && quizId) {
        await api.updateQuiz(quizId, { title, description, questions });
        showMsg("Cuestionario actualizado exitosamente");
      } else {
        await api.createQuiz({ courseId, title, description, questions });
        showMsg("Cuestionario creado exitosamente");
      }
      setTimeout(() => navigate(`/courses/${courseId}?tab=quizzes`), 1000);
    } catch (err) {
      alert("Error: " + (err as Error).message);
    }
    setSaving(false);
  };

  if (loadingQuiz) return <p className="text-slate-400">Cargando cuestionario...</p>;

  return (
    <div className="space-y-6">
      {showFilePicker && <FilePickerModal onSelect={insertWikiLink} onClose={() => setShowFilePicker(false)} />}
      {showLessonPicker && (
        <LessonPickerModal onSelect={insertWikiLink} onClose={() => setShowLessonPicker(false)} />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/courses/${courseId}?tab=quizzes`} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Volver
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-300">{course?.title || "Cargando..."}</span>
          <span className="text-slate-600">/</span>
          <h1 className="text-lg font-bold text-white">{isEditing ? "Editar Cuestionario" : "Nuevo Cuestionario"}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving} variant={saving ? "secondary" : "success"}>
          <Save size={16} className="mr-1.5 inline" />
          {saving ? "Guardando..." : isEditing ? "Actualizar Cuestionario" : "Guardar Cuestionario"}
        </Button>
      </div>

      {msg && (
        <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700 text-emerald-300 px-4 py-2 rounded-lg text-sm">
          <CheckCircle size={16} /> {msg}
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <input type="text" placeholder="Título del cuestionario" value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-xl font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" required />

          <Card>
            <h2 className="text-sm font-medium text-slate-300 mb-4">Descripción (opcional)</h2>
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              library={library}
              lessons={allLessons}
              showPreview={showPreview}
              onTogglePreview={() => setShowPreview(!showPreview)}
              onAttachClick={() => setShowFilePicker(true)}
              onAttachLessonClick={() => setShowLessonPicker(true)}
            />
          </Card>

          <Card>
            <h2 className="text-sm font-medium text-slate-300 mb-4">Preguntas</h2>
            <QuizQuestionsEditor questions={questions} onChange={setQuestions} />
          </Card>
        </div>

        <div className="w-64 shrink-0 hidden lg:block space-y-6 sticky top-0 self-start">
          {linkedItems.length > 0 && (
            <Card>
              <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                <Paperclip size={14} /> Archivos Enlazados
              </h3>
              <div className="space-y-2">
                {linkedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg text-xs bg-slate-700/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate">{item.title}</p>
                      <p className="text-slate-500 text-[10px]">{item.id}</p>
                    </div>
                    <Link to={`/library/${item.id}`} className="text-indigo-400 hover:text-indigo-300 text-[10px] shrink-0">Ver</Link>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {linkedLessons.length > 0 && (
            <Card>
              <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                <BookOpen size={14} /> Lecciones Enlazadas
              </h3>
              <div className="space-y-2">
                {linkedLessons.map((lesson) => (
                  <div key={lesson.lessonId} className="flex items-center gap-2 p-2 rounded-lg text-xs bg-slate-700/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate">{lesson.lessonTitle}</p>
                      <p className="text-slate-500 text-[10px]">{lesson.courseTitle}</p>
                    </div>
                    <Link to={`/courses/${lesson.courseId}/lessons/${lesson.lessonId}`} className="text-indigo-400 hover:text-indigo-300 text-[10px] shrink-0">Ver</Link>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
