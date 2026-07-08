import type { LibraryItem, LessonUsage } from "../types";

const wikiLinkRe = /\[\[([\w-]+)\]\]/g;
const headingRe = /^(#{1,3})\s+(.+)$/gm;

export interface TocEntry {
  level: number;
  text: string;
  id: string;
}

export function preprocessWikiLinks(text: string, items: LibraryItem[], lessons: LessonUsage[] = []): string {
  const map: Record<string, LibraryItem> = {};
  for (const item of items) map[item.id] = item;
  const lessonMap: Record<string, LessonUsage> = {};
  for (const lesson of lessons) lessonMap[lesson.lessonId] = lesson;

  return text.replace(wikiLinkRe, (_, id: string) => {
    const item = map[id];
    if (item) return `[${item.title}](/library/${id})`;
    const lesson = lessonMap[id];
    if (lesson) return `[${lesson.lessonTitle}](/courses/${lesson.courseId}/lessons/${id})`;
    return `[${id}](/library/${id})`;
  });
}

export function extractToc(text: string): TocEntry[] {
  const entries: TocEntry[] = [];
  let match: RegExpExecArray | null;
  headingRe.lastIndex = 0;
  while ((match = headingRe.exec(text)) !== null) {
    const level = match[1].length;
    const textContent = match[2].trim();
    const id = textContent.toLowerCase().replace(/[^\wáéíóúñ]+/g, "-").replace(/(^-|-$)/g, "");
    entries.push({ level, text: textContent, id });
  }
  return entries;
}

export function extractWikiRefs(text: string): string[] {
  const ids: string[] = [];
  let match: RegExpExecArray | null;
  wikiLinkRe.lastIndex = 0;
  while ((match = wikiLinkRe.exec(text)) !== null) {
    ids.push(match[1]);
  }
  return [...new Set(ids)];
}

export interface WikiSegment {
  type: "md" | "wiki";
  value: string;
}

// Splits text into markdown chunks and [[id]] wiki-link refs, in order — used
// by lesson/quiz viewers to interleave ReactMarkdown with inline embeds.
export function splitWikiSegments(text: string): WikiSegment[] {
  const parts = text.split(/(\[\[[\w-]+\]\])/g);
  const segments: WikiSegment[] = [];
  for (const part of parts) {
    const m = part.match(/^\[\[([\w-]+)\]\]$/);
    if (m) segments.push({ type: "wiki", value: m[1] });
    else if (part) segments.push({ type: "md", value: part });
  }
  return segments;
}
