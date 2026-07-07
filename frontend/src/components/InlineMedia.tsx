import { useState, useEffect } from "react";
import { api } from "../lib/api";
import type { LibraryItem } from "../types";
import { FileText, Download } from "lucide-react";

interface Props {
  item: LibraryItem;
}

export default function InlineMedia({ item }: Props) {
  const url = api.getLibraryFileUrl(item.id);
  const [textContent, setTextContent] = useState("");

  useEffect(() => {
    if (item.type === "text") {
      fetch(url).then((r) => r.text()).then(setTextContent).catch(() => {});
    }
  }, [item.id, item.type, url]);

  switch (item.type) {
    case "video":
      return (
        <div className="bg-black rounded-xl overflow-hidden my-3">
          <video controls className="w-full max-h-[400px]" src={url} />
        </div>
      );
    case "audio":
      return (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 my-3">
          <audio controls className="w-full" src={url} />
        </div>
      );
    case "image":
      return (
        <div className="bg-slate-800 rounded-xl p-2 border border-slate-700 my-3 inline-block">
          <img src={url} alt={item.title} className="max-w-full max-h-[400px] rounded-lg object-contain" />
        </div>
      );
    case "pdf":
      return (
        <div className="my-3 bg-slate-800 rounded-xl overflow-hidden border border-slate-700" style={{ height: "500px" }}>
          <iframe src={url} className="w-full h-full" title={item.title} />
        </div>
      );
    case "text":
      return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 my-3 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 border-b border-slate-700">
            <FileText size={14} className="text-indigo-400" />
            <span className="text-xs text-slate-300">{item.title}</span>
          </div>
          <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-[400px] p-4">
            {textContent || "Cargando contenido..."}
          </pre>
        </div>
      );
    default:
      return (
        <a href={url} download
          className="flex items-center gap-3 p-4 my-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-indigo-500/50 transition-colors group">
          <FileText size={24} className="text-slate-500 group-hover:text-indigo-400" />
          <div className="flex-1">
            <p className="text-sm text-white group-hover:text-indigo-300">{item.title}</p>
            <p className="text-xs text-slate-500">{item.type} · {(item.sizeKB / 1024).toFixed(1)} MB</p>
          </div>
          <Download size={16} className="text-slate-500" />
        </a>
      );
  }
}
