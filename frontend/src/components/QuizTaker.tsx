import { useState, useEffect } from "react";
import { api } from "../lib/api";
import type { Quiz, QuizSubmitResponse } from "../types";
import { Card, Button, Badge } from "./ui";
import { CheckCircle, XCircle } from "lucide-react";

interface Props {
  quiz: Quiz;
  canSee: boolean;
  canSubmit: boolean;
  onSubmitted?: (result: QuizSubmitResponse) => void;
}

export default function QuizTaker({ quiz, canSee, canSubmit, onSubmitted }: Props) {
  const [answers, setAnswers] = useState<number[]>(() => new Array(quiz.questions.length).fill(-1));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setAnswers(new Array(quiz.questions.length).fill(-1));
    setSubmitted(false);
    setResult(null);
  }, [quiz.id]);

  const handleSubmit = async () => {
    if (submitting) return;
    if (answers.includes(-1)) { alert("Responde todas las preguntas antes de enviar."); return; }
    setSubmitting(true);
    try {
      const res = await api.submitQuiz(quiz.id, answers);
      setResult(res);
      setSubmitted(true);
      onSubmitted?.(res);
    } catch (err) { alert("Error al enviar quiz: " + (err as Error).message); }
    setSubmitting(false);
  };

  if (!canSee) {
    return <p className="text-sm text-slate-500 italic">El cuestionario está disponible solo para estudiantes autenticados.</p>;
  }

  if (submitted && result) {
    return (
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
          <Badge color="indigo">Calificación: {result.grade}/{result.quizValue}</Badge>
        </div>
        {canSubmit && (
          <Button variant="secondary" onClick={() => { setSubmitted(false); setResult(null); }} className="mt-4">
            Intentar de nuevo
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-white mb-4">Evaluación</h2>
      <div className="space-y-6">
        {quiz.questions.map((q, qi) => (
          <div key={qi}>
            <p className="text-sm font-medium text-white mb-3">{qi + 1}. {q.text}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
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
      {canSubmit && (
        <Button onClick={handleSubmit} disabled={submitting} className="mt-6" variant="success">
          {submitting ? "Enviando..." : "Enviar Respuestas"}
        </Button>
      )}
    </Card>
  );
}
