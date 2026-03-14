"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import api, { Item } from "@/lib/api";
import { useUrlParser } from "@/hooks/useUrlParser";
import Modal from "@/components/ui/Modal";

interface ItemFormProps {
  open: boolean;
  onClose: () => void;
  wishlistId: string;
  editItem?: Item | null;
  onSaved: () => void;
}

export default function ItemForm({ open, onClose, wishlistId, editItem, onSaved }: ItemFormProps) {
  const [title, setTitle] = useState(editItem?.title ?? "");
  const [url, setUrl] = useState(editItem?.url ?? "");
  const [price, setPrice] = useState(editItem?.price?.toString() ?? "");
  const [imageUrl, setImageUrl] = useState(editItem?.image_url ?? "");
  const [description, setDescription] = useState(editItem?.description ?? "");
  const [isGroup, setIsGroup] = useState(editItem?.is_group_gift ?? false);
  const [targetAmount, setTargetAmount] = useState(editItem?.target_amount?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  const { parse, parsing } = useUrlParser();

  const handleUrlChange = (val: string) => {
    setUrl(val);
    parse(val, (data) => {
      if (data.title && !title) setTitle(data.title);
      if (data.image_url && !imageUrl) setImageUrl(data.image_url);
      if (data.price && !price) setPrice(data.price.toString());
      if (data.description && !description) setDescription(data.description);
      if (data.title) toast.success("Данные загружены из ссылки");
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title, url: url || null,
        price: price ? parseFloat(price) : null,
        image_url: imageUrl || null,
        description: description || null,
        is_group_gift: isGroup,
        target_amount: isGroup && targetAmount ? parseFloat(targetAmount) : null,
      };
      if (editItem) {
        await api.patch(`/wishlists/${wishlistId}/items/${editItem.id}`, payload);
      } else {
        await api.post(`/wishlists/${wishlistId}/items`, payload);
      }
      onSaved();
      onClose();
    } catch {
      toast.error("Не удалось сохранить товар");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editItem ? "Редактировать товар" : "Добавить товар"}>
      <form onSubmit={handleSubmit} className="mform">

        <div className="mform-field">
          <label className="mform-label">Ссылка <span className="nw-optional">автозаполнение</span></label>
          <div className="mform-input-wrap">
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://..."
              className="mform-input"
            />
            {parsing && <span className="mform-spinner" />}
          </div>
        </div>

        <div className="mform-field">
          <label className="mform-label">Название <span className="nw-required">*</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="AirPods Pro" required className="mform-input" />
        </div>

        <div className="mform-row">
          <div className="mform-field">
            <label className="mform-label">Цена</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="5000" min={0} className="mform-input" />
          </div>
          <div className="mform-field">
            <label className="mform-label">Картинка (URL)</label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="mform-input" />
          </div>
        </div>

        <div className="mform-field">
          <label className="mform-label">Описание</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mform-textarea" />
        </div>

        <button type="button" className="mform-toggle" onClick={() => setIsGroup(!isGroup)}>
          <div className={`mform-switch ${isGroup ? "mform-switch--on" : ""}`}>
            <div className="mform-switch-thumb" />
          </div>
          <span>Групповой подарок (сбор)</span>
        </button>

        {isGroup && (
          <div className="mform-field">
            <label className="mform-label">Целевая сумма <span className="nw-required">*</span></label>
            <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="10000" min={0} required={isGroup} className="mform-input" />
          </div>
        )}

        <div className="mform-footer">
          <button type="button" className="mform-btn-cancel" onClick={onClose}>Отмена</button>
          <button type="submit" disabled={loading} className="mform-btn-submit">
            {loading ? <span className="auth-spinner" /> : (editItem ? "Сохранить" : "Добавить")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
