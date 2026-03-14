"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { AuthLayout } from "@/components/ui/AuthLayout";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post<{ access_token: string }>("/auth/login", { email, password });
      localStorage.setItem("jwt_token", data.access_token);
      router.push("/dashboard");
    } catch {
      toast.error("Неверный email или пароль");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <AuthLayout>
      <div className="auth-header">
        <div className="auth-icon">🎁</div>
        <h1 className="auth-title">С возвращением</h1>
        <p className="auth-subtitle">Войди в свой аккаунт</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
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
          placeholder="••••••••"
          icon={<LockIcon />}
          required
        />

        <button type="submit" disabled={loading} className="auth-btn-primary">
          {loading ? (
            <span className="auth-spinner" />
          ) : (
            <>
              <span>Войти</span>
              <ArrowIcon />
            </>
          )}
        </button>

        <div className="auth-divider">
          <span>или</span>
        </div>

        <button type="button" onClick={handleGoogle} className="auth-btn-google">
          <GoogleIcon />
          <span>Продолжить через Google</span>
        </button>
      </form>

      <p className="auth-footer-text">
        Нет аккаунта?{" "}
        <Link href="/register" className="auth-link">
          Зарегистрироваться
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
