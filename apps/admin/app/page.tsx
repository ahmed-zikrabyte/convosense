"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";

export default function Page() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <Link href="/login">
          <Button size="sm">Login</Button>
        </Link>
      </div>
    </div>
  );
}
