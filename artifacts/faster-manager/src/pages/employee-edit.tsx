import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

const MANSIONI = ["Elettricista", "Caposquadra", "Installatore", "Tecnico", "Amministrativo", "Operaio", "Responsabile", "Altro"];

export default function EmployeeEdit() {
  const [, params] = useRoute("/employees/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = params?.id!;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = localStorage.getItem("fm_token");
    fetch(`/api/employees/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setForm({
          firstName: d.firstName || "",
          lastName: d.lastName || "",
          employeeCode: d.employeeCode || "",
          phone: d.phone || "",
          email: d.email || "",
          fiscalCode: d.fiscalCode || "",
          iban: d.iban || "",
          birthDate: d.birthDate || "",
          hireDate: d.hireDate || "",
          mansione: d.mansione || "",
          address: d.address || "",
          status: d.status || "active",
          notes: d.notes || "",
        });
        setLoading(false);
      });
  }, [id]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) {
      toast({ title: "Nome e cognome sono richiesti", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("fm_token");
      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: "Dipendente aggiornato" });
        setLocation(`/employees/${id}`);
      } else {
        toast({ title: "Errore nel salvataggio", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-[600px] w-full" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/employees/${id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Indietro</Button>
        </Link>
        <h1 className="text-2xl font-bold">Modifica Dipendente</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Dati Personali</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.firstName} onChange={set("firstName")} required />
              </div>
              <div className="space-y-2">
                <Label>Cognome *</Label>
                <Input value={form.lastName} onChange={set("lastName")} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Codice Dipendente</Label>
                <Input value={form.employeeCode} onChange={set("employeeCode")} />
              </div>
              <div className="space-y-2">
                <Label>Stato</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Attivo</SelectItem>
                    <SelectItem value="inactive">Inattivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input type="tel" value={form.phone} onChange={set("phone")} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={set("email")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Codice Fiscale</Label>
                <Input value={form.fiscalCode} onChange={set("fiscalCode")} className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input value={form.iban} onChange={set("iban")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data di Nascita</Label>
                <Input type="date" value={form.birthDate} onChange={set("birthDate")} />
              </div>
              <div className="space-y-2">
                <Label>Data Assunzione</Label>
                <Input type="date" value={form.hireDate} onChange={set("hireDate")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mansione</Label>
              <Select value={form.mansione || "none"} onValueChange={(v) => setForm((p) => ({ ...p, mansione: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Seleziona mansione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuna</SelectItem>
                  {MANSIONI.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Indirizzo</Label>
              <Input value={form.address} onChange={set("address")} />
            </div>

            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea value={form.notes} onChange={set("notes")} rows={3} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link href={`/employees/${id}`}>
                <Button type="button" variant="outline">Annulla</Button>
              </Link>
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />{saving ? "Salvataggio..." : "Salva"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
