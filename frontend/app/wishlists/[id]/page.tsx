"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api, { Item, Wishlist } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import ItemCard from "@/components/wishlist/ItemCard";
import ItemForm from "@/components/wishlist/ItemForm";
import { getShareUrl } from "@/lib/utils";
import RealtimeProvider from "@/components/realtime/RealtimeProvider";

const OCCASION_EMOJI: Record<string, string> = {
  "День рождения": "🎂", "Свадьба": "💍", "Новый год": "🎄",
  "Юбилей": "🥂", "Выпускной": "🎓", "Другое": "✨",
};

export default function WishlistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const { data: wishlist } = useQuery<Wishlist>({
    queryKey: ["wishlist", id],
    queryFn: () => api.get(`/wishlists/${id}`).then((r) => r.data),
    enabled: !!user,
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: ["items", id],
    queryFn: () => api.get(`/wishlists/${id}/items`).then((r) => r.data),
    enabled: !!user,
  });

  const handleShare = () => {
    if (!wishlist) return;
    navigator.clipboard.writeText(getShareUrl(wishlist.share_token));
    toast.success("Ссылка скопирована!");
  };

  const handleEdit = (item: Item) => { setEditItem(item); setFormOpen(true); };
  const handleRefresh = () => queryClient.invalidateQueries({ queryKey: ["items", id] });

  if (loading || !user) {
    return <div className="dash-loading"><div className="dash-loading-spinner" /></div>;
  }

  const visibleItems = items?.filter((i) => i.status !== "deleted") ?? [];
  const icon = wishlist?.occasion ? (OCCASION_EMOJI[wishlist.occasion] ?? "🎁") : "🎁";

  return (
    <RealtimeProvider wishlistId={id} onUpdate={handleRefresh}>
      <div className="dash-root">
        <header className="dash-header">
          <div className="dash-header-inner">
            <div className="nw-header-left">
              <button onClick={() => router.push("/dashboard")} className="nw-back">
                <BackIcon />
              </button>
              <div className="wl-header-title">
                <span className="wl-header-name">{wishlist?.title ?? "Вишлист"}</span>
                {wishlist?.occasion && (
                  <span className="wl-header-occasion">{icon} {wishlist.occasion}</span>
                )}
              </div>
            </div>
            <button onClick={handleShare} className="wl-share-btn">
              <ShareIcon />
              <span>Поделиться</span>
            </button>
          </div>
        </header>

        <main className="dash-main">
          {visibleItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-glow" />
              <div className="empty-icon">🛍️</div>
              <h2 className="empty-title">Список пуст</h2>
              <p className="empty-text">Добавь первый подарок в вишлист</p>
              <button onClick={() => setFormOpen(true)} className="empty-btn">
                <PlusIcon /> Добавить товар
              </button>
            </div>
          ) : (
            <>
              <div className="dash-topbar">
                <div>
                  <h1 className="dash-title">{visibleItems.length} {pluralize(visibleItems.length)}</h1>
                </div>
                <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="dash-create-btn">
                  <PlusIcon /><span>Добавить</span>
                </button>
              </div>
              <div className="dash-grid">
                {visibleItems.map((item, i) => (
                  <ItemCard key={item.id} item={item} isOwner index={i} onEdit={handleEdit} onRefresh={handleRefresh} />
                ))}
              </div>
            </>
          )}
        </main>

        <ItemForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditItem(null); }}
          wishlistId={id}
          editItem={editItem}
          onSaved={handleRefresh}
        />
      </div>
    </RealtimeProvider>
  );
}

function pluralize(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return "товар";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "товара";
  return "товаров";
}
function BackIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
}
function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4" /></svg>;
}
function ShareIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>;
}
