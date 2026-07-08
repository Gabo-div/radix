import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";
import { Card, Button, Badge } from "../../components/ui";
import { HardDrive, Users, Radio, RefreshCw, CheckCircle } from "lucide-react";

export default function Monitor() {
  const [data, setData] = useState<{ diskKB: number; activeUsers: number; syncQueue: { transactionCount: number; logs: string[] } } | null>(null);
  const [synced, setSynced] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.getMonitor();
      setData(res);
    } catch { }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, [load]);

  const handleSync = async () => {
    try {
      const res = await api.forceSync();
      setSynced(true);
      setTimeout(() => setSynced(false), 3000);
      load();
    } catch { }
  };

  const formatKB = (kb: number) => {
    if (kb >= 1048576) return (kb / 1048576).toFixed(1) + " GB";
    if (kb >= 1024) return (kb / 1024).toFixed(1) + " MB";
    return kb + " KB";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Monitor del Servidor</h1>

      {synced && (
        <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700 text-emerald-300 px-4 py-2 rounded-lg text-sm">
          <CheckCircle size={16} /> Sincronización oportunista completada
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <HardDrive size={20} /><span className="text-sm font-medium">Disco</span>
          </div>
          <p className="text-2xl font-bold text-white">{data ? formatKB(data.diskKB) : "—"}</p>
          <p className="text-xs text-slate-500 mt-1">Espacio total ocupado</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Users size={20} /><span className="text-sm font-medium">Usuarios</span>
          </div>
          <p className="text-2xl font-bold text-white">{data?.activeUsers ?? "—"}</p>
          <p className="text-xs text-slate-500 mt-1">Sesiones activas</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Radio size={20} /><span className="text-sm font-medium">Cola DTN</span>
          </div>
          <p className="text-2xl font-bold text-white">{data?.syncQueue.transactionCount ?? "—"}</p>
          <p className="text-xs text-slate-500 mt-1">Transacciones offline</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <RefreshCw size={16} /> Cola DTN (CRDT)
          </h2>
          <Button onClick={handleSync} variant="secondary">Forzar Sincronización</Button>
        </div>
        {data?.syncQueue.logs && data.syncQueue.logs.length > 0 ? (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {data.syncQueue.logs.map((log, i) => (
              <div key={i} className="text-xs font-mono text-slate-400 bg-slate-700/30 px-3 py-1.5 rounded">{log}</div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No hay transacciones pendientes.</p>
        )}
        {data && (data.syncQueue.transactionCount ?? 0) > 0 && (
          <div className="mt-3"><Badge color="red">{data.syncQueue.transactionCount} pendientes</Badge></div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-slate-300 mb-3">Información del Servidor</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <span className="text-slate-400">Estado:</span><span className="text-emerald-400 font-medium">Online</span>
          <span className="text-slate-400">Región:</span><span className="text-white">Amazonía (Offline Edge)</span>
          <span className="text-slate-400">Última sincronización:</span><span className="text-white">Pendiente</span>
          <span className="text-slate-400">Versión:</span><span className="text-white">Go 1.26 · Echo v5</span>
        </div>
      </Card>
    </div>
  );
}
