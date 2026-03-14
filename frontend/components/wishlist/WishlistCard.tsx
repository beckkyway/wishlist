"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/api";
import type { Wishlist } from "@/lib/api";

const OCCASION_EMOJI: Record<string, string> = {
  "День рождения": "🎂",
  "Новый год": "🎄",
  "Свадьба": "💍",
  "Юбилей": "🥂",
  "Выпускной": "🎓",
  "Рождество": "🎅",
};

export default function WishlistCard({ wishlist, index = 0, onDelete }: { wishlist: Wishlist; index?: number; onDelete?: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const date = new Date(wishlist.created_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });

  const icon = wishlist.occasion ? (OCCASION_EMOJI[wishlist.occasion] ?? "✨") : "🎁";

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Удалить вишлист «${wishlist.title}»?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/wishlists/${wishlist.id}`);
      toast.success("Вишлист удалён");
      onDelete?.();
    } catch {
      toast.error("Ошибка при удалении");
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      className="wcard-wrapper"
    >
      <Link href={`/wishlists/${wishlist.id}`} className="wcard">
        <div className="wcard-accent-line" />
        <div className="wcard-body">
          <div className="wcard-icon">{icon}</div>
          <div className="wcard-content">
            <h3 className="wcard-title">{wishlist.title}</h3>
            {wishlist.occasion && (
              <p className="wcard-occasion">{wishlist.occasion}</p>
            )}
            {wishlist.description && (
              <p className="wcard-desc">{wishlist.description}</p>
            )}
          </div>
        </div>
        <div className="wcard-footer">
          <span className="wcard-date">{date}</span>
          <span className={`wcard-badge ${wishlist.is_active ? "wcard-badge--active" : "wcard-badge--inactive"}`}>
            {wishlist.is_active ? "Активный" : "Неактивный"}
          </span>
        </div>
        <div className="wcard-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
      {onDelete && (
        <button
          className="wcard-delete-btn"
          onClick={handleDelete}
          disabled={deleting}
          title="Удалить вишлист"
        >
          {deleting ? <span className="icard-spinner" /> : <TrashIcon />}
        </button>
      )}
    </motion.div>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
