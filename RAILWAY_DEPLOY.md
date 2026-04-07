# 🚂 Деплой «Соль и Перец» на Railway — пошаговая инструкция

## Что вы получите
- Полноценный сайт кафе на вашем домене
- PostgreSQL база данных на Railway (бесплатно до $5/мес)
- Автодеплой при пуше в GitHub
- Telegram уведомления о заказах и бронях

---

## Шаг 1 — Подготовьте GitHub репозиторий

### 1.1 Установите Git (если нет)
```bash
# Windows: скачайте с https://git-scm.com
# Mac:
brew install git
```

### 1.2 Создайте репозиторий на GitHub
1. Зайдите на **github.com** → New repository
2. Название: `sol-i-perec` (или любое)
3. Visibility: **Private** (рекомендуется)
4. Нажмите **Create repository**

### 1.3 Загрузите код
```bash
# В папке с проектом:
git init
git add .
git commit -m "Initial commit — Соль и Перец"
git remote add origin https://github.com/ВАШ_ЛОГИН/sol-i-perec.git
git push -u origin main
```

> ⚠️ Убедитесь что `.gitignore` содержит строку `.env` — не загружайте секреты!

---

## Шаг 2 — Создайте проект на Railway

1. Зайдите на **railway.app** → Sign in with GitHub
2. Нажмите **New Project**
3. Выберите **Deploy from GitHub repo**
4. Выберите репозиторий `sol-i-perec`
5. Railway автоматически определит Dockerfile ✅

---

## Шаг 3 — Добавьте PostgreSQL базу данных

1. В вашем проекте на Railway нажмите **+ New**
2. Выберите **Database → Add PostgreSQL**
3. PostgreSQL создастся автоматически (~30 секунд)
4. Нажмите на PostgreSQL → вкладка **Variables**
5. Скопируйте значение `DATABASE_URL` — оно понадобится

> Railway автоматически добавит `DATABASE_URL` в переменные вашего сервиса ✅

---

## Шаг 4 — Настройте переменные окружения

1. Нажмите на ваш сервис (не PostgreSQL, а само приложение)
2. Перейдите во вкладку **Variables**
3. Нажмите **+ New Variable** и добавьте каждую:

| Переменная | Значение | Обязательна |
|---|---|---|
| `DATABASE_URL` | автоматически от PostgreSQL | ✅ |
| `ADMIN_PASSWORD` | ваш пароль для /admin | ✅ |
| `MIGRATE_SECRET` | секрет для миграции (любое слово) | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `TELEGRAM_BOT_TOKEN` | токен бота (см. ниже) | ❌ позже |
| `TELEGRAM_CHAT_ID` | ID чата (см. ниже) | ❌ позже |

### Как добавить все переменные сразу (RAW режим):
Нажмите **RAW Editor** и вставьте:
```
ADMIN_PASSWORD=ваш_пароль
MIGRATE_SECRET=migrate2025
NODE_ENV=production
```
`DATABASE_URL` Railway добавит автоматически.

---

## Шаг 5 — Дождитесь первого деплоя

1. Railway автоматически запустит build (2-5 минут)
2. Следите за логами во вкладке **Deployments**
3. Когда увидите `🚀 Соль и Перец | port 3000` — готово!

### Проверьте health check:
```
https://ВАШ-ДОМЕН.railway.app/api/health
```
Должно вернуть: `{"ok":true,"db":"postgresql",...}`

---

## Шаг 6 — Запустите миграцию базы данных

Откройте в браузере (замените домен и секрет):
```
https://ВАШ-ДОМЕН.railway.app/api/migrate?secret=migrate2025
```

Должны увидеть:
```json
{
  "ok": true,
  "message": "🚀 Migration complete! Your database is ready.",
  "results": [
    "✅ All tables created",
    "✅ Settings seeded",
    "✅ Delivery zones seeded",
    "✅ Promotions seeded",
    "✅ Promo codes seeded",
    "✅ Gallery seeded",
    "✅ Reviews seeded"
  ]
}
```

> ✅ Миграцию можно запускать повторно — она безопасна (использует IF NOT EXISTS)

---

## Шаг 7 — Войдите в админ-панель

1. Откройте `https://ВАШ-ДОМЕН.railway.app/admin`
2. Введите пароль из переменной `ADMIN_PASSWORD`
3. Перейдите в **Настройки** и настройте Telegram

---

## Шаг 8 — Настройте Telegram уведомления

