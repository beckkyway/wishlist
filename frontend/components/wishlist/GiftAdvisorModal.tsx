"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface GiftIdea {
  emoji: string;
  title: string;
  description: string;
  price_hint: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    key: "occasion",
    question: "Какой повод?",
    hint: "Выбери один вариант",
    multi: false,
    options: [
      { label: "День рождения", emoji: "🎂" },
      { label: "Новый год", emoji: "🎄" },
      { label: "Свадьба", emoji: "💍" },
      { label: "Выпускной", emoji: "🎓" },
      { label: "Без повода", emoji: "✨" },
    ],
  },
  {
    key: "budget",
    question: "Какой бюджет?",
    hint: "Выбери один вариант",
    multi: false,
    options: [
      { label: "до 1 000 ₽", emoji: "💸" },
      { label: "1 000 – 5 000 ₽", emoji: "💰" },
      { label: "5 000 – 20 000 ₽", emoji: "💎" },
      { label: "от 20 000 ₽", emoji: "🏆" },
      { label: "Любой", emoji: "🎯" },
    ],
  },
  {
    key: "interests",
    question: "Какие интересы?",
    hint: "Можно выбрать несколько",
    multi: true,
    options: [
      { label: "Технологии", emoji: "💻" },
      { label: "Спорт", emoji: "⚽" },
      { label: "Музыка", emoji: "🎵" },
      { label: "Кино", emoji: "🎬" },
      { label: "Путешествия", emoji: "✈️" },
      { label: "Кулинария", emoji: "🍳" },
      { label: "Красота", emoji: "💄" },
      { label: "Чтение", emoji: "📚" },
      { label: "Игры", emoji: "🎮" },
      { label: "Искусство", emoji: "🎨" },
    ],
  },
  {
    key: "for_whom",
    question: "Для кого подарок?",
    hint: "Выбери один вариант",
    multi: false,
    options: [
      { label: "Для себя", emoji: "🙋" },
      { label: "Для неё", emoji: "👩" },
      { label: "Для него", emoji: "👨" },
      { label: "Для ребёнка", emoji: "👶" },
      { label: "Для пожилых", emoji: "🧓" },
      { label: "Для друга", emoji: "🤝" },
    ],
  },
];

