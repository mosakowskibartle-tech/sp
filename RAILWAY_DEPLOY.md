# 🚀 Деплой на Railway

## Шаг 1 — Создать проект

1. Зайдите на railway.app → New Project → Deploy from GitHub repo
2. Выберите ваш репозиторий с этим кодом

## Шаг 2 — Добавить PostgreSQL

1. В проекте нажмите **+ New** → **Database** → **Add PostgreSQL**
2. Railway автоматически добавит переменную `DATABASE_URL`

## Шаг 3 — Переменные окружения

В Settings → Variables добавьте:

```
ADMIN_PASSWORD=ваш_пароль_администратора
TELEGRAM_BOT_TOKEN=токен_вашего_бота
TELEGRAM_CHAT_ID=id_вашего_чата
MIGRATE_SECRET=migrate2025
SITE_URL=https://ваш-домен.railway.app
```

## Шаг 4 — Запустить миграцию (создать таблицы)

После деплоя откройте в браузере:
```
https://ваш-домен.railway.app/api/migrate?secret=migrate2025
```

Это создаст все таблицы и заполнит начальные данные.

## Шаг 5 — Проверка

- Сайт: https://ваш-домен.railway.app
- Админка: https://ваш-домен.railway.app/admin
- Официант: https://ваш-домен.railway.app/waiter
- Здоровье API: https://ваш-домен.railway.app/api/health

## Структура

```
server.js          — Express сервер (Railway entrypoint)
api/               — API роуты (загружаются динамически)
  _db.js           — PostgreSQL клиент (Railway DATABASE_URL)
  _tg.js           — Telegram уведомления
  migrate.js       — Создание таблиц
  orders.js        — Заказы + промокоды + Telegram
  reservations.js  — Бронирование столов
  menu.js          — Меню
  ...
dist/              — Собранный React SPA
railway.json       — Конфигурация Railway
```

## Telegram настройка

1. Создайте бота через @BotFather → получите токен
2. Добавьте бота в чат/канал как администратора
3. Узнайте Chat ID через @userinfobot
4. Введите в Админке → Настройки → Telegram
   ИЛИ добавьте в переменные Railway
