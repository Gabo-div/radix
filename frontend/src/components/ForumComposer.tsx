import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLibrary } from "@/hooks/useLibrary";
import { useAllLessons } from "@/hooks/useLessons";
import { useCourseQuizzes } from "@/hooks/useQuizzes";
import MarkdownEditor from "./MarkdownEditor";
import FilePickerModal from "./common/FilePickerModal";
import LessonPickerModal from "./common/LessonPickerModal";
import QuizPickerModal from "./common/QuizPickerModal";

interface Props {
  courseId: string;
  placeholder: string;
  submitLabel: string;
  requireTitle?: boolean;
  onSubmit: (data: { title?: string; body: string }) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
}

// Shared compose box for both a new top-level forum post and a reply — same
// MarkdownEditor used by LessonEditor/QuizEditor, so [[id]] links to library
// items, lessons, and quizzes highlight/preview/insert-via-picker exactly
// like they do there. Only a thread-starting post takes a title
// (requireTitle) — replies don't.
export default function ForumComposer({ courseId, placeholder, submitLabel, requireTitle, onSubmit, onCancel, autoFocus }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const [showQuizPicker, setShowQuizPicker] = useState(false);

  const { data: library = [] } = useLibrary();
  const { data: lessons = [] } = useAllLessons();
  const { data: courseQuizzes = [] } = useCourseQuizzes(courseId);
  const quizzes = useMemo(
    () => courseQuizzes.map((q) => ({ quizId: q.id, courseId: q.courseId, quizTitle: q.title, courseTitle: "" })),
    [courseQuizzes]
  );

  const insertLink = (id: string) => {
    setBody((prev) => prev + `[[${id}]]`);
    setShowFilePicker(false);
    setShowLessonPicker(false);
    setShowQuizPicker(false);
  };

  const submit = async () => {
    if (!body.trim() || busy) return;
    if (requireTitle && !title.trim()) return;
    setBusy(true);
    try {
      await onSubmit(requireTitle ? { title, body } : { body });
      setTitle("");
      setBody("");
    } catch (err) {
      toast.error((err as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="space-y-2">
      {showFilePicker && <FilePickerModal onSelect={insertLink} onClose={() => setShowFilePicker(false)} />}
      {showLessonPicker && <LessonPickerModal onSelect={insertLink} onClose={() => setShowLessonPicker(false)} />}
      {showQuizPicker && <QuizPickerModal courseId={courseId} onSelect={insertLink} onClose={() => setShowQuizPicker(false)} />}

      {requireTitle && (
        <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus={autoFocus}
          placeholder="Título del post" className="font-medium" />
      )}

      <MarkdownEditor
        value={body}
        onChange={setBody}
        library={library}
        lessons={lessons}
        quizzes={quizzes}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        onAttachClick={() => setShowFilePicker(true)}
        onAttachLessonClick={() => setShowLessonPicker(true)}
        onAttachQuizClick={() => setShowQuizPicker(true)}
      />
      {!body && <p className="text-xs text-muted-foreground -mt-1">{placeholder}</p>}

      <div className="flex justify-end gap-2">
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancelar</Button>}
        <Button onClick={submit} disabled={busy}>{busy ? "Publicando..." : submitLabel}</Button>
      </div>
    </div>
  );
}
