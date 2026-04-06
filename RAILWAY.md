# 🚂 Деплой на Railway — Кафе «Соль и Перец»

## Что нужно
- Аккаунт на https://railway.app (бесплатно, GitHub login)
- Репозиторий на GitHub с кодом сайта

---

## ШАГ 1 — Загрузить код на GitHub

```bash
git init
git add .
git commit -m "Соль и Перец — первый деплой"
git remote add origin https://github.com/ВАШ_НИК/sol-perec.git
git push -u origin main
```

---

## ШАГ 2 — Создать проект на Railway

1. Зайдите на https://railway.app → **New Project**
2. Выберите **Deploy from GitHub repo**
3. Найдите репозиторий `sol-perec` → **Deploy Now**

---

## ШАГ 3 — Добавить базу данных PostgreSQL

1. В проекте нажмите **+ New** → **Database** → **Add PostgreSQL**
2. Railway автоматически создаст базу и добавит переменную `DATABASE_URL`

---

## ШАГ 4 — Переменные окружения

В Railway: **Variables** → добавьте:

| Переменная | Значение |
|---|---|
| `ADMIN_PASSWORD` | ваш пароль для /admin |
| `MIGRATE_SECRET` | migrate2025 (или свой) |
| `TELEGRAM_BOT_TOKEN` | (можно позже через /admin) |
| `TELEGRAM_CHAT_ID` | (можно позже через /admin) |
| `NODE_ENV` | production |

> `DATABASE_URL` Railway добавляет **автоматически** — не трогайте.

---

## ШАГ 5 — Создать таблицы в базе

После деплоя откройте ваш сайт и выполните:

```bash
curl -X POST https://ВАШ_САЙТ.railway.app/api/migrate \
  -H "x-migrate-secret: migrate2025"
```

Или через браузер — установите расширение **RESTer** и отправьте POST запрос.

**Ответ должен быть:**
```json
{"ok": true, "message": "Миграция выполнена!"}
```

> ⚠️ Таблицы создаются автоматически при старте сервера. Миграция нужна только если что-то пошло не так.

---

## ШАГ 6 — Добавить свой домен

1. В Railway: **Settings** → **Networking** → **Custom Domain**
2. Введите ваш домен: `solperec.ru`
3. Railway покажет DNS-записи — добавьте их у вашего регистратора:

```
Тип: CNAME
Имя: @  (или www)
Значение: ВАШ_ПРОЕКТ.railway.app
```

4. Подождите 5–30 минут — SSL сертификат выдаётся автоматически

---

## ШАГ 7 — Настроить Telegram уведомления

1. Откройте `/admin` на вашем сайте
2. Вкладка **Настройки**
3. Введите токен бота и Chat ID
4. Нажмите **Тест** — получите тестовое сообщение

### Как получить токен:
- Откройте Telegram → @BotFather → `/newbot` → следуйте инструкции
- Скопируйте токен вида `123456:ABC-DEF...`

### Как получить Chat ID:
- Добавьте бота в чат/канал как администратора
- Откройте @userinfobot или @RawDataBot → отправьте любое сообщение
- Скопируйте `id` (для канала будет отрицательное число, например `-100123456789`)

---

## Структура проекта

```
sol-perec/
├── server.js          ← Express API + статика (PostgreSQL)
├── database.sql       ← Схема БД (для справки)
├── railway.json       ← Конфиг Railway
├── .env.example       ← Пример переменных
├── src/               ← React frontend
│   ├── pages/         ← Страницы
│   ├── components/    ← Компоненты
│   └── lib/           ← Утилиты
├── public/            ← Статические файлы, фото
└── dist/              ← Сборка (создаётся при деплое)
```

---

## API эндпоинты

| Метод | URL | Описание |
|---|---|---|
| GET | /api/menu | Меню (параметры: bar=true/false, category=...) |
| POST | /api/menu | Добавить блюдо |
| PUT | /api/menu | Обновить блюдо |
| DELETE | /api/menu | Удалить блюдо |
| GET | /api/orders | Все заказы |
| POST | /api/orders | Новый заказ (+ Telegram) |
| PUT | /api/orders | Изменить статус |
| GET | /api/reservations | Брони (параметр: date=2025-01-01) |
| POST | /api/reservations | Новая бронь (+ Telegram) |
| PUT | /api/reservations | Изменить статус |
| DELETE | /api/reservations | Удалить бронь |
| GET | /api/reviews | Отзывы (all=true для всех) |
| POST | /api/reviews | Новый отзыв |
| PUT | /api/reviews | Модерировать |
| DELETE | /api/reviews | Удалить |
| GET | /api/banquets | Заявки на банкеты |
| POST | /api/banquets | Новая заявка (+ Telegram) |
| PUT | /api/banquets | Изменить статус |
| GET | /api/promotions | Акции |
| POST | /api/promotions | Добавить акцию |
| PUT | /api/promotions | Изменить акцию |
| DELETE | /api/promotions | Удалить акцию |
| GET | /api/gallery | Галерея |
| POST | /api/gallery | Добавить фото |
| PUT | /api/gallery | Изменить |
| DELETE | /api/gallery | Удалить |
| GET | /api/settings | Настройки |
| PUT | /api/settings | Сохранить настройки |
| POST | /api/admin-auth | Вход в админку |
| GET | /api/health | Проверка работы |
| POST | /api/migrate | Создать таблицы |

---

## Цены Railway

- **Free tier**: $5 кредитов в месяц (хватает на небольшой сайт)
- **Hobby**: $5/месяц — без ограничений по времени работы
- **PostgreSQL**: входит в план, ~$0.000231 за ГБ/час

**Рекомендую Hobby план** — $5/месяц для production сайта кафе.

---

## Обновление сайта

```bash
git add .
git commit -m "Обновление меню"
git push
```

Railway автоматически пересоберёт и задеплоит сайт за ~2 минуты.
