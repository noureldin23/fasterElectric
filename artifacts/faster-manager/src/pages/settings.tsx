import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Upload, Save, Image, Lock } from "lucide-react";
import logoPath from "@assets/image_1780684121659.png";

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  const token = localStorage.getItem("fm_token");

  useEffect(() => {
    fetch("/api/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setSiteName(d.siteName || "Faster Manager");
        setLogoUrl(d.logoUrl || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveSiteName = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ siteName }),
      });
      if (res.ok) toast({ title: "Impostazioni salvate" });
      else toast({ title: "Errore nel salvataggio", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", logoFile);
      const res = await fetch("/api/settings/logo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const d = await res.json();
        setLogoUrl(d.logoUrl);
        setLogoPreview(null);
        setLogoFile(null);
        toast({ title: "Logo aggiornato" });
        window.location.reload();
      } else {
        toast({ title: "Errore nel caricamento", variant: "destructive" });
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Le password non corrispondono", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "La password deve avere almeno 6 caratteri", variant: "destructive" });
      return;
    }
    setChangingPwd(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        toast({ title: "Password cambiata con successo" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const d = await res.json();
        toast({ title: d.error || "Errore nel cambio password", variant: "destructive" });
      }
    } finally {
      setChangingPwd(false);
    }
  };

  if (loading) return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  const currentLogo = logoPreview || logoUrl || logoPath;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Impostazioni</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />Impostazioni Sito
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Nome del sito</Label>
            <div className="flex gap-2">
              <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Faster Manager" className="flex-1" />
              <Button onClick={saveSiteName} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />{saving ? "Salvo..." : "Salva"}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-32 rounded-md border flex items-center justify-center overflow-hidden bg-muted">
                <img src={currentLogo} alt="Logo" className="h-full w-full object-contain p-2" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer">
                  <Input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                  <span className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border hover:bg-muted transition-colors cursor-pointer">
                    <Image className="h-4 w-4" />Scegli immagine
                  </span>
                </label>
                {logoFile && (
                  <Button size="sm" onClick={uploadLogo} disabled={uploadingLogo}>
                    <Upload className="mr-2 h-4 w-4" />{uploadingLogo ? "Caricamento..." : "Carica logo"}
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Carica il logo dell'azienda. Formati supportati: PNG, JPG, SVG.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />Sicurezza
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Password attuale</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nuova password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Conferma nuova password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button onClick={changePassword} disabled={changingPwd || !currentPassword || !newPassword}>
            {changingPwd ? "Cambio in corso..." : "Cambia Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
