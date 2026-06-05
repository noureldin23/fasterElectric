import { useCreateEmployee } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";

const formSchema = z.object({
  employeeCode: z.string().optional(),
  firstName: z.string().min(1, "Il nome è obbligatorio"),
  lastName: z.string().min(1, "Il cognome è obbligatorio"),
  phone: z.string().optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  fiscalCode: z.string().optional(),
  iban: z.string().optional(),
  birthDate: z.string().optional(),
  hireDate: z.string().optional(),
  mansione: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["active", "inactive", "dismissed"]).default("active"),
  notes: z.string().optional(),
});

export default function EmployeeNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createEmployee = useCreateEmployee();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      status: "active" as const,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Clean up empty strings to undefined to match optional schema
    const data = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v === "" ? undefined : v])
    );
    
    createEmployee.mutate(
      { data: data as any },
      {
        onSuccess: (employee) => {
          toast({ title: "Dipendente creato con successo" });
          setLocation(`/employees/${employee.id}`);
        },
        onError: () => {
          toast({
            title: "Errore durante la creazione",
            description: "Verifica i dati inseriti e riprova",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/employees")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Nuovo Dipendente</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dati Anagrafici</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl><Input placeholder="Mario" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cognome *</FormLabel>
                    <FormControl><Input placeholder="Rossi" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="employeeCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice Dipendente</FormLabel>
                    <FormControl><Input placeholder="EMP001" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fiscalCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice Fiscale</FormLabel>
                    <FormControl><Input placeholder="RSSMRA..." className="uppercase" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="mario.rossi@example.com" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl><Input placeholder="+39 ..." {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="birthDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data di Nascita</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indirizzo</FormLabel>
                    <FormControl><Input placeholder="Via Roma 1, Milano" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="hireDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Assunzione</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mansione" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mansione</FormLabel>
                    <FormControl><Input placeholder="Elettricista" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="iban" render={({ field }) => (
                  <FormItem>
                    <FormLabel>IBAN</FormLabel>
                    <FormControl><Input placeholder="IT..." className="uppercase" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stato</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona stato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Attivo</SelectItem>
                        <SelectItem value="dismissed">Dimesso</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="border-t pt-6">
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Note aggiuntive..." className="min-h-[100px]" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end gap-4 border-t pt-6">
                <Button type="button" variant="outline" onClick={() => setLocation("/employees")}>
                  Annulla
                </Button>
                <Button type="submit" disabled={createEmployee.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createEmployee.isPending ? "Salvataggio..." : "Salva Dipendente"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
