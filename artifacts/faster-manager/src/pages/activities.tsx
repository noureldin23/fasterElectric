import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const ACTION_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  LOGIN: { label: "Login", variant: "default" },
  LOGOUT: { label: "Logout", variant: "outline" },
  CREATE_EMPLOYEE: { label: "Nuovo Dipendente", variant: "default" },
  UPDATE_EMPLOYEE: { label: "Modifica Dipendente", variant: "secondary" },
  DELETE_EMPLOYEE: { label: "Elimina Dipendente", variant: "destructive" },
  UPLOAD_PHOTO: { label: "Foto", variant: "secondary" },
  UPLOAD_DOCUMENT: { label: "Documento", variant: "default" },
  UPDATE_DOCUMENT: { label: "Modifica Doc", variant: "secondary" },
  DELETE_DOCUMENT: { label: "Elimina Doc", variant: "destructive" },
  UPLOAD_PAYSLIP: { label: "Busta Paga", variant: "default" },
  DELETE_PAYSLIP: { label: "Elimina BP", variant: "destructive" },
  UPLOAD_CUD: { label: "CUD", variant: "default" },
  DELETE_CUD: { label: "Elimina CUD", variant: "destructive" },
  UPLOAD_COMPANY_DOCUMENT: { label: "Doc Aziendale", variant: "default" },
  DELETE_COMPANY_DOCUMENT: { label: "Elimina Doc Az", variant: "destructive" },
  UPDATE_SETTINGS: { label: "Impostazioni", variant: "secondary" },
  UPLOAD_LOGO: { label: "Logo", variant: "secondary" },
  BACKUP_CREATE: { label: "Backup", variant: "outline" },
  CHANGE_PASSWORD: { label: "Password", variant: "secondary" },
};

export default function Activities() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 50;

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("fm_token");
    fetch(`/api/activities?page=${page}&limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setItems(d.items || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Registro Attività</h1>
        <span className="text-sm text-muted-foreground">{total} azioni totali</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nessuna attività registrata</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {items.map((item) => {
              const cfg = ACTION_LABELS[item.action] || { label: item.action, variant: "outline" as const };
              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                          {item.details && <span className="text-sm truncate">{item.details}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: it })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />Precedente
              </Button>
              <span className="text-sm text-muted-foreground">Pag. {page} di {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Successivo<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
