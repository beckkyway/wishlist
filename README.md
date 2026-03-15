# Wishlist — Social Gift Wishlist App

Социальный вишлист для подарков. Создавай списки желаний, делись с друзьями, следи за резервированием в реальном времени.

## Что умеет приложение

**Для владельца вишлиста:**
- Создавай неограниченное количество списков (на день рождения, Новый год и т.д.)
- Добавляй подарки: название, ссылка, цена, картинка
- Автозаполнение по ссылке — вставляешь URL товара, приложение само подтягивает название, изображение и цену (OG-парсинг)
- Делись вишлистом по уникальной ссылке — друзья открывают без регистрации
- **Не видишь** кто что зарезервировал и кто сколько скинул — сюрприз сохранён

**Для друзей:**
- Открывают вишлист по ссылке без регистрации
- Резервируют подарок одним кликом, чтобы не повторяться с другими
- Скидываются на дорогой подарок вместе: каждый вносит любую сумму, прогресс-бар показывает сколько уже собрано
- Все изменения видны мгновенно без перезагрузки страницы — реалтайм

**Продуктовые решения:**
- Пустой вишлист показывает подсказку с призывом добавить первый подарок
- Гость (без регистрации) видит весь список, может резервировать и участвовать в сборе — регистрация не нужна
- Минимальный вклад в групповой сбор — 1 рубль (нет барьера для входа)
- Если товар был удалён владельцем, а на него уже скидывались — статус меняется на «недоступен», история взносов сохраняется
- Прогресс-бар сбора виден всем друзьям, но не владельцу

## Стек

| Слой | Технология |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy (async), Alembic |
| База данных | PostgreSQL (Supabase) |
| Realtime | Supabase Realtime (postgres_changes) |
| Авторизация | JWT HS256 (30 дней) + Google OAuth |
| Деплой | Railway (backend) + Vercel (frontend) |

## Запуск локально

### Требования
- Python 3.11+
- Node.js 18+
- PostgreSQL (или Supabase проект)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Заполни .env своими значениями

alembic upgrade head
uvicorn main:app --reload
```

Backend будет доступен на `http://localhost:8000`
Документация API: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install

cp .env.example .env.local
# Заполни .env.local своими значениями

npm run dev
```

Frontend будет доступен на `http://localhost:3000`

## Переменные окружения

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
JWT_SECRET=random-secret-key
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
CORS_ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXTAUTH_SECRET=random-secret
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Структура проекта

```
.
├── backend/
│   ├── app/
│   │   ├── api/          # Роуты: auth, wishlists, items, reservations, contributions, share, parse
│   │   ├── core/         # Config, database, security, rate limiter
│   │   ├── models/       # SQLAlchemy модели
│   │   ├── schemas/      # Pydantic схемы
│   │   └── services/     # OG-парсер для автозаполнения товаров
│   ├── alembic/          # Миграции БД
│   └── main.py
└── frontend/
    └── src/
        ├── app/          # Next.js App Router страницы
        ├── components/   # UI компоненты
        └── lib/          # Realtime provider, API клиент
```

## API

Полная документация доступна на `/docs` (Swagger UI) после запуска backend.

Основные эндпоинты:
- `POST /auth/register` — регистрация
- `POST /auth/login` — вход
- `GET /auth/google` — OAuth через Google
- `GET /wishlists` — мои вишлисты
- `POST /wishlists` — создать вишлист
- `GET /share/{token}` — публичный вишлист (без авторизации)
- `POST /parse` — автозаполнение товара по URL
- `POST /items/{id}/reserve` — зарезервировать подарок
- `POST /items/{id}/contribute` — внести вклад в групповой сбор
