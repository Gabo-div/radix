import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Quiz, QuizSubmitResponse } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubmitQuiz } from "@/hooks/useQuizzes";
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

  const submitQuiz = useSubmitQuiz(quiz.id);

  useEffect(() => {
    setAnswers(new Array(quiz.questions.length).fill(-1));
    setSubmitted(false);
    setResult(null);
  }, [quiz.id]);

  const handleSubmit = () => {
    if (submitQuiz.isPending) return;
    if (answers.includes(-1)) { toast.error("Responde todas las preguntas antes de enviar."); return; }
    submitQuiz.mutate(answers, {
      onSuccess: (res) => {
        setResult(res);
        setSubmitted(true);
        onSubmitted?.(res);
      },
      onError: (err) => toast.error("Error al enviar quiz: " + (err as Error).message),
    });
  };

  if (!canSee) {
    return <p className="text-sm text-muted-foreground italic">El cuestionario está disponible solo para estudiantes autenticados.</p>;
  }

  if (submitted && result) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-foreground mb-4">Resultado</h2>
        <div className="flex items-center gap-3 mb-4">
          {result.passed ? <CheckCircle size={32} className="text-success" /> : <XCircle size={32} className="text-destructive" />}
          <div>
            <p className="text-xl font-bold text-foreground">{result.score}%</p>
            <p className="text-sm text-muted-foreground">{result.correct}/{result.total} correctas</p>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <Badge variant={result.passed ? "success" : "destructive"}>{result.passed ? "Aprobado" : "Reprobado"}</Badge>
          <Badge>Calificación: {result.grade}/{result.quizValue}</Badge>
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
      <h2 className="text-lg font-semibold text-foreground mb-4">Evaluación</h2>
      <div className="space-y-6">
        {quiz.questions.map((q, qi) => (
          <div key={qi}>
            <p className="text-sm font-medium text-foreground mb-3">{qi + 1}. {q.text}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <label key={oi}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${answers[qi] === oi
                    ? "bg-primary/10 border border-primary"
                    : "bg-secondary/30 border border-transparent hover:bg-secondary/50"
                    }`}>
                  <input type="radio" name={`q-${qi}`} checked={answers[qi] === oi}
                    onChange={() => { const c = [...answers]; c[qi] = oi; setAnswers(c); }}
                    className="accent-primary" />
                  <span className="text-sm text-foreground/90">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      {canSubmit && (
        <Button onClick={handleSubmit} disabled={submitQuiz.isPending} className="mt-6" variant="success">
          {submitQuiz.isPending ? "Enviando..." : "Enviar Respuestas"}
        </Button>
      )}
    </Card>
  );
}
