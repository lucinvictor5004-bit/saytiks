-- Добавляем таблицу расписания
CREATE TABLE IF NOT EXISTS schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7), -- 1=Пн, 7=Вс
  lesson_number INTEGER NOT NULL CHECK (lesson_number >= 1 AND lesson_number <= 10),
  subject TEXT NOT NULL,
  teacher TEXT,
  room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week, lesson_number)
);

CREATE INDEX IF NOT EXISTS idx_schedule_user_id ON schedule(user_id);
ALTER TABLE schedule DISABLE ROW LEVEL SECURITY;
