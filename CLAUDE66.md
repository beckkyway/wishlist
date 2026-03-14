# CLAUDE.md — Социальный вишлист

## Контекст

Веб-приложение: пользователь создаёт списки желаний, добавляет товары, делится по ссылке.
Друзья резервируют подарки и скидываются на дорогие. Владелец не видит кто что сделал — сюрприз.
Реалтайм обязателен. Деплой обязателен. Дедлайн: 3 дня.

---

## Стек

```
Frontend:   Next.js 14 (App Router) + TypeScript + Tailwind CSS
Backend:    FastAPI + SQLAlchemy (async)
Database:   PostgreSQL (Supabase)
Realtime:   Supabase Realtime
Auth:       JWT (email+пароль) + Google OAuth
Deploy:     Vercel (фронт) + Railway (бэкенд) + Supabase (БД + Storage)
Парсинг:    Open Graph / meta-теги для автозаполнения по URL
```

---

## Архитектура Frontend

```
app/
  (auth)/login/page.tsx
  (auth)/register/page.tsx
  dashboard/page.tsx                   # Мои вишлисты
  wishlists/new/page.tsx               # Создать вишлист
  wishlists/[id]/page.tsx              # Мой вишлист (владелец)
  wishlists/[id]/edit/page.tsx
  share/[token]/page.tsx               # Публичная ссылка (без авторизации)

components/
  wishlist/
    WishlistCard.tsx
    WishlistEmpty.tsx                  # Пустой стейт с онбордингом
    ItemCard.tsx
    ItemForm.tsx
    ReserveButton.tsx
    ContributionBar.tsx                # Прогресс-бар
    ContributionModal.tsx
  ui/
    Button.tsx / Input.tsx / Modal.tsx / Badge.tsx / ProgressBar.tsx
  realtime/
    RealtimeProvider.tsx
    LiveIndicator.tsx

hooks/
  useWishlist.ts / useItems.ts / useRealtime.ts / useAuth.ts / useUrlParser.ts
```

## Архитектура Backend

```
app/
  api/
    auth.py / wishlists.py / items.py / reservations.py / contributions.py / parse.py
  models/        # SQLAlchemy
  schemas/       # Pydantic
  services/
    auth_service.py / og_parser_service.py
  core/
    config.py / database.py / security.py
```

---

## Модели данных (PostgreSQL)

```sql
users:
  id, email, password_hash, google_id, name, avatar_url, created_at

wishlists:
  id, user_id, title, description, occasion,
  share_token UNIQUE, is_active, created_at, updated_at

items:
  id, wishlist_id, title, url, price, currency, image_url, description,
  status ('available'|'reserved'|'collecting'|'collected'|'deleted'),
  is_group_gift, target_amount, order_index, created_at, updated_at

reservations:
  id, item_id, reserver_name, reserver_user_id, reserver_token UNIQUE, created_at

contributions:
  id, item_id, contributor_name, contributor_user_id,
  contributor_token, amount, note, created_at
```

---

## API

### Auth
```
POST /auth/register     { email, password, name }
POST /auth/login        { email, password } → JWT
GET  /auth/google       → OAuth redirect
GET  /auth/google/callback
GET  /auth/me
```

### Вишлисты
```
GET    /wishlists                   # мои (auth required)
POST   /wishlists                   # создать
GET    /wishlists/{id}              # мой (только владелец)
PATCH  /wishlists/{id}
DELETE /wishlists/{id}
GET    /share/{token}               # публичный (без auth) — без имён резервирующих
GET    /wishlists/{id}/stats        # агрегат для владельца (суммы, без имён)
```

### Товары
```
GET    /wishlists/{id}/items
POST   /wishlists/{id}/items        { title, url, price, image_url, is_group_gift, target_amount }
PATCH  /wishlists/{id}/items/{sid}
DELETE /wishlists/{id}/items/{sid}  # мягкое удаление → status='deleted'
```

### Резервирование (публичное)
```
POST   /items/{id}/reserve          { reserver_name, reserver_token? }
                                    → { reservation_id, reserver_token }
DELETE /items/{id}/reserve          { reserver_token }
```

