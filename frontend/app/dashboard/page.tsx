"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api, { Wishlist } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import WishlistCard from "@/components/wishlist/WishlistCard";
import WishlistEmpty from "@/components/wishlist/WishlistEmpty";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const { data: wishlists, isLoading } = useQuery<Wishlist[]>({
    queryKey: ["wishlists"],
    queryFn: () => api.get("/wishlists").then((r) => r.data),
    enabled: !!user,
  });

  if (loading || !user) {
    return (
      <div className="dash-loading">
        <div className="dash-loading-spinner" />
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="dash-root">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-inner">
          <div className="dash-brand">
            <span className="dash-brand-icon">🎁</span>
            <span className="dash-brand-name">Wishlist</span>
          </div>
          <div className="dash-header-right">
            <span className="dash-user-name">{user.name}</span>
            <div className="dash-avatar">{initials}</div>
            <button className="dash-logout" onClick={logout}>
              <LogoutIcon />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </header>

      <main className="dash-main">
        {/* Top bar */}
        <div className="dash-topbar">
          <div>
            <h1 className="dash-title">Мои вишлисты</h1>
            {wishlists?.length ? (
              <p className="dash-subtitle">
                {wishlists.length} {pluralize(wishlists.length)}
              </p>
            ) : null}
          </div>
          <Link href="/wishlists/new" className="dash-create-btn">
            <PlusIcon />
            <span>Создать</span>
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="dash-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="dash-skeleton" />
            ))}
          </div>
        ) : wishlists?.length ? (
          <div className="dash-grid">
            {wishlists.map((w, i) => (
              <WishlistCard
                key={w.id}
                wishlist={w}
                index={i}
                onDelete={() => queryClient.invalidateQueries({ queryKey: ["wishlists"] })}
              />
            ))}
          </div>
        ) : (
          <WishlistEmpty />
        )}
      </main>
    </div>
  );
}

function pluralize(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return "вишлист";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "вишлиста";
  return "вишлистов";
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 4v16m8-8H4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
