import { useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { canCreateCourse } from "../lib/rbac";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useCourse, useCourseResources, useEnrolledStudents, useEnrollStudent, useUnenrollStudent } from "@/hooks/useCourses";
import { useCourseQuizzes } from "@/hooks/useQuizzes";
import StudentPickerModal from "../components/common/StudentPickerModal";
import Forum from "../components/Forum";
import {
  ArrowLeft, BookOpen, FileQuestion, Users, Paperclip, MessageSquare, PlusCircle, Play, Edit, Lock, X,
  FileVideo, FileAudio, FileImage, FileText, File,
} from "lucide-react";

type Tab = "lessons" | "quizzes" | "students" | "resources" | "forum";

const typeIcon: Record<string, typeof FileVideo> = {
  video: FileVideo, audio: FileAudio, image: FileImage,
  pdf: FileText, text: FileText, document: File,
};

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [showStudentPicker, setShowStudentPicker] = useState(false);

  const tabParam = searchParams.get("tab");
  const tab: Tab =
    tabParam === "quizzes" || tabParam === "students" || tabParam === "resources" || tabParam === "forum"
      ? tabParam
      : "lessons";
  const setTab = (t: string) => setSearchParams(t === "lessons" ? {} : { tab: t });

  const canEdit = !!currentUser && canCreateCourse(currentUser.role);

  const { data: course, error } = useCourse(courseId);
  const { data: quizzes = [] } = useCourseQuizzes(courseId);
  const { data: resources = [] } = useCourseResources(courseId);
  const { data: students = [] } = useEnrolledStudents(courseId, tab === "students" && canEdit);

  const enrollStudent = useEnrollStudent(courseId!);
  const unenrollStudent = useUnenrollStudent(courseId!);

  if (error) {
    return (
      <div className="space-y-6">
        <Link to="/courses" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Volver a cursos
        </Link>
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <Lock size={32} className="text-muted-foreground" />
          <p className="text-foreground/90">No estás inscrito en este curso.</p>
        </Card>
      </div>
    );
  }

  if (!course) return <p className="text-muted-foreground">Cargando...</p>;

  const handleEnroll = (userId: string) => {
    enrollStudent.mutate(userId, { onError: (err) => toast.error((err as Error).message) });
  };

  const handleUnenroll = (userId: string) => {
    unenrollStudent.mutate(userId, { onError: (err) => toast.error((err as Error).message) });
  };

  return (
    <div className="space-y-6">
      {showStudentPicker && courseId && (
        <StudentPickerModal courseId={courseId} onSelect={handleEnroll} onClose={() => setShowStudentPicker(false)} />
      )}

      <Link to="/courses" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} />
        Volver a cursos
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{course.course.title}</h1>
          <p className="text-muted-foreground mt-1">{course.course.description}</p>
        </div>
        {canEdit && (
          tab === "lessons" ? (
            <Link to={`/courses/${courseId}/lessons/new`}>
              <Button><PlusCircle size={16} /> Nueva Lección</Button>
            </Link>
          ) : tab === "quizzes" ? (
            <Link to={`/courses/${courseId}/quizzes/new`}>
              <Button><PlusCircle size={16} /> Nuevo Cuestionario</Button>
            </Link>
          ) : tab === "students" ? (
            <Button onClick={() => setShowStudentPicker(true)}>
              <PlusCircle size={16} /> Agregar Estudiante
            </Button>
          ) : null
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="lessons"><BookOpen size={14} /> Lecciones</TabsTrigger>
          <TabsTrigger value="quizzes"><FileQuestion size={14} /> Cuestionarios</TabsTrigger>
          <TabsTrigger value="resources"><Paperclip size={14} /> Recursos</TabsTrigger>
          <TabsTrigger value="forum"><MessageSquare size={14} /> Foro</TabsTrigger>
          {canEdit && <TabsTrigger value="students"><Users size={14} /> Estudiantes</TabsTrigger>}
        </TabsList>

        <TabsContent value="lessons">
          <div className="flex flex-col space-y-3">
            {course.lessons.map((lesson, idx) => (
              <div key={lesson.id} className="flex items-center gap-2">
                <Link to={`/courses/${courseId}/lessons/${lesson.id}`} className="flex-1">
                  <Card className="flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center text-xs text-primary font-semibold">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">{lesson.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {lesson.quizId ? "Con evaluación" : "Solo texto"}
                        </p>
                      </div>
                    </div>
                    <Play size={16} className="text-muted-foreground" />
                  </Card>
                </Link>
                {canEdit && (
                  <Link to={`/courses/${courseId}/lessons/${lesson.id}/edit`}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                    title="Editar lección">
                    <Edit size={16} />
                  </Link>
                )}
              </div>
            ))}
            {course.lessons.length === 0 && (
              <p className="text-muted-foreground text-sm">Este curso aún no tiene lecciones.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quizzes">
          <div className="flex flex-col space-y-3">
            {quizzes.map((quiz, idx) => (
              <div key={quiz.id} className="flex items-center gap-2">
                <Link to={`/courses/${courseId}/quizzes/${quiz.id}`} className="flex-1">
                  <Card className="flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center text-xs text-primary font-semibold">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">{quiz.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {quiz.lessonId ? "Vinculado a una lección" : "Independiente"} · {quiz.questions.length} preguntas · Vale {quiz.value} pts
                        </p>
                      </div>
                    </div>
                    <Play size={16} className="text-muted-foreground" />
                  </Card>
                </Link>
                {canEdit && (
                  <Link to={`/courses/${courseId}/quizzes/${quiz.id}/edit`}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                    title="Editar cuestionario">
                    <Edit size={16} />
                  </Link>
                )}
              </div>
            ))}
            {quizzes.length === 0 && (
              <p className="text-muted-foreground text-sm">Este curso aún no tiene cuestionarios.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {resources.map((item) => {
              const Icon = typeIcon[item.type] || File;
              return (
                <Link key={item.id} to={`/library/${item.id}`}>
                  <Card className="flex items-start gap-4 h-full hover:border-primary/50 transition-colors cursor-pointer">
                    <Icon size={28} className="text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground truncate">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge>{item.type}</Badge>
                        <Badge>{item.category}</Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
            {resources.length === 0 && (
              <p className="text-muted-foreground text-sm col-span-full">Ninguna lección o cuestionario de este curso enlaza archivos todavía.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="forum">
          {courseId && <Forum courseId={courseId} canPost={!!currentUser && currentUser.role !== "guest"} />}
        </TabsContent>

        {canEdit && (
          <TabsContent value="students">
            <Card>
              {students.length === 0 ? (
                <p className="text-muted-foreground text-sm">Ningún estudiante inscrito todavía.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Puntos</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-foreground">{s.name}</TableCell>
                        <TableCell className="text-muted-foreground">{s.email}</TableCell>
                        <TableCell className="text-foreground/90">{s.points}</TableCell>
                        <TableCell className="text-right">
                          <button onClick={() => handleUnenroll(s.id)}
                            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"
                            title="Quitar del curso">
                            <X size={14} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
