import { useState, useEffect, useRef, useCallback } from "react";
import { api, getToken } from "../../lib/api";
import { Card, Button, Badge } from "../../components/ui";
import { Terminal, Search, BarChart3 } from "lucide-react";
import type { ServerLog, ServerLogStats } from "../../types";

const LOG_LEVELS = ["", "debug", "info", "warn", "error"];
const PAGE_SIZE = 25;

function levelColor(level: string): "emerald" | "amber" | "red" | "slate" {
  if (level === "error") return "red";
  if (level === "warn") return "amber";
  if (level === "info") return "emerald";
  return "slate";
}

export default function Logs() {
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState({ level: "", from: "", to: "", q: "" });
  const [results, setResults] = useState<ServerLog[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [searching, setSearching] = useState(false);
  const [stats, setStats] = useState<ServerLogStats | null>(null);
  const [retentionDays, setRetentionDays] = useState<number | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.getLogStats();
      setStats(res.stats);
      setRetentionDays(res.retentionDays);
    } catch { }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const runSearch = async (nextOffset: number) => {
    setSearching(true);
    try {
      const res = await api.searchLogs({
        level: filters.level || undefined,
        from: filters.from ? new Date(filters.from).toISOString() : undefined,
        to: filters.to ? new Date(filters.to).toISOString() : undefined,
        q: filters.q || undefined,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });
      setResults((prev) => (nextOffset === 0 ? res.logs : [...prev, ...res.logs]));
      setHasMore(res.hasMore);
      setOffset(nextOffset);
    } catch (err) {
      alert("Error al buscar logs: " + (err as Error).message);
    }
    setSearching(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(0);
  };

  useEffect(() => {
    if (!getToken()) return;
    const interval = setInterval(async () => {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch("/api/v1/logs", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setLogs(await res.json());
      } catch { }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Logs del Servidor</h1>

      <Card>
        <details className="group" open>
          <summary className="flex items-center gap-2 text-sm font-medium text-slate-300 cursor-pointer list-none">
            <Terminal size={16} className="text-emerald-400" />
            En vivo
            <span className="text-xs text-slate-500 ml-auto">{logs.length} líneas</span>
          </summary>
          <div className="mt-3 bg-black rounded-lg p-3 font-mono text-xs leading-relaxed max-h-64 overflow-y-auto">
            {logs.length === 0 && <span className="text-slate-600">[GO-SERVER] Esperando logs...</span>}
            {logs.map((line, i) => (
              <div key={i} className="text-slate-300 whitespace-pre-wrap">{line}</div>
            ))}
            <div ref={logEndRef} />
          </div>
        </details>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-indigo-400" /> Historial — Búsqueda y Filtros
        </h2>

        {stats && (
          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
            <Badge color="indigo">{stats.total} logs (últimas 24h)</Badge>
            {Object.entries(stats.byLevel).map(([level, count]) => (
              <Badge key={level} color={levelColor(level)}>{level}: {count}</Badge>
            ))}
            {retentionDays !== null && (
              <span className="text-slate-500 ml-auto">Retención: {retentionDays} días</span>
            )}
          </div>
        )}

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })}
            className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-white">
            {LOG_LEVELS.map((l) => <option key={l} value={l}>{l || "Nivel: todos"}</option>)}
          </select>
          <input type="datetime-local" value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-white" />
          <input type="datetime-local" value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-white" />
          <input type="text" placeholder="Buscar en mensaje..." value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-white placeholder-slate-500 sm:col-span-2" />
          <Button type="submit" disabled={searching}>
            <Search size={14} className="mr-1.5 inline" /> {searching ? "Buscando..." : "Buscar"}
          </Button>
        </form>

        {results.length === 0 ? (
          <p className="text-sm text-slate-500">
            {searching ? "Buscando..." : "Sin resultados — ajustá los filtros y buscá."}
          </p>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {results.map((log) => (
              <div key={log.id} className="text-xs font-mono bg-slate-700/30 px-3 py-2 rounded space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 shrink-0">{new Date(log.timestamp).toLocaleString("es-ES")}</span>
                  <Badge color={levelColor(log.level)}>{log.level}</Badge>
                  <span className="text-slate-300 truncate flex-1">{log.message}</span>
                </div>
                {log.fields && log.fields !== "{}" && (
                  <div className="text-slate-600 pl-1 truncate">{log.fields}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-3 text-center">
            <Button variant="secondary" onClick={() => runSearch(offset + PAGE_SIZE)} disabled={searching}>
              Cargar más
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
