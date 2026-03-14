"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api, { Item } from "@/lib/api";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatPrice } from "@/lib/utils";

interface ContribNote {
  contributor_name: string;
  amount: number;
  note: string | null;
}

interface ItemCardProps {
  item: Item;
  isOwner?: boolean;
  index?: number;
  onEdit?: (item: Item) => void;
  onRefresh: () => void;
  guestActions?: React.ReactNode;
  contributionNotes?: ContribNote[];
}

const STATUS_CONFIG = {
  available:  { label: "Свободен",       dot: "#4ade80" },
  reserved:   { label: "Зарезервирован", dot: "#f59e0b" },
  collecting: { label: "Идёт сбор",      dot: "#818cf8" },
  collected:  { label: "Собрано",        dot: "#22c55e" },
  deleted:    { label: "Снят",           dot: "#ef4444" },
};

export default function ItemCard({ item, isOwner, index = 0, onEdit, onRefresh, guestActions, contributionNotes }: ItemCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Удалить товар?")) return;
    setDeleting(true);
    try {
      await api.delete(`/wishlists/${item.wishlist_id}/items/${item.id}`);
      onRefresh();
      toast.success("Товар удалён");
    } catch {
      toast.error("Ошибка");
      setDeleting(false);
    }
  };

  const status = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.available;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="icard"
    >
      {item.image_url && (
        <div className="icard-img">
          <img src={item.image_url} alt={item.title} />
        </div>
      )}

      <div className="icard-body">
        {/* Status + price row */}
        <div className="icard-meta">
          <span className="icard-status">
            <span className="icard-dot" style={{ background: status.dot }} />
            {status.label}
          </span>
          {item.price && (
            <span className="icard-price">{formatPrice(item.price, item.currency)}</span>
          )}
        </div>

        {/* Title */}
        <h3 className="icard-title">{item.title}</h3>

        {/* Link */}
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="icard-link">
            <LinkIcon /> Открыть ссылку
          </a>
        )}

        {/* Description */}
        {item.description && (
          <p className="icard-desc">{item.description}</p>
        )}

        {/* Progress bar */}
        {item.is_group_gift && item.target_amount && (
          <ProgressBar
            current={item.contribution_summary?.total_collected ?? 0}
            target={item.target_amount}
          />
        )}

        {/* Contribution notes (visible to guests, not owner) */}
        {contributionNotes && contributionNotes.length > 0 && (
          <div className="icard-contrib-notes">
            {contributionNotes.map((c, i) => (
              <div key={i} className="icard-contrib-note">
                <span className="icard-contrib-name">{c.contributor_name}</span>
                <span className="icard-contrib-amount">{formatPrice(c.amount)}</span>
                {c.note && <span className="icard-contrib-text">«{c.note}»</span>}
              </div>
            ))}
          </div>
        )}

        {/* Guest actions */}
        {guestActions && <div className="icard-actions">{guestActions}</div>}

        {/* Owner actions */}
        {isOwner && item.status !== "deleted" && (
          <div className="icard-actions">
            <button className="icard-btn-edit" onClick={() => onEdit?.(item)}>
              <EditIcon /> Изменить
            </button>
            <button className="icard-btn-delete" onClick={handleDelete} disabled={deleting}>
              {deleting ? <span className="icard-spinner" /> : <TrashIcon />}
              Удалить
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LinkIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
}
function EditIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function TrashIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}
