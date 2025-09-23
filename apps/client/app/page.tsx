"use client";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/components/auth-provider";
import { logout } from "@/lib/auth";

function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
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
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  );
}
