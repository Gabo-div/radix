import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import type { LibraryItem } from "../types";
import { extractWikiRefs } from "../lib/markdown";
import { Card, Button, Badge } from "../components/ui";
import MarkdownEditor from "../components/MarkdownEditor";
import FilePickerModal from "../components/common/FilePickerModal";
import { ArrowLeft, Save, Plus, FileQuestion, Paperclip, CheckCircle } from "lucide-react";

export default function LessonEditor() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const isEditing = !!lessonId;
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loadingLesson, setLoadingLesson] = useState(isEditing);
  const [showPreview, setShowPreview] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [mainFileId, setMainFileId] = useState<string | null>(null);
  const [showQuizSection, setShowQuizSection] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([{ text: "", options: ["", "", "", ""], correctIndex: 0 }]);
  const [existingQuiz, setExistingQuiz] = useState<{ id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!courseId) return;
    api.getCourse(courseId).then((d) => setCourse(d.course)).catch(() => {});
    api.getLibrary().then(setLibrary).catch(() => {});
    if (lessonId) {
      api.getLesson(courseId, lessonId).then((d) => {
        setTitle(d.lesson.title);
        setContent(d.lesson.contentText);
        if (d.quiz) {
          setQuizQuestions(d.quiz.questions);
          setShowQuizSection(true);
          setExistingQuiz({ id: d.quiz.id });
        }
        if (d.lesson.libraryItemId) {
          setMainFileId(d.lesson.libraryItemId);
        }
        setLoadingLesson(false);
      }).catch(() => setLoadingLesson(false));
    }
  }, [courseId, lessonId]);

  const wikiRefs = useMemo(() => extractWikiRefs(content), [content]);
  const linkedItems = useMemo(() => library.filter((li) => wikiRefs.includes(li.id)), [wikiRefs, library]);
  const mainItem = useMemo(() => library.find((li) => li.id === mainFileId), [mainFileId, library]);

  const showMsg = (text: string) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  const insertWikiLink = (fileId: string) => {
    setContent((prev) => prev + `[[${fileId}]]`);
    setShowFilePicker(false);
  };

  const handleSave = async () => {
    if (!courseId || !title || !content) { alert("Título y contenido son obligatorios."); return; }
    setSaving(true);
    try {
      if (isEditing && lessonId) {
        await api.updateLesson(lessonId, title, content);
        showMsg("Lección actualizada exitosamente");
        setTimeout(() => navigate(`/courses/${courseId}`), 1000);
      } else {
        const lesson = await api.addLesson(courseId, title, content);
        if (mainFileId) {
          await api.linkLibraryItem(lesson.id, mainFileId);
        }
        if (showQuizSection && quizQuestions[0].text) {
          await api.createQuiz(lesson.id, quizQuestions);
        }
        showMsg("Lección creada exitosamente");
        setTimeout(() => navigate(`/courses/${courseId}`), 1000);
      }
    } catch (err) {
      alert("Error: " + (err as Error).message);
    }
    setSaving(false);
  };

  if (loadingLesson) return <p className="text-slate-400">Cargando lección...</p>;

  const updateQuestion = (idx: number, field: string, val: any) => {
    const copy = [...quizQuestions];
    (copy[idx] as any)[field] = val;
    setQuizQuestions(copy);
  };

  return (
    <div className="space-y-6">
      {showFilePicker && <FilePickerModal onSelect={insertWikiLink} onClose={() => setShowFilePicker(false)} />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/courses/${courseId}`} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Volver
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-300">{course?.title || "Cargando..."}</span>
          <span className="text-slate-600">/</span>
          <h1 className="text-lg font-bold text-white">{isEditing ? "Editar Lección" : "Nueva Lección"}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving} variant={saving ? "secondary" : "success"}>
          <Save size={16} className="mr-1.5 inline" />
          {saving ? "Guardando..." : isEditing ? "Actualizar Lección" : "Guardar Lección"}
        </Button>
      </div>

      {msg && (
        <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700 text-emerald-300 px-4 py-2 rounded-lg text-sm">
          <CheckCircle size={16} /> {msg}
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <input type="text" placeholder="Título de la lección" value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-xl font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" required />

          <Card>
            <h2 className="text-sm font-medium text-slate-300 mb-4">Contenido</h2>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              library={library}
              showPreview={showPreview}
              onTogglePreview={() => setShowPreview(!showPreview)}
              onAttachClick={() => setShowFilePicker(true)}
              
            />
          </Card>

          <Card>
            <h2 className="text-sm font-medium text-slate-300 mb-3">
              <Paperclip size={16} className="inline mr-1.5" />
              Archivo Principal de la Lección
            </h2>
            {mainItem ? (
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <p className="text-sm text-white">{mainItem.title}</p>
                  <p className="text-xs text-slate-500">{mainItem.type} · {mainItem.originalFilename}</p>
                </div>
                <button type="button" onClick={() => setMainFileId(null)}
                  className="text-xs text-red-400 hover:text-red-300">Quitar</button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowFilePicker(true)}
                className="w-full p-3 border-2 border-dashed border-slate-600 rounded-lg text-sm text-slate-400 hover:text-indigo-400 hover:border-indigo-600 transition-colors">
                + Adjuntar archivo principal (video, audio, etc.)
              </button>
            )}
          </Card>

          <Card>
            <button type="button" onClick={() => setShowQuizSection(!showQuizSection)}
              className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors">
              <FileQuestion size={16} />
              {showQuizSection ? "Ocultar" : "Agregar"} cuestionario
            </button>

            {showQuizSection && (
              <div className="mt-4 space-y-4">
                {quizQuestions.map((q, qi) => (
                  <div key={qi} className="p-3 bg-slate-700/30 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Pregunta {qi + 1}</span>
                      {quizQuestions.length > 1 && (
                        <button type="button" onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== qi))}
                          className="text-xs text-red-400">Eliminar</button>
                      )}
                    </div>
                    <input type="text" placeholder="Texto de la pregunta" value={q.text}
                      onChange={(e) => updateQuestion(qi, "text", e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`q-correct-${qi}`} checked={q.correctIndex === oi}
                          onChange={() => updateQuestion(qi, "correctIndex", oi)} className="accent-indigo-500 shrink-0" />
                        <input type="text" placeholder={`Opción ${oi + 1}`} value={opt}
                          onChange={(e) => { const c = [...q.options]; c[oi] = e.target.value; updateQuestion(qi, "options", c); }}
                          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
                      </div>
                    ))}
                    <p className="text-xs text-slate-500">Radio seleccionada = respuesta correcta</p>
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={() =>
                  setQuizQuestions([...quizQuestions, { text: "", options: ["", "", "", ""], correctIndex: 0 }])}>
                  <Plus size={14} className="mr-1 inline" /> Agregar Pregunta
                </Button>
              </div>
            )}
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
                  <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${item.id === mainFileId ? "bg-indigo-900/20 border border-indigo-700" : "bg-slate-700/30"}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate">{item.title}</p>
                      <p className="text-slate-500 text-[10px]">{item.id}{item.id === mainFileId ? " · principal" : ""}</p>
                    </div>
                    <Link to={`/library/${item.id}`} className="text-indigo-400 hover:text-indigo-300 text-[10px] shrink-0">Ver</Link>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {mainItem && !linkedItems.find((li) => li.id === mainFileId) && (
            <Card>
              <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                <Paperclip size={14} /> Archivo Principal
              </h3>
              <div className="p-2 bg-indigo-900/20 border border-indigo-700 rounded-lg text-xs">
                <p className="text-white truncate">{mainItem.title}</p>
                <p className="text-slate-500 text-[10px]">{mainItem.id} · {mainItem.type}</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
