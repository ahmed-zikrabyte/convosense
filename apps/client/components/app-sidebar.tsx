"use client";

import {
  Home,
  Settings,
  User,
  LogOut,
  BarChart3,
  Calendar,
  FileText,
  LayoutDashboard,
  Megaphone,
  Users,
  Zap,
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

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const {user} = useAuth();
  const pathname = usePathname();
  const {open, setOpen} = useSidebar();

  const sidebarItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      description: "Overview & Analytics",
    },
    {
      name: "Campaigns",
      href: "/campaigns",
      icon: Megaphone,
      description: "Manage AI Campaigns",
    },
    {
      name: "Call Reports",
      href: "/call-reports",
      icon: FileText,
      description: "View Call Analytics",
    },
    {
      name: "Analytics",
      href: "#",
      icon: BarChart3,
      description: "Performance Reports",
      badge: "Pro",
    },
    {
      name: "Leads",
      href: "#",
      icon: Users,
      description: "Contact Management",
      badge: "Pro",
    },
    {
      name: "Scheduler",
      href: "#",
      icon: Calendar,
      description: "Automated Timing",
      badge: "Pro",
    },
    {
      name: "Test Call",
      href: "#",
      icon: Zap,
      description: "Try AI Agent",
      badge: "Pro",
    },
    {
      name: "Settings",
      href: "#",
      icon: Settings,
      description: "System Configuration",
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex flex-col gap-2 p-2">
          <h2 className="text-lg font-semibold">
            {open ? "Client Dashboard" : "CD"}
          </h2>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={cn(
                        "group flex items-center gap-3 rounded-lg  text-sm font-medium transition-all",
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
                          {item.badge && (
                            <span
                              className={cn(
                                "text-xs px-1.5 py-0.5 rounded-full font-medium",
                                item.badge === "Pro"
                                  ? "bg-yellow-600 text-white"
                                  : "bg-green-600 text-white"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
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
