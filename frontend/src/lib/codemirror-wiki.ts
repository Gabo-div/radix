import { ViewPlugin, Decoration, hoverTooltip } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import type { LibraryItem } from "../types";
import { getToken } from "./api";

export function createWikiLinkExtensions(items: LibraryItem[]): Extension[] {
  const map: Record<string, LibraryItem> = {};
  for (const item of items) map[item.id] = item;
  const token = getToken();

  const wikiLinkPlugin = ViewPlugin.fromClass(
    class {
      decorations: any;
      constructor(view: { state: { doc: { toString: () => string } } }) {
        this.decorations = this.build(view);
      }
      update(update: { docChanged: boolean; view: { state: { doc: { toString: () => string } } } }) {
        if (update.docChanged) this.decorations = this.build(update.view);
      }
      build(view: { state: { doc: { toString: () => string } } }) {
        const text = view.state.doc.toString();
        const builder = new RangeSetBuilder<any>();
        const re = /\[\[([\w-]+)\]\]/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
          builder.add(m.index, m.index + m[0].length, Decoration.mark({ class: "cm-wiki-link" }));
        }
        return builder.finish();
      }
    },
    { decorations: (v: any) => v.decorations }
  );

  const wikiTooltip = hoverTooltip((view, pos) => {
    const text = view.state.doc.toString();
    const re = /\[\[([\w-]+)\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (pos >= m.index && pos <= m.index + m[0].length) {
        const item = map[m[1]];
        if (!item) return null;
        const iconMap: Record<string, string> = { video: "🎬", audio: "🎵", image: "🖼️", pdf: "📄", text: "📝", document: "📎" };
        return {
          pos: m.index,
          end: m.index + m[0].length,
          above: true,
          create() {
            const dom = document.createElement("div");
            dom.className = "bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm max-w-xs";
            dom.innerHTML = `
              <div class="flex items-center gap-2 mb-2">
                <span>${iconMap[item.type] || "📎"}</span>
                <span class="font-medium text-white">${item.title}</span>
              </div>
              <div class="text-xs text-slate-400 space-y-0.5">
                <div>Tipo: <span class="text-slate-300 capitalize">${item.type}</span></div>
                ${item.sizeKB ? `<div>Tamaño: <span class="text-slate-300">${item.sizeKB >= 1024 ? (item.sizeKB / 1024).toFixed(1) + " MB" : item.sizeKB + " KB"}</span></div>` : ""}
                ${item.duration ? `<div>Duración: <span class="text-slate-300">${item.duration}</span></div>` : ""}
                ${item.resolution ? `<div>Resolución: <span class="text-slate-300">${item.resolution}</span></div>` : ""}
              </div>
              ${item.type === "image" ? `<img src="/api/v1/library/${item.id}/file?token=${token}" class="mt-2 max-w-[200px] max-h-[150px] rounded object-contain" />` : ""}
            `;
            return { dom };
          },
        };
      }
    }
    return null;
  });

  return [wikiLinkPlugin, wikiTooltip];
}
