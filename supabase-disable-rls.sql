-- Временно отключаем RLS для всех таблиц, чтобы приложение работало без авторизации
-- ВНИМАНИЕ: Это только для тестирования! В продакшене нужна авторизация или другие политики

ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Также нужно убрать NOT NULL для user_id, чтобы можно было создавать записи без user_id
ALTER TABLE tasks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE events ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE reminders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE study_tasks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE notes ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE diary_entries ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE settings ALTER COLUMN user_id DROP NOT NULL;
