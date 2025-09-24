"use client";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { SidebarInset, SidebarTrigger } from "@workspace/ui/components/sidebar";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/components/auth-provider";
import { logout } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";

function HomePage() {
  const { user } = useAuth();

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Welcome!</CardTitle>
                <CardDescription>
                  You are successfully logged in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Name:</p>
                  <p className="font-medium">{user?.name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Email:</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Role:</p>
                  <p className="font-medium capitalize">{user?.role}</p>
                </div>
                <Button onClick={logout} variant="outline" className="w-full">
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  );
}
