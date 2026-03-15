"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { getApiError } from "@/lib/utils";
import { AuthLayout } from "@/components/ui/AuthLayout";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post<{ access_token: string }>("/auth/register", { name, email, password });
      toast.success("Аккаунт создан! Теперь войдите.");
      router.push("/login");
    } catch (err: unknown) {
      toast.error(getApiError(err, "Ошибка регистрации"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-header">
        <div className="auth-icon">✨</div>
        <h1 className="auth-title">Создать аккаунт</h1>
        <p className="auth-subtitle">Начни собирать вишлисты</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <AuthField
          label="Имя"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Александр"
          icon={<PersonIcon />}
          required
        />
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          icon={<EmailIcon />}
          required
        />
        <AuthField
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="минимум 8 символов"
          icon={<LockIcon />}
          minLength={8}
          required
        />

        <button type="submit" disabled={loading} className="auth-btn-primary">
          {loading ? (
            <span className="auth-spinner" />
          ) : (
            <>
              <span>Зарегистрироваться</span>
              <ArrowIcon />
            </>
          )}
        </button>
      </form>

      <p className="auth-footer-text">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="auth-link">
          Войти
        </Link>
      </p>
    </AuthLayout>
  );
}

function AuthField({
  label,
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon: React.ReactNode }) {
  return (
    <div className="auth-field">
      <label className="auth-field-label">{label}</label>
      <div className="auth-field-wrap">
        <span className="auth-field-icon">{icon}</span>
        <input className="auth-input" {...props} />
      </div>
    </div>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
