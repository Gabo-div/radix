import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import type { QuizQuestion } from "@/types";
import { extractWikiRefs } from "@/lib/markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MarkdownEditor from "@/components/MarkdownEditor";
import QuizQuestionsEditor from "@/components/QuizQuestionsEditor";
import FilePickerModal from "@/components/common/FilePickerModal";
import LessonPickerModal from "@/components/common/LessonPickerModal";
import { useCourse } from "@/hooks/useCourses";
import { useLibrary } from "@/hooks/useLibrary";
import { useAllLessons } from "@/hooks/useLessons";
import { useQuiz, useCreateQuiz, useUpdateQuiz } from "@/hooks/useQuizzes";
import { ArrowLeft, Save, Paperclip, BookOpen } from "lucide-react";

export default function QuizEditor() {
  const { courseId, quizId } = useParams<{ courseId: string; quizId?: string }>();
  const isEditing = !!quizId;
  const navigate = useNavigate();

  const { data: course } = useCourse(courseId);
  const { data: library = [] } = useLibrary();
  const { data: allLessons = [] } = useAllLessons();
  const { data: quiz, isLoading: loadingQuiz } = useQuiz(quizId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState(100);
  const [questions, setQuestions] = useState<QuizQuestion[]>([{ text: "", options: ["", "", "", ""], correctIndex: 0 }]);
  const [showPreview, setShowPreview] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showLessonPicker, setShowLessonPicker] = useState(false);

  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title);
      setDescription(quiz.description);
      setValue(quiz.value);
      setQuestions(quiz.questions);
    }
  }, [quiz]);

  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz(quizId ?? "", courseId);
  const saving = createQuiz.isPending || updateQuiz.isPending;

  const wikiRefs = useMemo(() => extractWikiRefs(description), [description]);
  const linkedItems = useMemo(() => library.filter((li) => wikiRefs.includes(li.id)), [wikiRefs, library]);
  const linkedLessons = useMemo(() => allLessons.filter((l) => wikiRefs.includes(l.lessonId)), [wikiRefs, allLessons]);

  const insertWikiLink = (id: string) => {
    setDescription((prev) => prev + `[[${id}]]`);
    setShowFilePicker(false);
    setShowLessonPicker(false);
  };

  const handleSave = () => {
    if (!courseId || !title || !questions[0].text) {
      toast.error("Título y al menos una pregunta son obligatorios.");
      return;
    }

    const onError = (err: unknown) => toast.error("Error: " + (err as Error).message);
    const onSaved = (message: string) => {
      toast.success(message);
      setTimeout(() => navigate(`/courses/${courseId}?tab=quizzes`), 1000);
    };

    if (isEditing && quizId) {
      updateQuiz.mutate({ title, description, value, questions }, {
        onSuccess: () => onSaved("Cuestionario actualizado exitosamente"),
        onError,
      });
    } else {
      createQuiz.mutate({ courseId, title, description, value, questions }, {
        onSuccess: () => onSaved("Cuestionario creado exitosamente"),
        onError,
      });
    }
  };

  if (loadingQuiz) return <p className="text-muted-foreground">Cargando cuestionario...</p>;

  return (
    <div className="space-y-6">
      {showFilePicker && <FilePickerModal onSelect={insertWikiLink} onClose={() => setShowFilePicker(false)} />}
      {showLessonPicker && (
        <LessonPickerModal onSelect={insertWikiLink} onClose={() => setShowLessonPicker(false)} />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/courses/${courseId}?tab=quizzes`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Volver
          </Link>
          <span className="text-border">/</span>
          <span className="text-sm text-muted-foreground">{course?.course.title || "Cargando..."}</span>
          <span className="text-border">/</span>
          <h1 className="text-lg font-bold text-foreground">{isEditing ? "Editar Cuestionario" : "Nuevo Cuestionario"}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving} variant={saving ? "secondary" : "success"}>
          <Save size={16} />
          {saving ? "Guardando..." : isEditing ? "Actualizar Cuestionario" : "Guardar Cuestionario"}
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="flex gap-3">
            <Input type="text" placeholder="Título del cuestionario" value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 h-auto rounded-xl px-5 py-4 text-xl font-bold" required />
            <div className="flex flex-col items-center justify-center bg-secondary border border-input rounded-xl px-4">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Valor</label>
              <Input type="number" min={1} value={value}
                onChange={(e) => setValue(Number(e.target.value) || 0)}
                className="w-16 h-auto border-0 bg-transparent px-0 text-center text-lg font-bold focus-visible:ring-0" />
            </div>
          </div>

          <Card>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Descripción (opcional)</h2>
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
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Preguntas</h2>
            <QuizQuestionsEditor questions={questions} onChange={setQuestions} />
          </Card>
        </div>

        <div className="w-64 shrink-0 hidden lg:block space-y-6 sticky top-0 self-start">
          {linkedItems.length > 0 && (
            <Card>
              <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <Paperclip size={14} /> Archivos Enlazados
              </h3>
              <div className="space-y-2">
                {linkedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg text-xs bg-secondary/50">
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
              <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <BookOpen size={14} /> Lecciones Enlazadas
              </h3>
              <div className="space-y-2">
                {linkedLessons.map((lesson) => (
                  <div key={lesson.lessonId} className="flex items-center gap-2 p-2 rounded-lg text-xs bg-secondary/50">
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
