import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { supabase, type Settings } from '../supabaseClient'

interface SettingsProps {
  userId: string;
  onLogout?: () => void;
}

export default function Settings({ userId, onLogout }: SettingsProps) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')
  const [accentColor, setAccentColor] = useState('#a78bfa')
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    applyTheme()
  }, [theme])

  const loadSettings = async () => {
    // Используем userId из пропсов вместо Supabase Auth
    if (!userId) return

    const { data } = await supabase.from('settings').select('*').eq('user_id', userId).limit(1)
    if (data && data.length > 0) {
      const settingsData = data[0]
      setSettings(settingsData)
      setTheme(settingsData.theme)
      setAccentColor(settingsData.accent_color)
      setTimeFormat(settingsData.time_format)
      setNotificationsEnabled(settingsData.notifications_enabled)
    } else {
      // Create default settings
      const defaultSettings = {
        user_id: userId,
        theme: 'light' as const,
        accent_color: '#a78bfa',
        time_format: '24h' as const,
        notifications_enabled: true
      }
      await supabase.from('settings').insert([defaultSettings])
      loadSettings()
    }
  }

  const applyTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const saveSettings = async () => {
    if (!userId) return

    const newSettings = {
      theme,
      accent_color: accentColor,
      time_format: timeFormat,
      notifications_enabled: notificationsEnabled
    }

    if (settings) {
      await supabase.from('settings').update(newSettings).eq('id', settings.id)
    } else {
      await supabase.from('settings').insert([{ ...newSettings, user_id: userId }])
    }

    alert('Настройки сохранены!')
    loadSettings()
  }

  return (
    <Layout userId={userId} onLogout={onLogout}>
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Настройки</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Theme */}
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Тема оформления</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {(['light', 'dark', 'system'] as const).map(t => (
                <button key={t} onClick={() => setTheme(t)} style={{
                  padding: '1rem', border: theme === t ? '2px solid #a78bfa' : '1px solid #ddd',
                  borderRadius: '8px', background: '#fff', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                }}>
                  <div style={{
                    width: '60px', height: '40px', borderRadius: '6px',
                    background: t === 'light' ? '#fff' : t === 'dark' ? '#111' : 'linear-gradient(90deg, #fff 50%, #111 50%)',
                    border: '1px solid #ddd'
                  }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: theme === t ? '600' : '400' }}>
                    {t === 'light' ? 'Светлая' : t === 'dark' ? 'Тёмная' : 'Системная'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Акцентный цвет</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {['#a78bfa', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899'].map(color => (
                <button key={color} onClick={() => setAccentColor(color)} style={{
                  width: '50px', height: '50px', borderRadius: '8px',
                  background: color, border: accentColor === color ? '3px solid #000' : '1px solid #ddd',
                  cursor: 'pointer'
                }} />
              ))}
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                style={{ width: '50px', height: '50px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }} />
            </div>
          </div>

          {/* Time Format */}
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Формат времени</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {(['12h', '24h'] as const).map(format => (
                <button key={format} onClick={() => setTimeFormat(format)} style={{
                  padding: '1rem', border: timeFormat === format ? '2px solid #a78bfa' : '1px solid #ddd',
                  borderRadius: '8px', background: '#fff', cursor: 'pointer',
                  fontWeight: timeFormat === format ? '600' : '400'
                }}>
                  {format === '12h' ? '12-часовой (AM/PM)' : '24-часовой'}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Уведомления</h2>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>Получать уведомления о событиях и напоминаниях</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                <input type="checkbox" checked={notificationsEnabled} onChange={e => setNotificationsEnabled(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                  background: notificationsEnabled ? '#a78bfa' : '#ccc', borderRadius: '34px',
                  transition: '0.4s'
                }}>
                  <span style={{
                    position: 'absolute', content: '""', height: '26px', width: '26px',
                    left: notificationsEnabled ? '30px' : '4px', bottom: '4px',
                    background: '#fff', borderRadius: '50%', transition: '0.4s'
                  }} />
                </span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <button onClick={saveSettings} style={{
            padding: '1rem', background: '#a78bfa', color: '#fff',
            border: 'none', borderRadius: '12px', cursor: 'pointer',
            fontSize: '1.125rem', fontWeight: '600', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            Сохранить настройки
          </button>
        </div>
      </div>
    </Layout>
  )
}
