"use client";

import {Button} from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {SidebarInset, SidebarTrigger} from "@workspace/ui/components/sidebar";
import {ProtectedRoute} from "@/components/protected-route";
import {useAuth} from "@/components/auth-provider";
import {logout} from "@/lib/auth";
import {AppSidebar} from "@/components/app-sidebar";

export default function Layout({children}: {children: React.ReactNode}) {
  const {user} = useAuth();

  return (
    <ProtectedRoute>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>
        {children}
      </SidebarInset>
    </ProtectedRoute>
  );
}
