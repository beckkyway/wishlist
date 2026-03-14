"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import api, { Item } from "@/lib/api";
import { useUrlParser } from "@/hooks/useUrlParser";
import Modal from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";

interface ItemFormProps {
  open: boolean;
  onClose: () => void;
  wishlistId: string;
  editItem?: Item | null;
  onSaved: () => void;
}

type Priority = "must_have" | "normal" | "dream";
const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "must_have", label: "🔴 Очень хочу" },
  { value: "normal",    label: "Обычное" },
];

export default function ItemForm({ open, onClose, wishlistId, editItem, onSaved }: ItemFormProps) {
  const [title, setTitle] = useState(editItem?.title ?? "");
  const [url, setUrl] = useState(editItem?.url ?? "");
  const [price, setPrice] = useState(editItem?.price?.toString() ?? "");
  const [imageUrl, setImageUrl] = useState(editItem?.image_url ?? "");
  const [description, setDescription] = useState(editItem?.description ?? "");
  const [isGroup, setIsGroup] = useState(editItem?.is_group_gift ?? false);
  const [targetAmount, setTargetAmount] = useState(editItem?.target_amount?.toString() ?? "");
  const [priority, setPriority] = useState<Priority>(editItem?.priority ?? "normal");
  const [uploading, setUploading] = useState(false);
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

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("item-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("item-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
      toast.success("Фото загружено");
    } catch {
      toast.error("Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
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
        priority,
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

        {/* Image upload */}
        <div className="mform-field">
          <label className="mform-label">
            Загрузить фото <span className="nw-optional">или вставь URL выше</span>
          </label>
          <label className="mform-upload-label">
            {uploading ? (
              <span className="mform-spinner" style={{ display: "inline-block" }} />
            ) : (
              <>
                <UploadIcon />
                <span>{imageUrl ? "Заменить фото" : "Выбрать файл"}</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
            />
          </label>
          {imageUrl && (
            <img src={imageUrl} alt="" style={{ marginTop: 8, height: 60, borderRadius: 8, objectFit: "cover" }} />
          )}
        </div>

        <div className="mform-field">
          <label className="mform-label">Описание</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mform-textarea" />
        </div>

        {/* Priority */}
        <div className="mform-field">
          <label className="mform-label">Важность</label>
          <div className="mform-priority-row">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={`mform-priority-btn ${priority === p.value ? "mform-priority-btn--active" : ""}`}
              >
                {p.label}
              </button>
            ))}
          </div>
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
          <button type="submit" disabled={loading || uploading} className="mform-btn-submit">
            {loading ? <span className="auth-spinner" /> : (editItem ? "Сохранить" : "Добавить")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}
