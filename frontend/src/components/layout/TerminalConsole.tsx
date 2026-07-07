import { useEffect, useRef, useState } from "react";
import { Terminal } from "lucide-react";
import { getToken } from "../../lib/api";

export default function TerminalConsole() {
  const [logs, setLogs] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!getToken()) return;
    const interval = setInterval(async () => {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch("/api/v1/logs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: string[] = await res.json();
          setLogs(data);
        }
      } catch { /* ignore */ }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="h-[150px] bg-black border-t border-slate-700 flex flex-col shrink-0">
      <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 border-b border-slate-800">
        <Terminal size={14} className="text-emerald-400" />
        <span className="text-xs font-mono text-emerald-400">GO-SERVER stdout</span>
        <span className="text-xs text-slate-600 ml-auto">{logs.length} lines</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs leading-relaxed">
        {logs.length === 0 && (
          <span className="text-slate-600">[GO-SERVER] Esperando logs...</span>
        )}
        {logs.map((line, i) => (
          <div key={i} className="text-slate-300 whitespace-pre-wrap">
            {line}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
