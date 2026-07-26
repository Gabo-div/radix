import { useRef, useState } from "react";
import { HardDrive, Users, Radio, RefreshCw, CheckCircle, Database, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useMonitor, useForceSync, useImportBackup } from "@/hooks/useMonitor";

function formatKB(kb: number) {
  if (kb >= 1048576) return (kb / 1048576).toFixed(1) + " GB";
  if (kb >= 1024) return (kb / 1024).toFixed(1) + " MB";
  return kb + " KB";
}

export default function MonitorPanel() {
  const { data } = useMonitor();
  const forceSync = useForceSync();
  const importBackup = useImportBackup();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleImport = () => {
    if (!pendingFile) return;
    importBackup.mutate(pendingFile, {
      onSuccess: (res) => {
        const inserted = res.tables.reduce((sum, t) => sum + t.inserted, 0);
        const skipped = res.tables.reduce((sum, t) => sum + t.skipped, 0);
        toast.success(
          `Respaldo importado: ${inserted} registros nuevos, ${skipped} ya existentes, ${res.uploads} archivos`,
          { icon: <CheckCircle className="size-4" /> }
        );
        setPendingFile(null);
      },
      onError: (err) => toast.error("Error al importar: " + (err as Error).message),
    });
  };

  const handleSync = () => {
    forceSync.mutate(undefined, {
      onSuccess: () => toast.success("Sincronización oportunista completada", { icon: <CheckCircle className="size-4" /> }),
      onError: (err) => toast.error("Error al sincronizar: " + (err as Error).message),
    });
  };

  return (
    <div className="space-y-6">
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
        <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <Database size={16} /> Respaldo de la Base de Datos
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          El respaldo incluye cursos, lecciones, cuestionarios, notas, usuarios, inscripciones, foro y los
          archivos de la biblioteca, en un ZIP con las carpetas <span className="font-mono text-xs">data/</span> y{" "}
          <span className="font-mono text-xs">uploads/</span>. No incluye la cola DTN ni los logs del servidor,
          que son propios de este nodo. Al importar, los registros se agregan a los que ya existen: nada se borra.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <a href={api.exportBackupUrl()} download>
              <Download size={16} /> Exportar todo
            </a>
          </Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={importBackup.isPending}>
            <Upload size={16} /> {importBackup.isPending ? "Importando..." : "Importar respaldo"}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = ""; // permite reelegir el mismo archivo
              if (file) setPendingFile(file);
            }}
          />
        </div>
      </Card>

      <Dialog open={!!pendingFile} onOpenChange={(open) => !open && setPendingFile(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar respaldo</DialogTitle>
            <DialogDescription>
              Se agregarán los registros de <span className="font-mono text-xs">{pendingFile?.name}</span> a los
              que ya existen. Los que coincidan con uno actual (mismo identificador, o un correo ya usado) se
              omiten y se conserva el registro local.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPendingFile(null)}>Cancelar</Button>
            <Button onClick={handleImport} disabled={importBackup.isPending}>
              {importBackup.isPending ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
