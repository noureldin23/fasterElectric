import { useState } from "react";
import { useListEmployees } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function Employees() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [mansione, setMansione] = useState<string>("all");

  const queryParams = {
    ...(search ? { search } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(mansione !== "all" ? { mansione } : {}),
  };

  const { data: employees, isLoading } = useListEmployees(queryParams);

  // Extract unique mansioni for the filter
  const uniqueMansioni = Array.from(new Set(employees?.map(e => e.mansione).filter(Boolean) || []));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dipendenti</h1>
        <Link href="/employees/new">
          <Button className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Nuovo Dipendente
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca dipendente..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="active">Attivi</SelectItem>
                  <SelectItem value="dismissed">Dimessi</SelectItem>
                </SelectContent>
              </Select>

              <Select value={mansione} onValueChange={setMansione}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Mansione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le mansioni</SelectItem>
                  {uniqueMansioni.map((m) => (
                    <SelectItem key={m!} value={m!}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : employees?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nessun dipendente trovato</p>
          </div>
        ) : (
          employees?.map((employee) => (
            <Link key={employee.id} href={`/employees/${employee.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/10">
                      <AvatarImage src={employee.photoUrl || undefined} alt={`${employee.firstName} ${employee.lastName}`} />
                      <AvatarFallback className="bg-primary/5 text-primary text-lg">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {employee.firstName} {employee.lastName}
                        <Badge variant={employee.status === "active" ? "default" : "secondary"} className="ml-2">
                          {employee.status === "active" ? "Attivo" : "Dimesso"}
                        </Badge>
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                          {employee.employeeCode}
                        </span>
                        {employee.mansione && (
                          <>
                            <span className="h-1 w-1 bg-border rounded-full" />
                            <span>{employee.mansione}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block text-right">
                    {employee.hireDate && (
                      <>
                        <div className="text-xs text-muted-foreground">Data assunzione</div>
                        <div className="text-sm font-medium">
                          {format(new Date(employee.hireDate), "dd MMM yyyy", { locale: it })}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
