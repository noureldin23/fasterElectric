import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, AlertCircle, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function Expirations() {
  const [status, setStatus] = useState("all");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("fm_token");
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    fetch(`/api/expirations?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [status]);

  const expired = items.filter((i) => i.status === "expired");
  const expiringSoon = items.filter((i) => i.status === "expiring-soon");
  const valid = items.filter((i) => i.status === "valid");

  const statusConfig = {
    expired: { label: "Scaduto", color: "destructive" as const, icon: AlertCircle },
    "expiring-soon": { label: "In scadenza", color: "default" as const, icon: AlertTriangle },
    valid: { label: "Valido", color: "secondary" as const, icon: CheckCircle },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Scadenze</h1>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="expired">Scaduti</SelectItem>
            <SelectItem value="expiring-soon">In scadenza (30gg)</SelectItem>
            <SelectItem value="valid">Validi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {status === "all" && !loading && (
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard count={expired.length} label="Scaduti" variant="destructive" icon={AlertCircle} />
          <SummaryCard count={expiringSoon.length} label="In scadenza" variant="warning" icon={AlertTriangle} />
          <SummaryCard count={valid.length} label="Validi" variant="success" icon={CheckCircle} />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nessuna scadenza trovata</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const cfg = statusConfig[item.status as keyof typeof statusConfig];
            const Icon = cfg.icon;
            return (
              <Card key={item.id} className={`${item.status === "expired" ? "border-destructive/50" : item.status === "expiring-soon" ? "border-yellow-500/50" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Icon className={`h-5 w-5 flex-shrink-0 ${item.status === "expired" ? "text-destructive" : item.status === "expiring-soon" ? "text-yellow-600" : "text-green-600"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{item.documentName}</span>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        <Badge variant={cfg.color} className="text-xs">{cfg.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground">{item.employeeName}</span>
                        <span className="text-sm font-medium">
                          Scade: {format(new Date(item.endDate), "dd/MM/yyyy", { locale: it })}
                          {item.daysLeft !== null && (
                            <span className={`ml-2 text-xs ${item.daysLeft < 0 ? "text-destructive" : item.daysLeft <= 30 ? "text-yellow-600" : "text-green-600"}`}>
                              ({item.daysLeft < 0 ? `${Math.abs(item.daysLeft)}gg fa` : `${item.daysLeft}gg`})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <Link href={`/employees/${item.employeeId}`}>
                      <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ count, label, variant, icon: Icon }: any) {
  const colors = {
    destructive: "border-destructive/50 text-destructive",
    warning: "border-yellow-500/50 text-yellow-600",
    success: "border-green-500/50 text-green-600",
  };
  return (
    <Card className={`border-2 ${colors[variant as keyof typeof colors]}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className="h-8 w-8" />
        <div>
          <p className="text-3xl font-bold">{count}</p>
          <p className="text-sm font-medium">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
