import { useAuth } from "@/hooks/use-auth";
import { useLogin } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useGetSettings } from "@workspace/api-client-react";
import logoPath from "@assets/image_1780684121659.png";

const formSchema = z.object({
  username: z.string().min(1, "Il nome utente è obbligatorio"),
  password: z.string().min(1, "La password è obbligatoria"),
});

export default function Login() {
  const { login: setAuthContext } = useAuth();
  const { toast } = useToast();
  const login = useLogin();
  const { data: settings } = useGetSettings();
  
  const siteName = settings?.siteName || "Faster Manager";
  const logoUrl = settings?.logoUrl || logoPath;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    login.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setAuthContext(data.token, data.admin);
        },
        onError: () => {
          toast({
            title: "Errore di accesso",
            description: "Credenziali non valide",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md p-8 bg-card rounded-xl shadow-lg border border-border">
        <div className="flex flex-col items-center mb-8">
          <img src={logoUrl} alt="Logo" className="h-16 mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-foreground">{siteName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Area Riservata Amministratore</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Utente</FormLabel>
                  <FormControl>
                    <Input placeholder="admin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? "Accesso in corso..." : "Accedi"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
