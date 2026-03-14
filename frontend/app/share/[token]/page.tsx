"use client";
import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api, { Item, Wishlist } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import ReserveButton from "@/components/wishlist/ReserveButton";
import ContributionModal from "@/components/wishlist/ContributionModal";
import RealtimeProvider from "@/components/realtime/RealtimeProvider";
import ItemCard from "@/components/wishlist/ItemCard";
import { formatPrice } from "@/lib/utils";

const OCCASION_EMOJI: Record<string, string> = {
  "День рождения": "🎂", "Свадьба": "💍", "Новый год": "🎄",
  "Юбилей": "🥂", "Выпускной": "🎓", "Другое": "✨",
};

interface DeletedContrib {
  item_id: string;
  item_title: string;
  your_amount: number;
}

interface ContribNote {
  contributor_name: string;
  amount: number;
  note: string | null;
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();

  const [guestName, setGuestName] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("guest_name") ?? "" : ""
  );
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [contribItem, setContribItem] = useState<Item | null>(null);
  const [deletedContribs, setDeletedContribs] = useState<DeletedContrib[]>([]);
  const [dismissedDeleted, setDismissedDeleted] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const raw = localStorage.getItem("dismissed_deleted_contribs");
    return new Set(raw ? JSON.parse(raw) : []);
  });
  const [contribNotes, setContribNotes] = useState<Record<string, ContribNote[]>>({});

  const { data: wishlist } = useQuery<Wishlist>({
    queryKey: ["share-wishlist", token],
    queryFn: () => api.get(`/share/${token}`).then((r) => r.data),
  });

  const reserver_token = typeof window !== "undefined"
    ? Object.keys(localStorage).filter((k) => k.startsWith("reserve_")).map((k) => localStorage.getItem(k)).find(Boolean) ?? undefined
    : undefined;

  const { data: items } = useQuery<Item[]>({
    queryKey: ["share-items", token],
    queryFn: () => api.get(`/share/${token}/items`, { params: { reserver_token } }).then((r) => r.data),
    enabled: !!wishlist,
  });

  // Check for deleted items where guest contributed
  useEffect(() => {
    if (!wishlist || typeof window === "undefined") return;
    const checks = Object.keys(localStorage)
      .filter((k) => k.startsWith("contrib_"))
      .map((k) => ({ item_id: k.replace("contrib_", ""), contributor_token: localStorage.getItem(k)! }))
      .filter((c) => c.contributor_token);

    if (checks.length === 0) return;

    api.post(`/share/${token}/check-deleted-contributions`, checks)
      .then((r) => setDeletedContribs(r.data))
      .catch(() => {});
  }, [wishlist, token]);

  // Fetch contribution notes for group gift items
  useEffect(() => {
    if (!items) return;
    const groupItems = items.filter((i) => i.is_group_gift && i.status !== "deleted");
    groupItems.forEach((item) => {
      api.get(`/share/${token}/items/${item.id}/contributions`)
        .then((r) => setContribNotes((prev) => ({ ...prev, [item.id]: r.data })))
        .catch(() => {});
    });
  }, [items, token]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["share-items", token] });
    // Re-fetch contribution notes
    if (items) {
      items.filter((i) => i.is_group_gift && i.status !== "deleted").forEach((item) => {
        api.get(`/share/${token}/items/${item.id}/contributions`)
          .then((r) => setContribNotes((prev) => ({ ...prev, [item.id]: r.data })))
          .catch(() => {});
      });
    }
  }, [queryClient, token, items]);

  const requireName = (action: () => void) => {
    if (guestName) { action(); } else { setPendingAction(() => action); setNameModalOpen(true); }
  };

  const confirmName = () => {
    if (!nameInput.trim()) return;
    localStorage.setItem("guest_name", nameInput.trim());
    setGuestName(nameInput.trim());
    setNameModalOpen(false);
    pendingAction?.();
    setPendingAction(null);
  };

  const dismissDeletedBanner = (item_id: string) => {
    const next = new Set(dismissedDeleted).add(item_id);
    setDismissedDeleted(next);
    localStorage.setItem("dismissed_deleted_contribs", JSON.stringify([...next]));
  };

  const visibleItems = items?.filter((i) => i.status !== "deleted") ?? [];
  const icon = wishlist?.occasion ? (OCCASION_EMOJI[wishlist.occasion] ?? "🎁") : "🎁";
  const visibleDeletedBanners = deletedContribs.filter((d) => !dismissedDeleted.has(d.item_id));

  if (!wishlist) {
    return <div className="dash-loading"><div className="dash-loading-spinner" /></div>;
  }

  return (
    <RealtimeProvider wishlistId={wishlist.id} onUpdate={handleRefresh}>
      <div className="share-root">
        {/* Deleted contribution banners */}
        <AnimatePresence>
          {visibleDeletedBanners.map((d) => (
            <motion.div
              key={d.item_id}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="deleted-contrib-banner"
            >
              <span>
                🗑️ Товар <strong>«{d.item_title}»</strong> был удалён владельцем.
                Ваш вклад <strong>{formatPrice(d.your_amount)}</strong> аннулирован.
              </span>
              <button onClick={() => dismissDeletedBanner(d.item_id)} className="deleted-contrib-dismiss">✕</button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Hero */}
        <div className="share-hero">
          <div className="share-hero-glow" />
          <div className="share-hero-icon">{icon}</div>
          <h1 className="share-hero-title">{wishlist.title}</h1>
          {wishlist.occasion && <p className="share-hero-occasion">{wishlist.occasion}</p>}
          {wishlist.description && <p className="share-hero-desc">{wishlist.description}</p>}
          {guestName ? (
            <div className="share-guest-chip">
              <span>👤 {guestName}</span>
              <button onClick={() => { setNameInput(guestName); setNameModalOpen(true); }}>изменить</button>
            </div>
          ) : (
            <button className="share-name-btn" onClick={() => setNameModalOpen(true)}>
              Представиться
            </button>
          )}
        </div>

        {/* Items */}
        <main className="dash-main">
          {visibleItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-glow" />
              <div className="empty-icon">🛍️</div>
              <h2 className="empty-title">Список пока пуст</h2>
              <p className="empty-text">Владелец ещё не добавил подарки</p>
            </div>
          ) : (
            <div className="dash-grid">
              <AnimatePresence>
                {visibleItems.map((item, i) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={i}
                    onRefresh={handleRefresh}
                    contributionNotes={contribNotes[item.id]}
                    guestActions={
                      <div style={{ display: "flex", gap: 8 }}>
                        {item.status !== "collected" && (
                          <ReserveButton item={item} guestName={guestName} onRefresh={handleRefresh} requireName={requireName} />
                        )}
                        {(item.is_group_gift || item.status === "collecting") && item.status !== "collected" && (
                          <button className="icard-btn-contribute" onClick={() => requireName(() => setContribItem(item))}>
                            Скинуться
                          </button>
                        )}
                      </div>
                    }
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>

        {/* Name modal */}
        <Modal open={nameModalOpen} onClose={() => setNameModalOpen(false)} title="Как вас зовут?">
          <div className="mform">
            <p className="share-modal-hint">Введите имя, чтобы зарезервировать или поддержать подарок.</p>
            <div className="mform-field">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Александр"
                onKeyDown={(e) => e.key === "Enter" && confirmName()}
                autoFocus
                className="mform-input"
              />
            </div>
            <div className="mform-footer">
              <button className="mform-btn-submit" style={{ flex: 1 }} onClick={confirmName} disabled={!nameInput.trim()}>
                Продолжить
              </button>
            </div>
          </div>
        </Modal>

        {contribItem && (
          <ContributionModal
            open={!!contribItem}
            onClose={() => setContribItem(null)}
            item={contribItem}
            guestName={guestName}
            onSaved={handleRefresh}
          />
        )}
      </div>
    </RealtimeProvider>
  );
}
