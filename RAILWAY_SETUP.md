# Развёртывание на Railway

## 1. Создайте проект на Railway
1. Откройте [railway.app](https://railway.app) → New Project
2. Выберите **Deploy from GitHub repo** → выберите репозиторий

## 2. Добавьте PostgreSQL
1. В проекте нажмите **+ New** → **Database** → **PostgreSQL**
2. Railway автоматически добавит `DATABASE_URL` в переменные среды

## 3. Переменные среды (Variables)
Добавьте в сервис приложения:

```
DATABASE_URL     = (Railway добавляет автоматически)
ADMIN_PASSWORD   = ваш_пароль_админа
NODE_ENV         = production
PORT             = 3000
```

Опционально (Telegram можно настроить через /admin → Настройки):
```
TELEGRAM_BOT_TOKEN = токен_бота
TELEGRAM_CHAT_ID   = chat_id
```

## 4. Создайте таблицы
После деплоя откройте в браузере:
```
https://ваш-сайт.railway.app/api/migrate
```
Это создаст все таблицы в PostgreSQL.

## 5. Заполните меню
После миграции зайдите в /admin и добавьте блюда через вкладку "Меню".

## Что где хранится
| Данные | Хранились | Теперь |
|---|---|---|
| Меню, заказы, бронь | Supabase | Railway PostgreSQL |
| Фронтенд | Vercel | Railway |
| Настройки | Supabase | Railway PostgreSQL |
