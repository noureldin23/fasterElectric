import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  Files,
  CalendarDays,
  Activity,
  Search,
  Database,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { useGetSettings } from "@workspace/api-client-react";
import logoPath from "@assets/image_1780684121659.png";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Dipendenti", href: "/employees", icon: Users },
  { name: "Documenti Aziendali", href: "/company-documents", icon: Files },
  { name: "Scadenze", href: "/expirations", icon: CalendarDays },
  { name: "Attività", href: "/activities", icon: Activity },
  { name: "Cerca", href: "/search", icon: Search },
];

const secondaryNavigation = [
  { name: "Backup", href: "/backup", icon: Database },
  { name: "Impostazioni", href: "/settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: settings } = useGetSettings();

  const siteName = settings?.siteName || "Faster Manager";
  const logoUrl = settings?.logoUrl || logoPath;

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <div className="flex flex-col gap-1 w-full">
      {navigation.map((item) => {
        const isActive = location.startsWith(item.href);
        return (
          <Link key={item.name} href={item.href} onClick={onClick}>
            <span
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </span>
          </Link>
        );
      })}
      
      <div className="my-4 border-t border-sidebar-border" />
      
      {secondaryNavigation.map((item) => {
        const isActive = location.startsWith(item.href);
        return (
          <Link key={item.name} href={item.href} onClick={onClick}>
            <span
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-full text-sidebar-foreground">
        <div className="p-6 flex items-center gap-3">
          <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
          <span className="font-bold text-lg tracking-tight truncate">{siteName}</span>
        </div>
        <div className="flex-1 px-4 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium truncate">{user?.username}</span>
              <span className="text-xs text-muted-foreground">Amministratore</span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="text-sidebar-foreground hover:bg-sidebar-accent">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="lg:hidden flex items-center justify-between p-4 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Logo" className="h-7 w-auto object-contain" />
            <span className="font-bold text-lg truncate">{siteName}</span>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar border-r-sidebar-border p-0 flex flex-col">
              <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
                <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                <span className="font-bold text-lg text-sidebar-foreground">{siteName}</span>
              </div>
              <div className="flex-1 px-4 py-4 overflow-y-auto">
                <NavLinks onClick={() => setMobileMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
          <div className="max-w-7xl mx-auto h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
