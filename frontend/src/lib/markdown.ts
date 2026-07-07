import type { LibraryItem } from "../types";

const wikiLinkRe = /\[\[([\w-]+)\]\]/g;
const headingRe = /^(#{1,3})\s+(.+)$/gm;

export interface TocEntry {
  level: number;
  text: string;
  id: string;
}

export function preprocessWikiLinks(text: string, items: LibraryItem[]): string {
  const map: Record<string, LibraryItem> = {};
  for (const item of items) map[item.id] = item;

  return text.replace(wikiLinkRe, (_, id: string) => {
    const item = map[id];
    const title = item?.title || id;
    return `[${title}](/library/${id})`;
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
