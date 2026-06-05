import { useGetDashboardStats, useGetDocumentsByMonth, useGetRecentActivities, useGetRecentDocuments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, FileText, AlertTriangle, AlertCircle, Banknote, FileStack, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: monthlyData, isLoading: monthlyLoading } = useGetDocumentsByMonth();
  const { data: activities, isLoading: activitiesLoading } = useGetRecentActivities();
  const { data: recentDocs, isLoading: recentDocsLoading } = useGetRecentDocuments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {statsLoading ? (
          Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : stats ? (
          <>
            <StatCard title="Totale Dipendenti" value={stats.totalEmployees} icon={Users} />
            <StatCard title="Attivi" value={stats.activeEmployees} icon={UserCheck} />
            <StatCard title="Totale Documenti" value={stats.totalDocuments} icon={FileText} />
            <StatCard title="In Scadenza" value={stats.expiringDocuments} icon={AlertTriangle} variant="warning" />
            <StatCard title="Scaduti" value={stats.expiredDocuments} icon={AlertCircle} variant="destructive" />
            <StatCard title="Buste Paga" value={stats.totalPayslips} icon={Banknote} />
            <StatCard title="CUD" value={stats.totalCuds} icon={FileStack} />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Caricamento Documenti (Ultimi 12 Mesi)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {monthlyLoading ? (
              <Skeleton className="w-full h-full" />
            ) : monthlyData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documenti Recenti</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDocsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentDocs?.length ? (
              <div className="space-y-4">
                {recentDocs.map((doc) => (
                  <div key={`${doc.type}-${doc.id}`} className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-md">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{doc.employeeName}</p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(doc.uploadedAt), 'dd MMM', { locale: it })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nessun documento recente</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Attività Recenti</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : activities?.length ? (
              <div className="space-y-4">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="mt-0.5">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{act.action}</span> - {act.entity} {act.details ? `(${act.details})` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(act.createdAt), 'dd MMM yyyy HH:mm', { locale: it })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nessuna attività recente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon,
  variant = 'default'
}: { 
  title: string; 
  value: number; 
  icon: any;
  variant?: 'default' | 'warning' | 'destructive'
}) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
        <div className={`p-3 rounded-full mb-3 ${
          variant === 'warning' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
          variant === 'destructive' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
          'bg-primary/10 text-primary'
        }`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1 leading-tight">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
