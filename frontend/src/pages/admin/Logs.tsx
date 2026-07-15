import { useEffect, useRef, useState } from "react";
import { Terminal, Search, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLiveLogs, useLogStats, useLogSearch } from "@/hooks/useLogs";
import type { LogSearchFilters } from "@/types";

const LOG_LEVELS = [
  { value: "all", label: "Nivel: todos" },
  { value: "debug", label: "debug" },
  { value: "info", label: "info" },
  { value: "warn", label: "warn" },
  { value: "error", label: "error" },
];

function levelVariant(level: string): "success" | "warning" | "destructive" | "secondary" {
  if (level === "error") return "destructive";
  if (level === "warn") return "warning";
  if (level === "info") return "success";
  return "secondary";
}

export default function Logs() {
  const { data: logs = [] } = useLiveLogs();
  const liveContainerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);

  const { data: statsRes } = useLogStats();

  const [level, setLevel] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [submittedFilters, setSubmittedFilters] = useState<LogSearchFilters | null>(null);

  const search = useLogSearch(submittedFilters);
  const results = search.data?.pages.flatMap((p) => p.logs) ?? [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedFilters({
      level: level === "all" ? undefined : level,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
      q: q || undefined,
    });
  };

  const handleLiveScroll = () => {
    const el = liveContainerRef.current;
    if (!el) return;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
  };

  useEffect(() => {
    const el = liveContainerRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Logs del Servidor</h1>

      <Tabs defaultValue="live">
        <TabsList>
          <TabsTrigger value="live">
            <Terminal size={16} className="text-success" /> En vivo
          </TabsTrigger>
          <TabsTrigger value="history">
            <BarChart3 size={16} className="text-primary" /> Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <Card>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
              <Terminal size={16} className="text-success" />
              En vivo
              <span className="text-xs text-muted-foreground/70 ml-auto">{logs.length} líneas</span>
            </div>
            <div
              ref={liveContainerRef}
              onScroll={handleLiveScroll}
              className="bg-black rounded-lg p-3 font-mono text-xs leading-relaxed h-96 overflow-y-auto"
            >
              {logs.length === 0 && <span className="text-muted-foreground/60">[GO-SERVER] Esperando logs...</span>}
              {logs.map((line, i) => (
                <div key={i} className="text-foreground/80 whitespace-pre-wrap">{line}</div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-primary" /> Historial — Búsqueda y Filtros
            </h2>

            {statsRes && (
              <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                <Badge>{statsRes.stats.total} logs (últimas 24h)</Badge>
                {Object.entries(statsRes.stats.byLevel).map(([lvl, count]) => (
                  <Badge key={lvl} variant={levelVariant(lvl)}>{lvl}: {count}</Badge>
                ))}
                <span className="text-muted-foreground ml-auto">Retención: {statsRes.retentionDays} días</span>
              </div>
            )}

            <form onSubmit={handleSearchSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOG_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
              <Input
                type="text"
                placeholder="Buscar en mensaje..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="sm:col-span-2"
              />
              <Button type="submit" disabled={search.isFetching}>
                <Search size={14} className="mr-1.5" /> {search.isFetching ? "Buscando..." : "Buscar"}
              </Button>
            </form>

            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {search.isFetching ? "Buscando..." : submittedFilters ? "Sin resultados — ajustá los filtros y buscá." : "Elegí filtros y buscá."}
              </p>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {results.map((log) => (
                  <div key={log.id} className="text-xs font-mono bg-secondary/30 px-3 py-2 rounded space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground shrink-0">{new Date(log.timestamp).toLocaleString("es-ES")}</span>
                      <Badge variant={levelVariant(log.level)}>{log.level}</Badge>
                      <span className="text-foreground/90 truncate flex-1">{log.message}</span>
                    </div>
                    {log.fields && log.fields !== "{}" && (
                      <div className="text-muted-foreground/70 pl-1 truncate">{log.fields}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {search.hasNextPage && (
              <div className="mt-3 text-center">
                <Button variant="secondary" onClick={() => search.fetchNextPage()} disabled={search.isFetchingNextPage}>
                  Cargar más
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
