import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Upload, Download, Trash2, FileText, Plus } from "lucide-react";
import { format } from "date-fns";

const CATEGORIES = ["Contratto Aziendale", "Visura Camerale", "DURC", "DVR", "Certificazione ISO", "Polizza Assicurativa", "Altro"];

export default function CompanyDocuments() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem("fm_token");

  const fetchDocs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category !== "all") params.set("category", category);
    fetch(`/api/company-documents?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setDocuments(d))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocs(); }, [search, category]);

  const deleteDoc = async (id: number) => {
    await fetch(`/api/company-documents/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    toast({ title: "Documento eliminato" });
    fetchDocs();
  };

  const uploadDoc = async (formData: FormData) => {
    setUploading(true);
    try {
      const res = await fetch("/api/company-documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        toast({ title: "Documento caricato" });
        setUploadOpen(false);
        fetchDocs();
      } else {
        toast({ title: "Errore nel caricamento", variant: "destructive" });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Documenti Aziendali</h1>
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Carica Documento
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca documento..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nessun documento trovato</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{doc.name}</p>
                      <Badge variant="outline">{doc.category}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(doc.uploadedAt), "dd/MM/yyyy HH:mm")}
                      </span>
                      {doc.fileSize && (
                        <span className="text-xs text-muted-foreground">
                          {(doc.fileSize / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </div>
                    {doc.notes && <p className="text-xs text-muted-foreground mt-1">{doc.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                    </a>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDoc(doc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onSubmit={uploadDoc} uploading={uploading} />
    </div>
  );
}

function UploadDialog({ open, onOpenChange, onSubmit, uploading }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Altro");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name || file.name);
    fd.append("category", category);
    if (notes) fd.append("notes", notes);
    onSubmit(fd);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Carica Documento Aziendale</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>File *</Label><Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
          <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome documento" /></div>
          <div>
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Note</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleSubmit} disabled={!file || uploading}>{uploading ? "Caricamento..." : "Carica"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
