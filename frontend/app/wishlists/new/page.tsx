"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/api";

const MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const today = new Date();
  const initYear = value ? parseInt(value.split("-")[0]) : today.getFullYear();
  const initMonth = value ? parseInt(value.split("-")[1]) - 1 : today.getMonth();
  const initDay = value ? parseInt(value.split("-")[2]) : today.getDate();

  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [day, setDay] = useState(initDay);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() + i);

  const update = (y: number, m: number, d: number) => {
    const maxDay = new Date(y, m + 1, 0).getDate();
    const safeDay = Math.min(d, maxDay);
    const str = `${y}-${String(m + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
    onChange(str);
    return safeDay;
  };

  return (
    <div className="nw-datepicker">
      <div className="nw-datepicker-field">
        <label className="nw-datepicker-label">День</label>
        <select
          className="nw-datepicker-select"
          value={day}
          onChange={(e) => { const d = +e.target.value; setDay(d); update(year, month, d); }}
        >
          {days.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="nw-datepicker-field" style={{ flex: 2 }}>
        <label className="nw-datepicker-label">Месяц</label>
        <select
          className="nw-datepicker-select"
          value={month}
          onChange={(e) => { const m = +e.target.value; setMonth(m); const safe = update(year, m, day); setDay(safe); }}
        >
          {MONTHS.map((name, i) => <option key={i} value={i}>{name}</option>)}
        </select>
      </div>
      <div className="nw-datepicker-field">
        <label className="nw-datepicker-label">Год</label>
        <select
          className="nw-datepicker-select"
          value={year}
          onChange={(e) => { const y = +e.target.value; setYear(y); update(y, month, day); }}
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
}

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
            <div className="nw-date-header">
              <label className="nw-label" style={{ marginBottom: 0 }}>
                Дата события <span className="nw-optional">необязательно</span>
              </label>
              {occasionDate && (
                <button type="button" className="nw-date-clear" onClick={() => setOccasionDate("")}>
                  Очистить
                </button>
              )}
            </div>
            {occasionDate ? (
              <DatePicker value={occasionDate} onChange={setOccasionDate} />
            ) : (
              <button
                type="button"
                className="nw-date-add-btn"
                onClick={() => setOccasionDate(new Date().toISOString().split("T")[0])}
              >
                <CalendarIcon />
                <span>Выбрать дату</span>
              </button>
            )}
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

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
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
