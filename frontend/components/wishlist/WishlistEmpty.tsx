"use client";
import { useState } from "react";
import Link from "next/link";
import GiftAdvisorModal from "./GiftAdvisorModal";

export default function WishlistEmpty() {
  const [advisorOpen, setAdvisorOpen] = useState(false);

  return (
    <>
      <div className="empty-state">
        <div className="empty-glow" />
        <div className="empty-icon">🎁</div>
        <h2 className="empty-title">Пока нет вишлистов</h2>
        <p className="empty-text">
          Создай первый список желаний и поделись<br />
          с друзьями — они удивят тебя!
        </p>

        {/* AI Advisor button */}
        <button className="empty-ai-btn" onClick={() => setAdvisorOpen(true)}>
          <span className="empty-ai-btn-icon">✨</span>
          <span>Не знаю что хочу — спросить ИИ</span>
        </button>

        <div className="empty-divider">
          <span>или</span>
        </div>

        <Link href="/wishlists/new" className="empty-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 4v16m8-8H4" />
          </svg>
          Создать вишлист
        </Link>
        <div className="empty-hints">
          <div className="empty-hint"><span>🔗</span><span>Поделись ссылкой</span></div>
          <div className="empty-hint"><span>🎯</span><span>Групповой сбор</span></div>
          <div className="empty-hint"><span>🕵️</span><span>Сюрприз сохранён</span></div>
        </div>
      </div>

      <GiftAdvisorModal open={advisorOpen} onClose={() => setAdvisorOpen(false)} />
    </>
  );
}