### 8.1 Создайте бота
1. Откройте Telegram → найдите **@BotFather**
2. Отправьте `/newbot`
3. Придумайте имя: `Соль и Перец Уведомления`
4. Придумайте username: `solperets_notify_bot`
5. Скопируйте **токен**: `123456789:ABCdefGHIjklMNOpqrSTUvwxYZ`

### 8.2 Узнайте Chat ID
**Вариант А — личные уведомления:**
1. Напишите боту `/start`
2. Откройте: `https://api.telegram.org/botВАШ_ТОКЕН/getUpdates`
3. Найдите `"chat":{"id":XXXXXXXXX}` — это ваш Chat ID

**Вариант Б — группа/канал:**
1. Создайте группу в Telegram
2. Добавьте бота как администратора
3. Напишите любое сообщение в группу
4. Откройте: `https://api.telegram.org/botВАШ_ТОКЕН/getUpdates`
5. Chat ID будет отрицательным: `-100XXXXXXXXXX`

### 8.3 Сохраните в админке
1. `/admin` → Настройки
2. Вставьте токен и Chat ID
3. Нажмите **Тест** — должно прийти сообщение!
4. Нажмите **Сохранить**

---

## Шаг 9 — Настройте домен (опционально)

### Бесплатный домен Railway:
1. Вкладка **Settings** → **Networking** → **Generate Domain**
2. Получите: `sol-i-perec-production.up.railway.app`

### Свой домен:
1. **Settings** → **Custom Domain** → введите домен
2. Добавьте CNAME запись у регистратора:
   ```
   CNAME  @  ВАШ-ДОМЕН.railway.app
   ```

---

## Шаг 10 — Добавьте меню

Меню добавляется через **Админ-панель → Меню**:
1. Нажмите **Добавить блюдо**
2. Заполните: название, цена, категория, фото (URL)
3. Сохраните

> Фото блюд: загружайте на Imgur (imgur.com) или любой хостинг и вставляйте URL

---

## Автодеплой при обновлении кода

После настройки каждый `git push` автоматически деплоит новую версию:
```bash
git add .
git commit -m "Обновил меню"
git push
```
Railway сам пересоберёт и задеплоит (2-3 минуты).

---

## Устранение проблем

### ❌ Build failed
```
Проверьте: Deployments → Logs
Частая причина: ошибка TypeScript
Решение: npm run build локально и исправьте ошибки
```

### ❌ DATABASE_URL is not set
```
Убедитесь что PostgreSQL плагин добавлен в тот же проект
Railway → ваш сервис → Variables → должна быть DATABASE_URL
```

### ❌ /api/health возвращает ошибку
```
Подождите 1-2 минуты после деплоя
Проверьте Deployments → последний деплой должен быть зелёным
```

### ❌ Миграция вернула ошибку
```json
{"error": "DATABASE_URL is not set..."}
```
Добавьте PostgreSQL плагин в Railway и повторите миграцию.

### ❌ Telegram не работает
1. Проверьте токен: `https://api.telegram.org/botВАШ_ТОКЕН/getMe`
2. Бот должен быть добавлен в чат как администратор
3. Используйте кнопку **Тест** в /admin → Настройки

---

## Структура проекта

```
├── Dockerfile          # Docker образ для Railway
├── railway.toml        # Конфигурация Railway
├── server.js           # Express сервер (API + SPA)
├── api/
│   ├── _db.js          # PostgreSQL клиент
│   ├── _tg.js          # Telegram helper
│   ├── migrate.js      # Миграция БД (запустить 1 раз)
│   ├── menu.js         # CRUD меню
│   ├── orders.js       # Заказы + Telegram
│   ├── reservations.js # Бронь столов + Telegram
│   ├── banquets.js     # Банкеты + Telegram
│   ├── reviews.js      # Отзывы
│   ├── settings.js     # Настройки (TG токен и т.д.)
│   ├── promotions.js   # Акции
│   ├── gallery.js      # Галерея
│   ├── promocodes.js   # Промокоды
│   └── delivery-zones.js # Зоны доставки
├── src/                # React + TypeScript frontend
│   ├── pages/          # Страницы
│   ├── components/     # Компоненты
│   └── lib/            # Утилиты
└── public/             # Статика (изображения и т.д.)
```

---

## Стоимость Railway

| Тариф | Цена | Что включено |
|---|---|---|
| Hobby | $5/мес | 512MB RAM, 1GB PostgreSQL |
| Pro | $20/мес | 8GB RAM, 100GB PostgreSQL |

> Для кафе хватит **Hobby** ($5/мес = ~450₽/мес)

---

## Контакты для поддержки

- Railway документация: **docs.railway.app**
- Telegram Railway: **@railway_app**
