import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { canTakeQuiz, canSeeQuiz, canEdit } from "../lib/rbac";
import { extractToc, extractWikiRefs } from "../lib/markdown";
import type { TocEntry } from "../lib/markdown";
import type { LibraryItem } from "../types";
import { Card, Button, Badge } from "../components/ui";
import LessonSidebar from "../components/layout/LessonSidebar";
import InlineMedia from "../components/InlineMedia";
import { ArrowLeft, Edit, CheckCircle, XCircle } from "lucide-react";

const wikiLinkRe = /\[\[([\w-]+)\]\]/g;

function renderContent(text: string, items: LibraryItem[]) {
  const parts = text.split(/(\[\[[\w-]+\]\])/g);
  const segments: { type: "md" | "wiki"; value: string }[] = [];
  for (const part of parts) {
    const m = part.match(/^\[\[([\w-]+)\]\]$/);
    if (m) segments.push({ type: "wiki", value: m[1] });
    else if (part) segments.push({ type: "md", value: part });
  }
  return segments;
}

export default function LessonViewer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<{ lesson: any; quiz?: any } | null>(null);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; earnedXP: number; correct: number; total: number; passed: boolean; totalPoints: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (courseId && lessonId) {
      api.getLesson(courseId, lessonId).then((d) => {
        setData(d);
        if (d.quiz) setAnswers(new Array(d.quiz.questions.length).fill(-1));
      }).catch(() => { });
      api.getLibrary().then(setLibrary).catch(() => { });
    }
  };

  useEffect(() => { load(); setSubmitted(false); setResult(null); }, [courseId, lessonId]);

  const handleSubmitQuiz = async () => {
    if (!data?.quiz || submitting) return;
    if (answers.includes(-1)) { alert("Responde todas las preguntas antes de enviar."); return; }
    setSubmitting(true);
    try {
      const res = await api.submitQuiz(data.quiz.id, answers);
      setResult(res);
      setSubmitted(true);
      if (currentUser) currentUser.points = res.totalPoints;
    } catch (err) { alert("Error al enviar quiz: " + (err as Error).message); }
    setSubmitting(false);
  };

  const isStudent = currentUser && canTakeQuiz(currentUser.role);
  const showQuiz = currentUser && canSeeQuiz(currentUser.role);
  const isAdmin = currentUser && canEdit(currentUser.role);

  const lessonText = data?.lesson?.contentText || "";
  const wikiRefs = extractWikiRefs(lessonText);
  const linkedItems = library.filter((li) => wikiRefs.includes(li.id));
  const toc: TocEntry[] = extractToc(lessonText);
  const segments = useMemo(() => renderContent(lessonText, library), [lessonText, library]);

  const itemMap = useMemo(() => {
    const m: Record<string, LibraryItem> = {};
    for (const item of library) m[item.id] = item;
    return m;
  }, [library]);

  if (!data) return <p className="text-slate-400">Cargando lección...</p>;

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <Link to={`/courses/${courseId}`} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Volver al curso
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white" id="top">{data.lesson.title}</h1>
          {isAdmin && (
            <Link to={`/courses/${courseId}/lessons/${lessonId}/edit`}>
              <Button variant="secondary">
                <Edit size={14} className="mr-1 inline" /> Editar
              </Button>
            </Link>
          )}
        </div>

        <div className="flex w-full gap-4">
          <div className="flex flex-col flex-1 gap-4">
            <Card>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                {segments.map((seg, i) =>
                  seg.type === "wiki" ? (
                    (() => {
                      const item = itemMap[seg.value];
                      return item ? (
                        <InlineMedia key={i} item={item} />
                      ) : (
                        <span key={i} className="text-red-400 text-sm bg-red-900/20 px-1 rounded">[[{seg.value} no encontrado]]</span>
                      );
                    })()
                  ) : (
                    <ReactMarkdown
                      key={i}
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children }) => {
                          if (href?.startsWith("/library/")) {
                            return <Link to={href} className="text-indigo-400 hover:text-indigo-300 underline">{children}</Link>;
                          }
                          return <a href={href} className="text-indigo-400 hover:text-indigo-300 underline">{children}</a>;
                        },
                        h1: ({ children, ...props }) => {
                          const text = String(children);
                          const id = text.toLowerCase().replace(/[^\wáéíóúñ]+/g, "-").replace(/(^-|-$)/g, "");
                          return <h1 id={id} className="text-xl font-bold text-white mt-6 mb-3" {...props}>{children}</h1>;
                        },
                        h2: ({ children, ...props }) => {
                          const text = String(children);
                          const id = text.toLowerCase().replace(/[^\wáéíóúñ]+/g, "-").replace(/(^-|-$)/g, "");
                          return <h2 id={id} className="text-lg font-semibold text-white mt-5 mb-2" {...props}>{children}</h2>;
                        },
                        h3: ({ children, ...props }) => {
                          const text = String(children);
                          const id = text.toLowerCase().replace(/[^\wáéíóúñ]+/g, "-").replace(/(^-|-$)/g, "");
                          return <h3 id={id} className="text-base font-medium text-white mt-4 mb-2" {...props}>{children}</h3>;
                        },
                      }}
                    >
                      {seg.value}
                    </ReactMarkdown>
                  )
                )}
              </div>
            </Card>

            {data.quiz && showQuiz && !submitted && (
              <Card>
                <h2 className="text-lg font-semibold text-white mb-4">Evaluación</h2>
                <div className="space-y-6">
                  {data.quiz.questions.map((q: any, qi: number) => (
                    <div key={qi}>
                      <p className="text-sm font-medium text-white mb-3">{qi + 1}. {q.text}</p>
                      <div className="space-y-2">
                        {q.options.map((opt: string, oi: number) => (
                          <label key={oi}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${answers[qi] === oi
                              ? "bg-indigo-900/30 border border-indigo-600"
                              : "bg-slate-700/30 border border-transparent hover:bg-slate-700/50"
                              }`}>
                            <input type="radio" name={`q-${qi}`} checked={answers[qi] === oi}
                              onChange={() => { const c = [...answers]; c[qi] = oi; setAnswers(c); }}
                              className="accent-indigo-500" />
                            <span className="text-sm text-slate-200">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {isStudent && (
                  <Button onClick={handleSubmitQuiz} disabled={submitting} className="mt-6" variant="success">
                    {submitting ? "Enviando..." : "Enviar Respuestas"}
                  </Button>
                )}
              </Card>
            )}

            {data.quiz && showQuiz && submitted && result && (
              <Card>
                <h2 className="text-lg font-semibold text-white mb-4">Resultado</h2>
                <div className="flex items-center gap-3 mb-4">
                  {result.passed ? <CheckCircle size={32} className="text-emerald-400" /> : <XCircle size={32} className="text-red-400" />}
                  <div>
                    <p className="text-xl font-bold text-white">{result.score}%</p>
                    <p className="text-sm text-slate-400">{result.correct}/{result.total} correctas</p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <Badge color={result.passed ? "emerald" : "red"}>{result.passed ? "Aprobado" : "Reprobado"}</Badge>
                  <Badge color="indigo">+{result.earnedXP} XP</Badge>
                </div>
                {isStudent && (
                  <Button variant="secondary" onClick={() => { setSubmitted(false); setResult(null); }} className="mt-4">
                    Intentar de nuevo
                  </Button>
                )}
              </Card>
            )}

            {data.quiz && !showQuiz && (
              <p className="text-sm text-slate-500 italic">El cuestionario está disponible solo para estudiantes autenticados.</p>
            )}
          </div>

          <div className="min-w-64 shrink-0 hidden lg:block">
            <LessonSidebar toc={toc} linkedItems={linkedItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
