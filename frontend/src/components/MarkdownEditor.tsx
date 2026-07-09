import { useMemo, useCallback, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { createWikiLinkExtensions } from "../lib/codemirror-wiki";
import { preprocessWikiLinks } from "../lib/markdown";
import type { LibraryItem, LessonUsage, QuizUsage } from "../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bold, Italic, Heading1, Heading2, Link2, BookOpen, FileQuestion, Eye, EyeOff } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  library: LibraryItem[];
  lessons?: LessonUsage[];
  quizzes?: QuizUsage[];
  showPreview: boolean;
  onTogglePreview: () => void;
  onAttachClick: () => void;
  onAttachLessonClick?: () => void;
  onAttachQuizClick?: () => void;
}

export default function MarkdownEditor({ value, onChange, library, lessons = [], quizzes = [], showPreview, onTogglePreview, onAttachClick, onAttachLessonClick, onAttachQuizClick }: Props) {
  const viewRef = useRef<EditorView | null>(null);
  const extensions = useMemo(() => [
    markdown({ base: markdownLanguage }),
    EditorView.theme({
      "&": { backgroundColor: "transparent", height: "100%", fontSize: "14px" },
      ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, monospace" },
      ".cm-content": { padding: "12px", caretColor: "#94a3b8" },
      ".cm-cursor": { borderLeftColor: "#94a3b8" },
      ".cm-selectionBackground": { backgroundColor: "#334155 !important" },
      ".cm-gutters": { backgroundColor: "transparent", border: "none", color: "#475569" },
      ".cm-activeLineGutter": { backgroundColor: "transparent" },
    }),
    ...createWikiLinkExtensions(library, lessons, quizzes),
  ], [library, lessons, quizzes]);

  const handleChange = useCallback((val: string) => onChange(val), [onChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button type="button" onClick={() => {
          const v = viewRef.current;
          if (!v) return;
          const sel = v.state.selection.main;
          const text = v.state.sliceDoc(sel.from, sel.to);
          v.dispatch(v.state.replaceSelection(`**${text || "negrita"}**`));
        }} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Negrita">
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => {
          const v = viewRef.current;
          if (!v) return;
          const sel = v.state.selection.main;
          const text = v.state.sliceDoc(sel.from, sel.to);
          v.dispatch(v.state.replaceSelection(`*${text || "itálica"}*`));
        }} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Itálica">
          <Italic size={16} />
        </button>
        <span className="w-px h-4 bg-slate-600 mx-1" />
        <button type="button" onClick={() => {
          const v = viewRef.current;
          if (!v) return;
          v.dispatch(v.state.replaceSelection("# "));
        }} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Título 1">
          <Heading1 size={16} />
        </button>
        <button type="button" onClick={() => {
          const v = viewRef.current;
          if (!v) return;
          v.dispatch(v.state.replaceSelection("## "));
        }} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Título 2">
          <Heading2 size={16} />
        </button>
        <span className="w-px h-4 bg-slate-600 mx-1" />
        <button type="button" onClick={onAttachClick}
          className="flex items-center gap-1 p-1.5 rounded hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition-colors text-xs" title="Adjuntar archivo">
          <Link2 size={14} /> Adjuntar
        </button>
        {onAttachLessonClick && (
          <button type="button" onClick={onAttachLessonClick}
            className="flex items-center gap-1 p-1.5 rounded hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition-colors text-xs" title="Enlazar lección">
            <BookOpen size={14} /> Lección
          </button>
        )}
        {onAttachQuizClick && (
          <button type="button" onClick={onAttachQuizClick}
            className="flex items-center gap-1 p-1.5 rounded hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition-colors text-xs" title="Enlazar cuestionario">
            <FileQuestion size={14} /> Cuestionario
          </button>
        )}
        <button type="button" onClick={onTogglePreview}
          className="flex items-center gap-1 p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-xs ml-auto" title="Vista previa">
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPreview ? "Editar" : "Vista previa"}
        </button>
      </div>

      <div className="border border-slate-600 rounded-lg overflow-hidden bg-slate-800/50">
        {showPreview ? (
          <div className="p-4 min-h-[300px] prose prose-invert prose-sm max-w-none text-slate-300">
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{preprocessWikiLinks(value, library, lessons, quizzes)}</ReactMarkdown>
            ) : (
              <p className="text-slate-500 italic">Sin contenido</p>
            )}
          </div>
        ) : (
          <CodeMirror
            value={value}
            onChange={handleChange}
            extensions={extensions}
            theme="dark"
            height="400px"
            basicSetup={{ lineNumbers: false, foldGutter: false, indentOnInput: true, highlightActiveLine: false }}
            onCreateEditor={(view) => { viewRef.current = view; }}
          />
        )}
      </div>
    </div>
  );
}


