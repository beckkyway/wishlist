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

function getCountdown(occasionDate: string | null): string | null {
  if (!occasionDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(occasionDate);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Сегодня!";
  if (diff === 1) return "Завтра";
  if (diff > 0) return `через ${diff} дн.`;
  return null;
}

export default function WishlistCard({ wishlist, index = 0, onDelete }: { wishlist: Wishlist; index?: number; onDelete?: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/share/${wishlist.share_token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Ссылка скопирована");
  };
  const date = new Date(wishlist.created_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });

  const icon = wishlist.occasion ? (OCCASION_EMOJI[wishlist.occasion] ?? "✨") : "🎁";
  const countdown = getCountdown(wishlist.occasion_date);

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
      <Link href={`/share/${wishlist.share_token}`} className="wcard">
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {countdown && (
              <span className="wcard-countdown">{countdown}</span>
            )}
            <span className={`wcard-badge ${wishlist.is_active ? "wcard-badge--active" : "wcard-badge--inactive"}`}>
              {wishlist.is_active ? "Активный" : "Неактивный"}
            </span>
          </div>
        </div>
        <div className="wcard-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
      <button
        className="wcard-copy-btn"
        onClick={handleCopy}
        title="Скопировать ссылку"
      >
        <CopyIcon />
      </button>
      <Link
        href={`/wishlists/${wishlist.id}`}
        className="wcard-manage-btn"
        onClick={(e) => e.stopPropagation()}
        title="Управлять вишлистом"
      >
        <EditIcon />
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

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
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
