import { HardDrive, Users, Radio, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMonitor, useForceSync } from "@/hooks/useMonitor";

function formatKB(kb: number) {
  if (kb >= 1048576) return (kb / 1048576).toFixed(1) + " GB";
  if (kb >= 1024) return (kb / 1024).toFixed(1) + " MB";
  return kb + " KB";
}

export default function Monitor() {
  const { data } = useMonitor();
  const forceSync = useForceSync();

  const handleSync = () => {
    forceSync.mutate(undefined, {
      onSuccess: () => toast.success("Sincronización oportunista completada", { icon: <CheckCircle className="size-4" /> }),
      onError: (err) => toast.error("Error al sincronizar: " + (err as Error).message),
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Monitor del Servidor</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-primary mb-2">
            <HardDrive size={20} /><span className="text-sm font-medium">Disco</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{data ? formatKB(data.diskKB) : "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Espacio total ocupado</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-success mb-2">
            <Users size={20} /><span className="text-sm font-medium">Usuarios</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{data?.activeUsers ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Sesiones activas</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-warning mb-2">
            <Radio size={20} /><span className="text-sm font-medium">Cola DTN</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{data?.syncQueue.transactionCount ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Transacciones offline</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <RefreshCw size={16} /> Cola DTN (CRDT)
          </h2>
          <Button onClick={handleSync} variant="secondary" disabled={forceSync.isPending}>
            {forceSync.isPending ? "Sincronizando..." : "Forzar Sincronización"}
          </Button>
        </div>
        {data?.syncQueue.logs && data.syncQueue.logs.length > 0 ? (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {data.syncQueue.logs.map((log, i) => (
              <div key={i} className="text-xs font-mono text-muted-foreground bg-secondary/40 px-3 py-1.5 rounded">{log}</div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay transacciones pendientes.</p>
        )}
        {data && (data.syncQueue.transactionCount ?? 0) > 0 && (
          <div className="mt-3"><Badge variant="destructive">{data.syncQueue.transactionCount} pendientes</Badge></div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Información del Servidor</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <span className="text-muted-foreground">Estado:</span><span className="text-success font-medium">Online</span>
          <span className="text-muted-foreground">Región:</span><span className="text-foreground">Amazonía (Offline Edge)</span>
          <span className="text-muted-foreground">Última sincronización:</span><span className="text-foreground">Pendiente</span>
          <span className="text-muted-foreground">Versión:</span><span className="text-foreground">Go 1.26 · Echo v5</span>
        </div>
      </Card>
    </div>
  );
}
