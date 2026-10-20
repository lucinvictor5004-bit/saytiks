-- Создаём таблицу для пользователей с простой авторизацией (username + password)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Индекс для быстрого поиска по username
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Отключаем RLS для всех таблиц (упрощённая версия без строгой безопасности)
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Меняем user_id на необязательное поле
ALTER TABLE tasks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE events ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE reminders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE study_tasks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE notes ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE diary_entries ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE settings ALTER COLUMN user_id DROP NOT NULL;
