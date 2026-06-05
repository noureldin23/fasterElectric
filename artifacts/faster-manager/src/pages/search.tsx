import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, FileText, ChevronRight } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ employees: any[]; documents: any[] }>({ employees: [], documents: [] });
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ employees: [], documents: [] });
      return;
    }
    setLoading(true);
    const token = localStorage.getItem("fm_token");
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setResults(d))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const hasResults = results.employees.length > 0 || results.documents.length > 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Ricerca Globale</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Cerca dipendente, codice, documento..."
          className="pl-10 h-12 text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {!query && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Digita per cercare dipendenti o documenti</p>
        </div>
      )}

      {query && loading && (
        <div className="text-center py-8 text-muted-foreground">Ricerca in corso...</div>
      )}

      {query && !loading && !hasResults && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nessun risultato per "<strong>{query}</strong>"</p>
        </div>
      )}

      {!loading && hasResults && (
        <div className="space-y-6">
          {results.employees.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />Dipendenti ({results.employees.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {results.employees.map((emp, i) => (
                  <Link key={emp.id} href={`/employees/${emp.id}`}>
                    <div className={`flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors ${i < results.employees.length - 1 ? "border-b" : ""}`}>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={emp.photoUrl || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">{emp.employeeCode}</span>
                          {emp.mansione && <span className="text-xs text-muted-foreground">· {emp.mansione}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={emp.status === "active" ? "default" : "secondary"} className="text-xs">
                          {emp.status === "active" ? "Attivo" : "Inattivo"}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {results.documents.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />Documenti ({results.documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {results.documents.map((doc, i) => (
                  <Link key={doc.id} href={`/employees/${doc.employeeId}`}>
                    <div className={`flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors ${i < results.documents.length - 1 ? "border-b" : ""}`}>
                      <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                          <span className="text-xs text-muted-foreground">{doc.employeeName}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
