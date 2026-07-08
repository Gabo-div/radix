import type { QuizQuestion } from "../types";
import { Button } from "./ui";
import { Plus } from "lucide-react";

interface Props {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

export default function QuizQuestionsEditor({ questions, onChange }: Props) {
  const updateQuestion = (idx: number, field: string, val: any) => {
    const copy = [...questions];
    (copy[idx] as any)[field] = val;
    onChange(copy);
  };

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={qi} className="p-3 bg-slate-700/30 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Pregunta {qi + 1}</span>
            {questions.length > 1 && (
              <button type="button" onClick={() => onChange(questions.filter((_, i) => i !== qi))}
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
        onChange([...questions, { text: "", options: ["", "", "", ""], correctIndex: 0 }])}>
        <Plus size={14} className="mr-1 inline" /> Agregar Pregunta
      </Button>
    </div>
  );
}
