import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Task {
  id: string
  user_id: string
  title: string
  description?: string
  category: string
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  due_date?: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  user_id: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  color: string
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly'
  created_at: string
  updated_at: string
}

export interface Reminder {
  id: string
  user_id: string
  title: string
  description?: string
  due_date: string
  priority: 'low' | 'medium' | 'high'
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly'
  completed: boolean
  created_at: string
  updated_at: string
}

export interface StudyTask {
  id: string
  user_id: string
  subject: string
  title: string
  description?: string
  due_date: string
  priority: 'low' | 'medium' | 'high'
  status: 'not_started' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  color?: string
  tags?: string[]
  is_pinned: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface DiaryEntry {
  id: string
  user_id: string
  date: string
  content?: string
  mood?: string
  drawing_data?: string
  created_at: string
  updated_at: string
}

export interface Settings {
  id: string
  user_id: string
  theme: 'light' | 'dark' | 'system'
  accent_color: string
  time_format: '12h' | '24h'
  notifications_enabled: boolean
  created_at: string
  updated_at: string
}
