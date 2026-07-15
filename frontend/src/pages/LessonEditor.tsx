import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { extractWikiRefs } from "../lib/markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCourse } from "@/hooks/useCourses";
import { useLibrary } from "@/hooks/useLibrary";
import { useAllLessons, useLesson, useAddLesson, useUpdateLesson } from "@/hooks/useLessons";
import MarkdownEditor from "../components/MarkdownEditor";
import QuizQuestionsEditor from "../components/QuizQuestionsEditor";
import FilePickerModal from "../components/common/FilePickerModal";
import LessonPickerModal from "../components/common/LessonPickerModal";
import { ArrowLeft, Save, FileQuestion, Paperclip, BookOpen } from "lucide-react";

export default function LessonEditor() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const isEditing = !!lessonId;
  const navigate = useNavigate();

  const { data: course } = useCourse(courseId);
  const { data: library = [] } = useLibrary();
  const { data: allLessons = [] } = useAllLessons();
  const { data: lessonData, isPending: lessonPending } = useLesson(courseId, lessonId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const [showQuizSection, setShowQuizSection] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([{ text: "", options: ["", "", "", ""], correctIndex: 0 }]);

  useEffect(() => {
    if (lessonData) {
      setTitle(lessonData.lesson.title);
      setContent(lessonData.lesson.contentText);
      if (lessonData.quiz) {
        setQuizQuestions(lessonData.quiz.questions);
        setShowQuizSection(true);
      }
    }
  }, [lessonData]);

  const addLesson = useAddLesson(courseId!);
  const updateLesson = useUpdateLesson(lessonId!, courseId!);
  const saving = addLesson.isPending || updateLesson.isPending;
  const loadingLesson = isEditing && lessonPending;

  const wikiRefs = useMemo(() => extractWikiRefs(content), [content]);
  const linkedItems = useMemo(() => library.filter((li) => wikiRefs.includes(li.id)), [wikiRefs, library]);
  const linkedLessons = useMemo(
    () => allLessons.filter((l) => wikiRefs.includes(l.lessonId) && l.lessonId !== lessonId),
    [wikiRefs, allLessons, lessonId]
  );

  const insertWikiLink = (id: string) => {
    setContent((prev) => prev + `[[${id}]]`);
    setShowFilePicker(false);
    setShowLessonPicker(false);
  };

  const handleSave = async () => {
    if (!courseId || !title || !content) { toast.error("Título y contenido son obligatorios."); return; }
    try {
      if (isEditing && lessonId) {
        await updateLesson.mutateAsync({ title, contentText: content });
        toast.success("Lección actualizada exitosamente");
        setTimeout(() => navigate(`/courses/${courseId}`), 1000);
      } else {
        const lesson = await addLesson.mutateAsync({ title, contentText: content });
        if (showQuizSection && quizQuestions[0].text) {
          await api.createQuiz({ lessonId: lesson.id, title: `Evaluación: ${title}`, questions: quizQuestions });
        }
        toast.success("Lección creada exitosamente");
        setTimeout(() => navigate(`/courses/${courseId}`), 1000);
      }
    } catch (err) {
      toast.error("Error: " + (err as Error).message);
    }
  };

  if (loadingLesson) return <p className="text-muted-foreground">Cargando lección...</p>;

  return (
    <div className="space-y-6">
      {showFilePicker && <FilePickerModal onSelect={insertWikiLink} onClose={() => setShowFilePicker(false)} />}
      {showLessonPicker && (
        <LessonPickerModal currentLessonId={lessonId} onSelect={insertWikiLink} onClose={() => setShowLessonPicker(false)} />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/courses/${courseId}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Volver
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-foreground/90">{course?.course.title || "Cargando..."}</span>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-bold text-foreground">{isEditing ? "Editar Lección" : "Nueva Lección"}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving} variant={saving ? "secondary" : "success"}>
          <Save size={16} />
          {saving ? "Guardando..." : isEditing ? "Actualizar Lección" : "Guardar Lección"}
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <Input type="text" placeholder="Título de la lección" value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-auto px-5 py-4 text-xl font-bold" required />

          <Card>
            <h2 className="text-sm font-medium text-foreground/90 mb-4">Contenido</h2>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              library={library}
              lessons={allLessons}
              showPreview={showPreview}
              onTogglePreview={() => setShowPreview(!showPreview)}
              onAttachClick={() => setShowFilePicker(true)}
              onAttachLessonClick={() => setShowLessonPicker(true)}
            />
          </Card>

          <Card>
            <button type="button" onClick={() => setShowQuizSection(!showQuizSection)}
              className="flex items-center gap-1.5 text-sm text-foreground/90 hover:text-foreground transition-colors">
              <FileQuestion size={16} />
              {showQuizSection ? "Ocultar" : "Agregar"} cuestionario
            </button>

            {showQuizSection && (
              <div className="mt-4">
                <QuizQuestionsEditor questions={quizQuestions} onChange={setQuizQuestions} />
              </div>
            )}
          </Card>
        </div>

        <div className="w-64 shrink-0 hidden lg:block space-y-6 sticky top-0 self-start">
          {linkedItems.length > 0 && (
            <Card>
              <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground/90 uppercase tracking-wider mb-3">
                <Paperclip size={14} /> Archivos Enlazados
              </h3>
              <div className="space-y-2">
                {linkedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg text-xs bg-secondary/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">{item.title}</p>
                      <p className="text-muted-foreground text-[10px]">{item.id}</p>
                    </div>
                    <Link to={`/library/${item.id}`} className="text-primary hover:text-primary/80 text-[10px] shrink-0">Ver</Link>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {linkedLessons.length > 0 && (
            <Card>
              <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground/90 uppercase tracking-wider mb-3">
                <BookOpen size={14} /> Lecciones Enlazadas
              </h3>
              <div className="space-y-2">
                {linkedLessons.map((lesson) => (
                  <div key={lesson.lessonId} className="flex items-center gap-2 p-2 rounded-lg text-xs bg-secondary/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">{lesson.lessonTitle}</p>
                      <p className="text-muted-foreground text-[10px]">{lesson.courseTitle}</p>
                    </div>
                    <Link to={`/courses/${lesson.courseId}/lessons/${lesson.lessonId}`} className="text-primary hover:text-primary/80 text-[10px] shrink-0">Ver</Link>
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
