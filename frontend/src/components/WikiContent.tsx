import { useMemo } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { splitWikiSegments } from "../lib/markdown";
import type { LibraryItem, LessonUsage, QuizUsage } from "../types";
import InlineMedia from "./InlineMedia";
import InlineLesson from "./InlineLesson";
import InlineQuiz from "./InlineQuiz";

interface Props {
  text: string;
  itemMap: Record<string, LibraryItem>;
  lessonMap: Record<string, LessonUsage>;
  quizMap?: Record<string, QuizUsage>;
}

const headingId = (children: ReactNode) =>
  String(children).toLowerCase().replace(/[^\wáéíóúñ]+/g, "-").replace(/(^-|-$)/g, "");

// Renders markdown interleaved with [[id]] wiki-link embeds (library items as
// InlineMedia, lessons as InlineLesson) — shared by LessonViewer and QuizViewer.
export default function WikiContent({ text, itemMap, lessonMap, quizMap = {} }: Props) {
  const segments = useMemo(() => splitWikiSegments(text), [text]);

  return (
    <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
      {segments.map((seg, i) =>
        seg.type === "wiki" ? (
          (() => {
            const item = itemMap[seg.value];
            if (item) return <InlineMedia key={i} item={item} />;
            const lesson = lessonMap[seg.value];
            if (lesson) return <InlineLesson key={i} lesson={lesson} />;
            const quiz = quizMap[seg.value];
            if (quiz) return <InlineQuiz key={i} quiz={quiz} />;
            return (
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
              h1: ({ children, ...props }) => <h1 id={headingId(children)} className="text-xl font-bold text-white mt-6 mb-3" {...props}>{children}</h1>,
              h2: ({ children, ...props }) => <h2 id={headingId(children)} className="text-lg font-semibold text-white mt-5 mb-2" {...props}>{children}</h2>,
              h3: ({ children, ...props }) => <h3 id={headingId(children)} className="text-base font-medium text-white mt-4 mb-2" {...props}>{children}</h3>,
            }}
          >
            {seg.value}
          </ReactMarkdown>
        )
      )}
    </div>
  );
}
