# 📅 Planner App

Персональный планировщик с календарем, задачами, учебным расписанием, заметками, дневником и напоминаниями.

## 🚀 Деплой на Vercel

1. Зайди на [vercel.com](https://vercel.com) и залогинься через GitHub
2. Нажми **Add New** → **Project**
3. Импортируй репозиторий `lucinvictor5004-bit/saytiks`
4. Выбери ветку `develop`
5. Добавь переменные окружения:
   - `VITE_SUPABASE_URL` = `https://zvrqfdvphgtyssxuypqf.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = твой anon key из Supabase
6. Нажми **Deploy**

## 🛠️ Технологии

- React 18 + TypeScript
- Vite
- Supabase (PostgreSQL)
- React Router
- Date-fns
- Lucide React (иконки)

## ✨ Возможности

- 📅 **Календарь** — события с цветами и описанием
- 📚 **Учёба** — расписание уроков (8 уроков × 7 дней) + домашние задания
- ✅ **Задачи** — недельная сетка (24 часа × 7 дней) с галочками
- 📝 **Заметки** — цветные стикеры на холсте
- 📖 **Дневник** — странички с текстом, рисунками и настроением
- ⏰ **Напоминания** — уведомления браузера
- 🎨 **Настройки** — светлая/тёмная тема

## 🔧 Локальная разработка

```bash
npm install
npm run dev
```

## 📦 Сборка

```bash
npm run build
npm run preview
```

## 🗄️ База данных

Supabase PostgreSQL — таблицы: `users`, `tasks`, `events`, `reminders`, `study_tasks`, `notes`, `diary_entries`, `settings`, `schedule`

SQL миграции в корне проекта:
- `supabase-setup.sql` — основные таблицы
- `supabase-auth-setup.sql` — таблица пользователей
- `supabase-add-schedule.sql` — расписание уроков
