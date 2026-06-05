import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Edit, Trash2, Upload, Download, Plus, FileText, Banknote, FileStack, User, Phone, Mail, Calendar,
  Building2, CreditCard, Hash, MapPin, AlertTriangle, CheckCircle, Clock, ChevronRight
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const DOC_CATEGORIES = ["Contratto", "Permesso di soggiorno", "Patente", "Corso sicurezza", "Visita medica", "Certificazione", "Attestato", "Altro"];

function useEmployeeDetail(id: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = () => {
    setIsLoading(true);
    const token = localStorage.getItem("fm_token");
    fetch(`/api/employees/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setData(d); setError(null); })
      .catch(() => setError("Errore nel caricamento"))
      .finally(() => setIsLoading(false));
  };

  if (isLoading && data === null && error === null) refetch();

  return { data, isLoading, error, refetch };
}

export default function EmployeeDetail() {
  const [, params] = useRoute("/employees/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = params?.id!;
  const { data: employee, isLoading, refetch } = useEmployeeDetail(id);

  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [uploadPayslipOpen, setUploadPayslipOpen] = useState(false);
  const [uploadCudOpen, setUploadCudOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem("fm_token");

  const deleteEmployee = async () => {
    try {
      await fetch(`/api/employees/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Dipendente eliminato" });
      setLocation("/employees");
    } catch {
      toast({ title: "Errore nell'eliminazione", variant: "destructive" });
    }
  };

  const uploadPhoto = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/employees/${id}/photo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) { refetch(); toast({ title: "Foto aggiornata" }); }
  };

  const uploadDocument = async (formData: FormData) => {
    setUploading(true);
    try {
      const res = await fetch(`/api/employees/${id}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) { refetch(); toast({ title: "Documento caricato" }); setUploadDocOpen(false); }
      else toast({ title: "Errore nel caricamento", variant: "destructive" });
    } finally { setUploading(false); }
  };

  const uploadPayslip = async (formData: FormData) => {
    setUploading(true);
    try {
      const res = await fetch(`/api/employees/${id}/payslips`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) { refetch(); toast({ title: "Busta paga caricata" }); setUploadPayslipOpen(false); }
      else toast({ title: "Errore nel caricamento", variant: "destructive" });
    } finally { setUploading(false); }
  };

  const uploadCud = async (formData: FormData) => {
    setUploading(true);
    try {
      const res = await fetch(`/api/employees/${id}/cuds`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) { refetch(); toast({ title: "CUD caricato" }); setUploadCudOpen(false); }
      else toast({ title: "Errore nel caricamento", variant: "destructive" });
    } finally { setUploading(false); }
  };

  const deleteDocument = async (docId: number) => {
    await fetch(`/api/documents/${docId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    refetch();
    toast({ title: "Documento eliminato" });
  };

  const deletePayslip = async (payslipId: number) => {
    await fetch(`/api/payslips/${payslipId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    refetch();
    toast({ title: "Busta paga eliminata" });
  };

  const deleteCud = async (cudId: number) => {
    await fetch(`/api/cuds/${cudId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    refetch();
    toast({ title: "CUD eliminato" });
  };

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex items-center gap-4"><Skeleton className="h-9 w-24" /><Skeleton className="h-9 flex-1" /></div>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (!employee) return <div className="text-center py-12 text-muted-foreground">Dipendente non trovato</div>;

  const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();
  const statusColor = employee.status === "active" ? "default" : "secondary";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Dipendenti</Button>
        </Link>
        <div className="flex-1" />
        <Link href={`/employees/${id}/edit`}>
          <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" />Modifica</Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Elimina</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminare il dipendente?</AlertDialogTitle>
              <AlertDialogDescription>Questa azione è irreversibile. Tutti i documenti associati verranno eliminati.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={deleteEmployee} className="bg-destructive text-destructive-foreground">Elimina</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => { const i = document.createElement("input"); i.type="file"; i.accept="image/*"; i.onchange=(e)=>{ const f=(e.target as HTMLInputElement).files?.[0]; if(f) uploadPhoto(f); }; i.click(); }}>
              <Avatar className="h-24 w-24">
                <AvatarImage src={employee.photoUrl || undefined} />
                <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{employee.firstName} {employee.lastName}</h1>
                <Badge variant={statusColor}>{employee.status === "active" ? "Attivo" : "Inattivo"}</Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Hash className="h-4 w-4" /><span className="font-mono text-sm">{employee.employeeCode}</span>
                {employee.mansione && <><Separator orientation="vertical" className="h-4" /><span className="text-sm">{employee.mansione}</span></>}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employee.phone && <InfoItem icon={Phone} label="Telefono" value={employee.phone} />}
            {employee.email && <InfoItem icon={Mail} label="Email" value={employee.email} />}
            {employee.fiscalCode && <InfoItem icon={Hash} label="Codice Fiscale" value={employee.fiscalCode} />}
            {employee.iban && <InfoItem icon={CreditCard} label="IBAN" value={employee.iban} />}
            {employee.birthDate && <InfoItem icon={Calendar} label="Data di nascita" value={format(new Date(employee.birthDate), "dd/MM/yyyy")} />}
            {employee.hireDate && <InfoItem icon={Building2} label="Data assunzione" value={format(new Date(employee.hireDate), "dd/MM/yyyy")} />}
            {employee.address && <InfoItem icon={MapPin} label="Indirizzo" value={employee.address} />}
          </div>

          {employee.notes && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Note</p>
              <p className="text-sm text-muted-foreground">{employee.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documenti ({employee.documents?.length || 0})</TabsTrigger>
          <TabsTrigger value="payslips">Buste Paga ({employee.payslips?.length || 0})</TabsTrigger>
          <TabsTrigger value="cuds">CUD ({employee.cuds?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Documenti</CardTitle>
              <Button size="sm" onClick={() => setUploadDocOpen(true)}><Plus className="mr-2 h-4 w-4" />Carica</Button>
            </CardHeader>
            <CardContent>
              {employee.documents?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessun documento</p>
              ) : (
                <div className="space-y-2">
                  {employee.documents?.map((doc: any) => {
                    const expired = doc.endDate && new Date(doc.endDate) < new Date();
                    const expiringSoon = doc.endDate && !expired && differenceInDays(new Date(doc.endDate), new Date()) <= 30;
                    return (
                      <div key={doc.id} className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{doc.category}</span>
                            {doc.endDate && (
                              <span className={`text-xs flex items-center gap-1 ${expired ? "text-destructive" : expiringSoon ? "text-yellow-600" : "text-green-600"}`}>
                                {expired ? <AlertTriangle className="h-3 w-3" /> : expiringSoon ? <Clock className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                                Scade: {format(new Date(doc.endDate), "dd/MM/yyyy")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                          </a>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDocument(doc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payslips" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Buste Paga</CardTitle>
              <Button size="sm" onClick={() => setUploadPayslipOpen(true)}><Plus className="mr-2 h-4 w-4" />Carica</Button>
            </CardHeader>
            <CardContent>
              {employee.payslips?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessuna busta paga</p>
              ) : (
                <div className="space-y-2">
                  {employee.payslips?.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors">
                      <Banknote className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"][p.month - 1]} {p.year}</p>
                        <p className="text-xs text-muted-foreground">{p.fileName}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <a href={p.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                        </a>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePayslip(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cuds" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">CUD</CardTitle>
              <Button size="sm" onClick={() => setUploadCudOpen(true)}><Plus className="mr-2 h-4 w-4" />Carica</Button>
            </CardHeader>
            <CardContent>
              {employee.cuds?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessun CUD</p>
              ) : (
                <div className="space-y-2">
                  {employee.cuds?.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors">
                      <FileStack className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">CUD {c.year}</p>
                        <p className="text-xs text-muted-foreground">{c.fileName}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <a href={c.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                        </a>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCud(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UploadDocDialog open={uploadDocOpen} onOpenChange={setUploadDocOpen} onSubmit={uploadDocument} uploading={uploading} />
      <UploadPayslipDialog open={uploadPayslipOpen} onOpenChange={setUploadPayslipOpen} onSubmit={uploadPayslip} uploading={uploading} />
      <UploadCudDialog open={uploadCudOpen} onOpenChange={setUploadCudOpen} onSubmit={uploadCud} uploading={uploading} />
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function UploadDocDialog({ open, onOpenChange, onSubmit, uploading }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Altro");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name || file.name);
    fd.append("category", category);
    if (startDate) fd.append("startDate", startDate);
    if (endDate) fd.append("endDate", endDate);
    if (notes) fd.append("notes", notes);
    onSubmit(fd);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Carica Documento</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>File *</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome documento" /></div>
          <div>
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Data inizio</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><Label>Data scadenza</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
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

function UploadPayslipDialog({ open, onOpenChange, onSubmit, uploading }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));

  const handleSubmit = () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("year", year);
    fd.append("month", month);
    onSubmit(fd);
  };

  const months = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Carica Busta Paga</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>File *</Label><Input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Anno</Label>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} min="2000" max="2099" />
            </div>
            <div>
              <Label>Mese</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{months.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleSubmit} disabled={!file || uploading}>{uploading ? "Caricamento..." : "Carica"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadCudDialog({ open, onOpenChange, onSubmit, uploading }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const handleSubmit = () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("year", year);
    onSubmit(fd);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Carica CUD</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>File *</Label><Input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
          <div><Label>Anno</Label><Input type="number" value={year} onChange={(e) => setYear(e.target.value)} min="2000" max="2099" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleSubmit} disabled={!file || uploading}>{uploading ? "Caricamento..." : "Carica"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
