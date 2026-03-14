"use client";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import LiveIndicator from "./LiveIndicator";

interface RealtimeContextValue {
  connected: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue>({ connected: false });
export const useRealtime = () => useContext(RealtimeContext);

interface RealtimeProviderProps {
  wishlistId: string;
  onUpdate: () => void;
  children: ReactNode;
  showIndicator?: boolean;
}

export default function RealtimeProvider({ wishlistId, onUpdate, children, showIndicator = true }: RealtimeProviderProps) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`wishlist:${wishlistId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `wishlist_id=eq.${wishlistId}` },
        () => onUpdate()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contributions" },
        () => onUpdate()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => onUpdate()
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wishlistId, onUpdate]);

  return (
    <RealtimeContext.Provider value={{ connected }}>
      {showIndicator && (
        <div className="fixed bottom-4 left-4 z-50">
          <LiveIndicator connected={connected} />
        </div>
      )}
      {children}
    </RealtimeContext.Provider>
  );
}
