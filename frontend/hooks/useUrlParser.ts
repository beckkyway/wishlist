"use client";
import { useCallback, useRef, useState } from "react";
import api from "@/lib/api";

interface ParsedData {
  title?: string;
  image_url?: string;
  price?: number;
  description?: string;
}

export function useUrlParser() {
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parse = useCallback((url: string, onResult: (data: ParsedData) => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!url.startsWith("http")) return;

    timerRef.current = setTimeout(async () => {
      setParsing(true);
      setError(false);
      try {
        const { data } = await api.post<ParsedData>("/parse/url", { url });
        onResult(data);
      } catch {
        setError(true);
      } finally {
        setParsing(false);
      }
    }, 500);
  }, []);

  return { parse, parsing, error };
}
