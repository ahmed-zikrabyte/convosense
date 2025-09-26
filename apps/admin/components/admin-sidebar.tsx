"use client";

import {
  Home,
  Settings,
  Users,
  LogOut,
  BarChart3,
  Shield,
  Database,
  LayoutDashboard,
  UserCheck,
  FileText,
  Bell,
  Phone,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import {useAuth} from "@/components/auth-provider";
import {logout} from "@/lib/auth";
import {usePathname} from "next/navigation";
import {cn} from "@workspace/ui/lib/utils";
import Link from "next/link";

export function AdminSidebar() {
  const {user} = useAuth();
  const pathname = usePathname();
  const {open, setOpen} = useSidebar();

  const sidebarItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      description: "Overview & Analytics",
    },
    {
      name: "Users Management",
      href: "/users",
      icon: Users,
      description: "Manage System Users",
    },
    {
      name: "Clients Management",
      href: "/clients",
      icon: UserCheck,
      description: "Manage Client Accounts",
    },
    {
      name: "Phone Number Management",
      href: "/phone-numbers",
      icon: Phone,
      description: "Manage Client Accounts",
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      description: "System Analytics",
    },
    {
      name: "Reports",
      href: "/reports",
      icon: FileText,
      description: "System Reports",
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
      description: "System Notifications",
    },
    {
      name: "Database",
      href: "/database",
      icon: Database,
      description: "Database Management",
      adminOnly: true,
    },
    {
      name: "System Settings",
      href: "/system-settings",
      icon: Settings,
      description: "System Configuration",
      adminOnly: true,
    },
    {
      name: "Security",
      href: "/security",
      icon: Shield,
      description: "Security Settings",
      adminOnly: true,
    },
  ];

  const filteredItems = sidebarItems.filter(
    (item) => !item.adminOnly || user?.role === "super_admin"
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex flex-col gap-2 p-2">
          <h2 className="text-lg font-semibold">
            {open ? "Admin Panel" : "AP"}
          </h2>
          {user && open && (
            <div className="text-xs text-muted-foreground">
              {user.name} ({user.role})
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={cn(
                        "group flex items-center gap-3 rounded-lg text-sm font-medium transition-all",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        open ? "px-3 py-3" : "p-0"
                      )}
                    >
                      <div
                        className={cn(
                          "p-1.5 rounded-md transition-colors",
                          isActive
                            ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
                            : "bg-sidebar-accent text-muted-foreground group-hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 text-destructive hover:text-destructive/90"
              >
                <LogOut />
                <span>Logout</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