### Вклады (публичное)
```
GET    /items/{id}/contributions/summary    # total_collected + count (без имён)
POST   /items/{id}/contributions            { contributor_name, amount, note?, contributor_token? }
DELETE /contributions/{id}                  { contributor_token }
```

### Парсинг
```
POST /parse/url     { url } → { title, image_url, price?, description? }
```

---

## Реалтайм (Supabase Realtime)

```typescript
const channel = supabase
  .channel(`wishlist:${token}`)
  .on('postgres_changes', {
    event: '*', schema: 'public', table: 'items',
    filter: `wishlist_id=eq.${wishlistId}`
  }, handleItemChange)
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'reservations'
  }, handleReservation)
  .subscribe()

// Всегда отписываться в cleanup:
return () => { supabase.removeChannel(channel) }
```

Обновляется в реалтайм: статус товара, прогресс-бар, счётчик вкладчиков, новые товары.

---

## Продуктовые решения

### Гостевой доступ
Открывает `/share/{token}` без регистрации. Перед действием вводит имя.
Получает токен → localStorage → может отменить резерв/вклад позже.

### Пустой вишлист
Иллюстрация + "Добавь первый подарок" + пример карточки + кнопки действий.

### Удалённый товар с активным сбором
- Мягкое удаление: `status='deleted'`
- Карточка: "Товар снят" + сумма сбора + возможность отозвать вклад
- Новые вклады заблокированы

### Групповой подарок (is_group_gift=true)
Нельзя зарезервировать целиком — только внести вклад.
Автоматически `status='collected'` когда `sum(contributions) >= target_amount`.

---

## Что видит владелец vs гость

| Элемент | Владелец | Гость |
|---|---|---|
| Кто зарезервировал | Не видит | Видит (только себя) |
| Кто сколько скинул | Не видит | Видит (только себя) |
| Сколько всего собрано | Видит | Видит |
| Кнопка резервировать | Скрыта | Есть |
| Кнопка скинуться | Скрыта | Есть |
| Добавить товар | Есть | Скрыта |

---

## Edge-кейсы — реализовать обязательно

1. **Двойное резервирование** — UNIQUE constraint на item_id
2. **Гость вернулся** — токен из localStorage восстанавливает сессию
3. **Товар удалён во время резерва** — транзакция + 409 Conflict
4. **Сеть пропала** — реконнект Supabase Realtime + UI-индикатор
5. **Парсинг URL упал** — не блокировать форму, показать предупреждение
6. **Несколько вкладчиков одновременно** — оптимистичный UI + серверная валидация
7. **Авторизация** — middleware проверяет user_id === wishlist.user_id на каждом запросе

---

## Дизайн

- Не дефолтный Tailwind — своя тема, чёткий выбор (светлая или тёмная)
- Статус-бейджи: "Свободен" / "Зарезервирован" / "Идёт сбор X%" / "Собрано"
- Прогресс-бар анимированный, цвет: серый → синий → зелёный
- Реалтайм: карточка обновляется плавно, без flash
- Мобайл 375px: 1 колонка, bottom sheet для форм
- Пустые стейты с иллюстрациями

---

## Деплой

```
Frontend:  Vercel
Backend:   Railway (Docker)
Database:  Supabase (PostgreSQL + Realtime + Storage)
```

ENV Frontend: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

ENV Backend: DATABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CORS_ORIGINS

---

## Порядок разработки

1. Инфраструктура (Supabase + Railway + Vercel)
2. Auth (JWT + Google OAuth)
3. CRUD вишлистов и товаров
4. Публичная ссылка /share/{token}
5. Резервирование (гостевой флоу)
6. Групповой сбор + прогресс-бар
7. Реалтайм (Supabase Realtime)
8. Автозаполнение (OG-парсер)
9. Дизайн-полировка + мобайл
10. Edge-кейсы + тестирование

---

## Правила

- TypeScript везде, никаких any
- React Query для мутаций, оптимистичный UI
- Ошибки API обрабатываются на каждом запросе
- Realtime: отписываться в cleanup useEffect
- Проверять мобайл на 375px
- Дизайн: не дефолт, каждый компонент со своим стилем
