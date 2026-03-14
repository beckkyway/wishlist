"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import api, { Item } from "@/lib/api";
import { getApiError } from "@/lib/utils";

interface ReserveButtonProps {
  item: Item;
  guestName: string;
  onRefresh: () => void;
  requireName?: (action: () => void) => void;
}

export default function ReserveButton({ item, guestName, onRefresh, requireName }: ReserveButtonProps) {
  const [loading, setLoading] = useState(false);
  const storageKey = `reserve_${item.id}`;
  const myToken = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
  const isMyReservation = item.is_reserved_by_me || !!myToken;

  const handleReserve = async () => {
    if (!guestName && requireName) {
      requireName(handleReserve);
      return;
    }
    setLoading(true);
    try {
      const payload = { reserver_name: guestName, reserver_token: myToken || undefined };
      const { data } = await api.post<{ reserver_token: string }>(`/items/${item.id}/reserve`, payload);
      localStorage.setItem(storageKey, data.reserver_token);
      toast.success("Подарок забронирован!");
      onRefresh();
    } catch (err: unknown) {
      toast.error(getApiError(err, "Уже забронировано"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!myToken) return;
    setLoading(true);
    try {
      await api.delete(`/items/${item.id}/reserve`, { data: { reserver_token: myToken } });
      localStorage.removeItem(storageKey);
      toast.success("Бронь отменена");
      onRefresh();
    } catch {
      toast.error("Ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (item.status === "deleted") return null;
  if (item.is_group_gift) return null;

  if (isMyReservation) {
    return (
      <button className="icard-btn-reserve-cancel" disabled={loading} onClick={handleCancel}>
        {loading && <span className="icard-reserve-spinner" />}
        Отменить бронь
      </button>
    );
  }

  if (item.status === "reserved") {
    return (
      <span className="icard-btn-reserved-badge">
        🔒 Уже забронировано
      </span>
    );
  }

  return (
    <button className="icard-btn-reserve" disabled={loading} onClick={handleReserve}>
      {loading && <span className="icard-reserve-spinner" />}
      🎁 Забронировать
    </button>
  );
}
