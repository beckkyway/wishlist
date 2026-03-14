"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      localStorage.setItem("jwt_token", token);
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-text-muted">Входим...</div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
