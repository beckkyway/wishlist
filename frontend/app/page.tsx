"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      router.replace("/dashboard");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) return null;

  return (
    <div className="landing-root">
      {/* Background glows */}
      <div className="landing-glow landing-glow-1" />
      <div className="landing-glow landing-glow-2" />

      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="dash-brand">
            <span className="dash-brand-icon">🎁</span>
            <span className="dash-brand-name">Wishlist</span>
          </div>
          <div className="landing-header-actions">
            <Link href="/login" className="landing-btn-ghost">Войти</Link>
            <Link href="/register" className="landing-btn-primary">Зарегистрироваться</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="landing-main">
        <div className="landing-hero-badge">✨ Делись желаниями</div>
        <h1 className="landing-hero-title">
          Вишлист, которым<br />
          <span className="landing-hero-accent">удобно делиться</span>
        </h1>
        <p className="landing-hero-sub">
          Составь список подарков, поделись ссылкой с друзьями — они зарезервируют подарки без регистрации
        </p>

        <div className="landing-hero-actions">
          <Link href="/register" className="landing-cta-btn">
            Создать вишлист
            <ArrowIcon />
          </Link>
          <Link href="/login" className="landing-cta-ghost">
            У меня уже есть аккаунт
          </Link>
        </div>

        {/* Features */}
        <div className="landing-features">
          {[
            { icon: "🔗", title: "Ссылка — и всё", desc: "Поделись токен-ссылкой, друзья увидят список без регистрации" },
            { icon: "🎯", title: "Резервирование", desc: "Друзья резервируют подарки — никаких дублей" },
            { icon: "💸", title: "Сбор денег", desc: "Для дорогих подарков — совместный взнос" },
          ].map((f) => (
            <div key={f.title} className="landing-feature">
              <div className="landing-feature-icon">{f.icon}</div>
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
