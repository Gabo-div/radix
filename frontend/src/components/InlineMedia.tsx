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
        <div className="bg-card rounded-xl p-4 border border-border my-3">
          <audio controls className="w-full" src={url} />
        </div>
      );
    case "image":
      return (
        <div className="bg-card rounded-xl p-2 border border-border my-3 inline-block">
          <img src={url} alt={item.title} className="max-w-full max-h-[400px] rounded-lg object-contain" />
        </div>
      );
    case "pdf":
      return (
        <div className="my-3 bg-card rounded-xl overflow-hidden border border-border" style={{ height: "500px" }}>
          <iframe src={url} className="w-full h-full" title={item.title} />
        </div>
      );
    case "text":
      return (
        <div className="bg-card rounded-xl border border-border my-3 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border-b border-border">
            <FileText size={14} className="text-primary" />
            <span className="text-xs text-foreground/80">{item.title}</span>
          </div>
          <pre className="text-sm text-foreground/80 font-mono whitespace-pre-wrap overflow-x-auto max-h-[400px] p-4">
            {textContent || "Cargando contenido..."}
          </pre>
        </div>
      );
    default:
      return (
        <a href={url} download
          className="flex items-center gap-3 p-4 my-3 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors group">
          <FileText size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
          <div className="flex-1">
            <p className="text-sm text-foreground group-hover:text-primary transition-colors">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.type} · {(item.sizeKB / 1024).toFixed(1)} MB</p>
          </div>
          <Download size={16} className="text-muted-foreground" />
        </a>
      );
  }
}
