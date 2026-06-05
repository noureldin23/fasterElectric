import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Database, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function Backup() {
  const { toast } = useToast();
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const token = localStorage.getItem("fm_token");

  const fetchBackups = () => {
    setLoading(true);
    fetch("/api/backup/list", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setBackups(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBackups(); }, []);

  const createBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/backup/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Backup creato con successo" });
        fetchBackups();
      } else {
        toast({ title: "Errore nella creazione del backup", variant: "destructive" });
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Backup</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchBackups}>
            <RefreshCw className="mr-2 h-4 w-4" />Aggiorna
          </Button>
          <Button onClick={createBackup} disabled={creating}>
            <Plus className="mr-2 h-4 w-4" />{creating ? "Creazione..." : "Crea Backup"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 p-3 bg-muted rounded-md">
            <Database className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Informazioni Backup</p>
              <p className="text-xs text-muted-foreground mt-1">
                Il database è ospitato su Replit PostgreSQL. I backup registrano i metadati del sistema.
                Per un backup completo del database contattare l'amministratore Replit.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : backups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nessun backup disponibile</p>
            <Button className="mt-4" onClick={createBackup} disabled={creating}>
              <Plus className="mr-2 h-4 w-4" />Crea il primo backup
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {backups.map((b, i) => (
            <Card key={b.filename}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Database className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-medium truncate">{b.filename}</p>
                      {i === 0 && <Badge variant="default" className="text-xs">Più recente</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(b.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: it })} · {(b.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
