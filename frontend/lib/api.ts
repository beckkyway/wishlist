import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;

// Types
export interface Wishlist {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  occasion: string | null;
  occasion_date: string | null;
  share_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContributionSummary {
  total_collected: number;
  count: number;
}

export interface Item {
  id: string;
  wishlist_id: string;
  title: string;
  url: string | null;
  price: number | null;
  currency: string;
  image_url: string | null;
  description: string | null;
  status: "available" | "reserved" | "collecting" | "collected" | "deleted";
  is_group_gift: boolean;
  target_amount: number | null;
  order_index: number;
  priority: "must_have" | "normal" | "dream";
  created_at: string;
  updated_at: string;
  contribution_summary: ContributionSummary | null;
  is_reserved_by_me: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
}
