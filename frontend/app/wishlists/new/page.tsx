"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/api";

const OCCASIONS = [
  { label: "День рождения", emoji: "🎂" },
  { label: "Свадьба", emoji: "💍" },
  { label: "Новый год", emoji: "🎄" },
  { label: "Юбилей", emoji: "🥂" },
  { label: "Выпускной", emoji: "🎓" },
  { label: "Другое", emoji: "✨" },
];

export default function NewWishlistPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occasion, setOccasion] = useState("");
  const [occasionDate, setOccasionDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (!token) router.replace("/login");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post<{ id: string }>("/wishlists", {
        title,
        description,
        occasion,
        occasion_date: occasionDate || null,
      });
      router.push(`/wishlists/${data.id}`);
    } catch {
      toast.error("Не удалось создать вишлист");
      setLoading(false);
    }
  };

  const selectedOccasion = OCCASIONS.find((o) => o.label === occasion);

  return (
    <div className="nw-root">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-inner">
          <div className="nw-header-left">
            <button onClick={() => router.back()} className="nw-back">
              <BackIcon />
            </button>
            <div className="dash-brand">
              <span className="dash-brand-icon">🎁</span>
              <span className="dash-brand-name">Wishlist</span>
            </div>
          </div>
          <Link href="/dashboard" className="nw-cancel">Отмена</Link>
        </div>
      </header>

      <main className="nw-main">
        {/* Page title */}
        <div className="nw-hero">
          <div className="nw-hero-icon">
            {selectedOccasion ? selectedOccasion.emoji : "🎁"}
          </div>
          <h1 className="nw-hero-title">Новый вишлист</h1>
          <p className="nw-hero-subtitle">Создай список желаний и поделись с друзьями</p>
        </div>

        <form onSubmit={handleSubmit} className="nw-form">
          {/* Title */}
          <div className="nw-field">
            <label className="nw-label">
              Название <span className="nw-required">*</span>
            </label>
            <input
              className="nw-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Мой вишлист на день рождения"
              required
            />
          </div>

          {/* Description */}
          <div className="nw-field">
            <label className="nw-label">
              Описание <span className="nw-optional">необязательно</span>
            </label>
            <textarea
              className="nw-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Небольшой комментарий для друзей..."
              rows={3}
            />
          </div>

          {/* Occasion */}
          <div className="nw-field">
            <label className="nw-label">Повод</label>
            <div className="nw-occasions">
              {OCCASIONS.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setOccasion(occasion === o.label ? "" : o.label)}
                  className={`nw-occasion ${occasion === o.label ? "nw-occasion--active" : ""}`}
                >
                  <span className="nw-occasion-emoji">{o.emoji}</span>
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Occasion date */}
          <div className="nw-field">
            <label className="nw-label">
              Дата события <span className="nw-optional">необязательно</span>
            </label>
            <input
              type="date"
              className="nw-input"
              value={occasionDate}
              onChange={(e) => setOccasionDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading || !title.trim()} className="nw-submit">
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              <>
                <span>Создать вишлист</span>
                <ArrowIcon />
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
