import React from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ArrowRightLeft, 
  PlusCircle, 
  Printer,
  LogOut,
  UserCog
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const NAV_ITEMS = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/transactions", label: "Audit Log", icon: ArrowRightLeft },
    ...(user?.role === 'admin' ? [{ href: "/users", label: "Users", icon: UserCog }] : []),
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-sidebar text-sidebar-foreground flex flex-col flex-shrink-0 border-r border-sidebar-border shrink-0 md:sticky md:top-0 md:h-[100dvh]">
        <div className="p-6 flex flex-col items-center gap-3 border-b border-sidebar-border/50">
          <div className="bg-[#0a0f1e] p-3 rounded-xl w-full flex justify-center">
            <img src="/elite-logo.png" alt="Elite Fire Protection Systems" className="h-10 object-contain" />
          </div>
          <div className="text-center">
            <p className="text-xs text-sidebar-foreground/80 font-medium tracking-wide">Elite Fire Protection Systems W.L.L.</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto">
          <div className="mb-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-2">Menu</div>
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80")} />
                {item.label}
              </Link>
            );
          })}

          <div className="mt-8 mb-4 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-2">Quick Actions</div>
          <Link href="/transactions/new" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            <PlusCircle className="w-5 h-5" />
            Issue Ink
          </Link>
        </nav>

        <div className="p-4 mt-auto border-t border-sidebar-border/50 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName || user?.username}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 md:px-8 border-b bg-card sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <Printer className="w-4 h-4" />
            <span>Facility Management</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-foreground">
            <span className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> System Online
            </span>
          </div>
        </header>
        <div className="flex-1 p-6 md:p-8 overflow-x-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
