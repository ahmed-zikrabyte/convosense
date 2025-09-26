"use client";

import {SidebarInset, SidebarTrigger} from "@workspace/ui/components/sidebar";
import {ProtectedRoute} from "@/components/protected-route";
import {useAuth} from "@/components/auth-provider";
import {AdminSidebar} from "@/components/admin-sidebar";

export default function Layout({children}: {children: React.ReactNode}) {
  const {user} = useAuth();

  return (
    <ProtectedRoute>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16  shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1 cursor-pointer" />
        </header>
        {children}
      </SidebarInset>
    </ProtectedRoute>
  );
}