export default function GiftAdvisorModal({ open, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [ideas, setIdeas] = useState<GiftIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [wishlistName, setWishlistName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createStep, setCreateStep] = useState(false);

  const current = STEPS[step];

  function handleClose() {
    onClose();
    setTimeout(() => {
      setStep(0);
      setAnswers({});
      setIdeas([]);
      setLoading(false);
      setError("");
      setDone(false);
      setSelected(new Set());
      setWishlistName("");
      setCreating(false);
      setCreateStep(false);
    }, 300);
  }

  function toggleIdea(i: number) {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i); else next.add(i);
    setSelected(next);
  }

  async function handleCreateWishlist() {
    if (!wishlistName.trim()) return;
    setCreating(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const wlRes = await fetch(`${base}/wishlists`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title: wishlistName.trim(), description: "", occasion: "", occasion_date: null }),
      });
      if (!wlRes.ok) throw new Error("Не удалось создать вишлист");
      const wl = await wlRes.json();
      const chosen = ideas.filter((_, i) => selected.has(i));
      await Promise.all(chosen.map((idea) =>
        fetch(`${base}/wishlists/${wl.id}/items`, {
          method: "POST",
          headers,
          body: JSON.stringify({ title: idea.title, description: `${idea.description} (${idea.price_hint})`, url: null, price: null, image_url: null, is_group_gift: false, target_amount: null, priority: "normal" }),
        })
      ));
      handleClose();
      router.push(`/wishlists/${wl.id}`);
    } catch {
      setCreating(false);
    }
  }

  function toggleOption(label: string) {
    if (current.multi) {
      const prev = (answers[current.key] as string[]) ?? [];
      const next = prev.includes(label)
        ? prev.filter((x) => x !== label)
        : [...prev, label];
      setAnswers({ ...answers, [current.key]: next });
    } else {
      setAnswers({ ...answers, [current.key]: label });
    }
  }

  function isSelected(label: string) {
    const val = answers[current.key];
    if (!val) return false;
    return Array.isArray(val) ? val.includes(label) : val === label;
  }

  function canNext() {
    const val = answers[current.key];
    if (!val) return false;
    return Array.isArray(val) ? val.length > 0 : true;
  }

  async function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    // Last step — fetch suggestions
    setLoading(true);
    setError("");
    try {
      const body = {
        occasion: (answers["occasion"] as string) ?? "",
        budget: (answers["budget"] as string) ?? "",
        interests: (answers["interests"] as string[]) ?? [],
        for_whom: (answers["for_whom"] as string) ?? "",
      };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/ai/suggest`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? "Ошибка сервера");
      }
      const data = await res.json();
      setIdeas(data.ideas ?? []);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  }

  function handleRestart() {
    setStep(0);
    setAnswers({});
    setIdeas([]);
    setDone(false);
    setError("");
    setSelected(new Set());
    setWishlistName("");
    setCreateStep(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="modal-root">
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="gai-panel"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* Header */}
            <div className="gai-header">
              <div className="gai-header-left">
                <span className="gai-header-icon">✨</span>
                <span className="gai-header-title">AI-советник подарков</span>
              </div>
              <button className="modal-close" onClick={handleClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="gai-body">
              {/* Loading */}
              {loading && (
                <div className="gai-loading">
                  <div className="gai-loading-orb" />
                  <p className="gai-loading-text">Подбираю идеи для тебя...</p>
                  <p className="gai-loading-sub">Это займёт несколько секунд</p>
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <div className="gai-error">
                  <span className="gai-error-icon">😕</span>
                  <p className="gai-error-text">{error}</p>
                  <button className="gai-retry-btn" onClick={handleNext}>
                    Попробовать снова
                  </button>
                </div>
              )}

              {/* Results */}
              {!loading && !error && done && !createStep && (
                <div className="gai-results">
                  <div className="gai-results-header">
                    <p className="gai-results-title">Вот что я нашёл для тебя</p>
                    <p className="gai-results-sub">Отметь идеи, чтобы добавить в вишлист</p>
                  </div>
                  <div className="gai-ideas-grid">
                    {ideas.map((idea, i) => (
                      <div
                        key={i}
                        className={`gai-idea-card ${selected.has(i) ? "gai-idea-card--selected" : ""}`}
                        onClick={() => toggleIdea(i)}
                        style={{ cursor: "pointer" }}
                      >
                        <span className="gai-idea-emoji">{idea.emoji}</span>
                        <div className="gai-idea-content">
                          <p className="gai-idea-title">{idea.title}</p>
                          <p className="gai-idea-desc">{idea.description}</p>
                          <span className="gai-idea-price">{idea.price_hint}</span>
                        </div>
                        <div className={`gai-idea-check ${selected.has(i) ? "gai-idea-check--on" : ""}`}>
                          {selected.has(i) && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="gai-results-footer">
                    <button className="gai-restart-btn" onClick={handleRestart}>
                      Подобрать ещё раз
                    </button>
                    {selected.size > 0 ? (
                      <button className="gai-add-btn" onClick={() => setCreateStep(true)}>
                        Создать вишлист ({selected.size})
                      </button>
                    ) : (
                      <button className="gai-close-btn" onClick={handleClose}>
                        Закрыть
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Create wishlist step */}
              {!loading && !error && done && createStep && (
                <div className="gai-results">
                  <div className="gai-results-header">
                    <p className="gai-results-title">Назови вишлист</p>
                    <p className="gai-results-sub">Выбрано идей: {selected.size}</p>
                  </div>
                  <div className="gai-create-form">
                    <input
                      className="gai-name-input"
                      value={wishlistName}
                      onChange={(e) => setWishlistName(e.target.value)}
                      placeholder="Мой вишлист на день рождения"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleCreateWishlist()}
                    />
                  </div>
                  <div className="gai-results-footer">
                    <button className="gai-restart-btn" onClick={() => setCreateStep(false)}>
                      ← Назад
                    </button>
                    <button
                      className="gai-add-btn"
                      disabled={!wishlistName.trim() || creating}
                      onClick={handleCreateWishlist}
                    >
                      {creating ? "Создаём..." : "Создать ✨"}
                    </button>
                  </div>
                </div>
              )}

              {/* Quiz */}
              {!loading && !error && !done && (
                <>
                  {/* Step dots */}
                  <div className="gai-dots">
                    {STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`gai-dot ${i === step ? "gai-dot--active" : i < step ? "gai-dot--done" : ""}`}
                      />
                    ))}
                  </div>

                  {/* Question */}
                  <div className="gai-question-wrap">
                    <h3 className="gai-question">{current.question}</h3>
                    <p className="gai-hint">{current.hint}</p>
                  </div>

                  {/* Options */}
                  <div className="gai-options">
                    {current.options.map((opt) => (
                      <button
                        key={opt.label}
                        className={`gai-option ${isSelected(opt.label) ? "gai-option--selected" : ""}`}
                        onClick={() => toggleOption(opt.label)}
                      >
                        <span className="gai-option-emoji">{opt.emoji}</span>
                        <span className="gai-option-label">{opt.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Navigation */}
                  <div className="gai-nav">
                    {step > 0 && (
                      <button className="gai-back-btn" onClick={() => setStep(step - 1)}>
                        ← Назад
                      </button>
                    )}
                    <button
                      className="gai-next-btn"
                      disabled={!canNext()}
                      onClick={handleNext}
                    >
                      {step === STEPS.length - 1 ? "Подобрать подарки ✨" : "Далее →"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
