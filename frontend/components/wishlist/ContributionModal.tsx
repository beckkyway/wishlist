"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import api, { Item } from "@/lib/api";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatPrice, getApiError } from "@/lib/utils";

interface ContributionModalProps {
  open: boolean;
  onClose: () => void;
  item: Item;
  guestName: string;
  onSaved: () => void;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export default function ContributionModal({ open, onClose, item, guestName, onSaved }: ContributionModalProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const existingToken = typeof window !== "undefined" ? localStorage.getItem(`contrib_${item.id}`) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        contributor_name: guestName,
        amount: parseFloat(amount),
        note: note || null,
        contributor_token: existingToken || undefined,
      };
      const { data } = await api.post<{ contributor_token: string }>(`/items/${item.id}/contributions`, payload);
      localStorage.setItem(`contrib_${item.id}`, data.contributor_token);
      toast.success("Вклад внесён!");
      onSaved();
      onClose();
    } catch (err: unknown) {
      toast.error(getApiError(err, "Ошибка"));
    } finally {
      setLoading(false);
    }
  };

  const current = item.contribution_summary?.total_collected ?? 0;
  const target = item.target_amount ?? 0;

  return (
    <AnimatePresence>
      {open && (
        <div className="modal-root">
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="contrib-panel"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* Header */}
            <div className="contrib-header">
              <div className="contrib-header-left">
                <span className="contrib-header-icon">🎁</span>
                <span className="contrib-header-title">Скинуться на подарок</span>
              </div>
              <button className="modal-close" onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="contrib-body">
              {/* Item card */}
              <div className="contrib-item-card">
                <p className="contrib-item-title">{item.title}</p>
                {target > 0 && (
                  <>
                    <ProgressBar current={current} target={target} />
                    <p className="contrib-progress-label">
                      Уже собрано: <span>{formatPrice(current)}</span> из {formatPrice(target)}
                    </p>
                  </>
                )}
              </div>

              {/* Amount */}
              <div className="contrib-section">
                <p className="contrib-label">Ваша сумма, ₽</p>
                <div className="contrib-chips">
                  {QUICK_AMOUNTS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`contrib-chip${amount === String(v) ? " contrib-chip--active" : ""}`}
                      onClick={() => setAmount(String(v))}
                    >
                      {v.toLocaleString("ru-RU")} ₽
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Или введите свою сумму"
                  min={1}
                  required
                  className="contrib-input"
                />
              </div>

              {/* Note */}
              <div className="contrib-section">
                <p className="contrib-label">
                  Заметка <span className="contrib-label-optional">— необязательно</span>
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="С наилучшими пожеланиями!"
                  rows={2}
                  className="contrib-textarea"
                />
              </div>

              {/* Footer */}
              <div className="contrib-footer">
                <button type="button" className="contrib-btn-cancel" onClick={onClose}>
                  Отмена
                </button>
                <button type="submit" className="contrib-btn-submit" disabled={loading}>
                  {loading && <span className="contrib-spinner" />}
                  Внести вклад
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
