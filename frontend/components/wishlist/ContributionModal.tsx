"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import api, { Item } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatPrice, getApiError } from "@/lib/utils";

interface ContributionModalProps {
  open: boolean;
  onClose: () => void;
  item: Item;
  guestName: string;
  onSaved: () => void;
}

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
    <Modal open={open} onClose={onClose} title="Скинуться на подарок">
      <div className="flex flex-col gap-5">
        <div className="bg-surface-2 rounded-xl p-4">
          <p className="font-medium text-text-primary mb-1">{item.title}</p>
          {target > 0 && <ProgressBar current={current} target={target} />}
          {target > 0 && (
            <p className="text-xs text-text-muted mt-2">
              Уже собрано: {formatPrice(current)} из {formatPrice(target)}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Ваша сумма, ₽"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500"
            min={1}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-muted">Заметка (необязательно)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="С наилучшими пожеланиями!"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-text-primary placeholder:text-text-subtle focus:border-accent outline-none transition-all resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Отмена</Button>
            <Button type="submit" loading={loading} className="flex-1">Внести вклад</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
