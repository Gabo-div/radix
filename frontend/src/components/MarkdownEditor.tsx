import { useMemo, useCallback, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
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

// Token-matched editor theme — CodeMirror can't read CSS vars from Tailwind
// classes, so the app palette (index.css :root) is mirrored here by hand.
const radixEditorTheme = EditorView.theme(
  {
    "&": { backgroundColor: "transparent", height: "100%", fontSize: "14px", color: "hsl(0 0% 95% / 0.88)" },
    ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, monospace" },
    ".cm-content": { padding: "12px", caretColor: "hsl(0 0% 95%)" },
    ".cm-cursor": { borderLeftColor: "hsl(0 0% 95%)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": { backgroundColor: "hsl(240 5% 24%)" },
    ".cm-activeLine": { backgroundColor: "transparent" },
    ".cm-gutters": { backgroundColor: "transparent", border: "none", color: "hsl(240 4% 40%)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent" },
  },
  { dark: true }
);

const radixMarkdownHighlight = HighlightStyle.define([
  { tag: tags.heading, color: "hsl(0 0% 98%)", fontWeight: "600" },
  { tag: tags.strong, color: "hsl(0 0% 98%)", fontWeight: "600" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.link, color: "hsl(234 89% 74%)" },
  { tag: tags.url, color: "hsl(234 89% 74%)" },
  { tag: tags.monospace, color: "hsl(158 64% 52%)" },
  { tag: tags.quote, color: "hsl(240 4% 58%)" },
  { tag: tags.meta, color: "hsl(240 4% 58%)" },
  { tag: tags.processingInstruction, color: "hsl(240 4% 58%)" },
]);

export default function MarkdownEditor({ value, onChange, library, lessons = [], quizzes = [], showPreview, onTogglePreview, onAttachClick, onAttachLessonClick, onAttachQuizClick }: Props) {
  const viewRef = useRef<EditorView | null>(null);
  const extensions = useMemo(() => [
    markdown({ base: markdownLanguage }),
    radixEditorTheme,
    syntaxHighlighting(radixMarkdownHighlight),
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
        }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Negrita">
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => {
          const v = viewRef.current;
          if (!v) return;
          const sel = v.state.selection.main;
          const text = v.state.sliceDoc(sel.from, sel.to);
          v.dispatch(v.state.replaceSelection(`*${text || "itálica"}*`));
        }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Itálica">
          <Italic size={16} />
        </button>
        <span className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={() => {
          const v = viewRef.current;
          if (!v) return;
          v.dispatch(v.state.replaceSelection("# "));
        }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Título 1">
          <Heading1 size={16} />
        </button>
        <button type="button" onClick={() => {
          const v = viewRef.current;
          if (!v) return;
          v.dispatch(v.state.replaceSelection("## "));
        }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Título 2">
          <Heading2 size={16} />
        </button>
        <span className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={onAttachClick}
          className="flex items-center gap-1 p-1.5 rounded hover:bg-secondary text-primary hover:text-primary/80 transition-colors text-xs" title="Adjuntar archivo">
          <Link2 size={14} /> Adjuntar
        </button>
        {onAttachLessonClick && (
          <button type="button" onClick={onAttachLessonClick}
            className="flex items-center gap-1 p-1.5 rounded hover:bg-secondary text-primary hover:text-primary/80 transition-colors text-xs" title="Enlazar lección">
            <BookOpen size={14} /> Lección
          </button>
        )}
        {onAttachQuizClick && (
          <button type="button" onClick={onAttachQuizClick}
            className="flex items-center gap-1 p-1.5 rounded hover:bg-secondary text-primary hover:text-primary/80 transition-colors text-xs" title="Enlazar cuestionario">
            <FileQuestion size={14} /> Cuestionario
          </button>
        )}
        <button type="button" onClick={onTogglePreview}
          className="flex items-center gap-1 p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-xs ml-auto" title="Vista previa">
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPreview ? "Editar" : "Vista previa"}
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card/50">
        {showPreview ? (
          <div className="p-4 min-h-[300px] prose prose-invert prose-sm max-w-none text-foreground/80">
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{preprocessWikiLinks(value, library, lessons, quizzes)}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">Sin contenido</p>
            )}
          </div>
        ) : (
          <CodeMirror
            value={value}
            onChange={handleChange}
            extensions={extensions}
            theme="none"
            height="400px"
            basicSetup={{ lineNumbers: false, foldGutter: false, indentOnInput: true, highlightActiveLine: false }}
            onCreateEditor={(view) => { viewRef.current = view; }}
          />
        )}
      </div>
    </div>
  );
}


