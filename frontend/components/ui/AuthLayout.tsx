"use client";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-root">
      {/* Левая декоративная панель */}
      <div className="auth-panel-left" aria-hidden="true">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />

        <div className="auth-panel-content">
          <div className="auth-brand">
            <span className="auth-brand-icon">🎁</span>
            <span className="auth-brand-name">Wishlist</span>
          </div>

          <div className="auth-panel-heading">
            <h2>Дари осознанно,<br />получай желаемое</h2>
            <p>Создавай списки желаний, делись с друзьями и собирай подарки вместе</p>
          </div>

          <div className="auth-features">
            <AuthFeature icon="🔗" text="Публичная ссылка без регистрации" />
            <AuthFeature icon="🎯" text="Групповой сбор на дорогие подарки" />
            <AuthFeature icon="⚡" text="Обновления в реальном времени" />
            <AuthFeature icon="🕵️" text="Владелец не видит — сюрприз сохранён" />
          </div>
        </div>
      </div>

      {/* Правая панель с формой */}
      <div className="auth-panel-right">
        <div className="auth-card">
          {children}
        </div>
      </div>
    </div>
  );
}

function AuthFeature({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="auth-feature">
      <span className="auth-feature-icon">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
