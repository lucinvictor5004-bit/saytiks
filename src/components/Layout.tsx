import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, BookOpen, ListTodo, StickyNote, BookHeart, Bell, Settings, Menu, X } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  userId: string
  onLogout?: () => void
}

const navItems = [
  { path: '/', icon: Home, label: 'Мой день' },
  { path: '/calendar', icon: Calendar, label: 'Календарь' },
  { path: '/study', icon: BookOpen, label: 'Учёба' },
  { path: '/tasks', icon: ListTodo, label: 'Дела' },
  { path: '/notes', icon: StickyNote, label: 'Заметки' },
  { path: '/diary', icon: BookHeart, label: 'Дневник' },
  { path: '/reminders', icon: Bell, label: 'Напоминания' },
  { path: '/settings', icon: Settings, label: 'Настройки' },
]

export default function Layout({ children, userId, onLogout }: LayoutProps) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#fafafa' }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: '250px',
        background: '#fff',
        borderRight: '1px solid #e0e0e0',
        padding: '2rem 0',
        display: 'none'
      }} className="desktop-sidebar">
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '2rem',
          paddingLeft: '1.5rem',
          color: '#a78bfa'
        }}>Планировщик</h1>
        <nav>
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  textDecoration: 'none',
                  color: isActive ? '#a78bfa' : '#666',
                  background: isActive ? '#f3f0ff' : 'transparent',
                  borderLeft: isActive ? '3px solid #a78bfa' : '3px solid transparent',
                  fontWeight: isActive ? '600' : '400'
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {/* Mobile Header */}
        <header style={{
          display: 'none',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#fff',
          borderBottom: '1px solid #e0e0e0',
          padding: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }} className="mobile-nav">
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#a78bfa'
          }}>Планировщик</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666'
            }}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </header>

        {/* Mobile Full-Screen Menu */}
        {mobileMenuOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#fff',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem'
          }} className="mobile-nav">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#a78bfa'
              }}>Меню</h1>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666'
                }}
              >
                <X size={32} />
              </button>
            </div>

            <nav style={{ flex: 1, overflowY: 'auto' }}>
              {navItems.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1.25rem 1rem',
                      textDecoration: 'none',
                      color: isActive ? '#a78bfa' : '#374151',
                      background: isActive ? '#f3f0ff' : 'transparent',
                      borderRadius: '0.75rem',
                      marginBottom: '0.5rem',
                      fontSize: '1.125rem',
                      fontWeight: isActive ? '600' : '500',
                      borderLeft: isActive ? '4px solid #a78bfa' : '4px solid transparent'
                    }}
                  >
                    <Icon size={28} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {onLogout && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onLogout()
                }}
                style={{
                  padding: '1rem',
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                Выйти из аккаунта
              </button>
            )}
          </div>
        )}

        {children}
      </main>

      {/* Mobile Bottom Navigation - Быстрые ссылки */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        borderTop: '1px solid #e0e0e0',
        display: 'none',
        gridTemplateColumns: 'repeat(4, 1fr)',
        padding: 0,
        zIndex: 50
      }} className="mobile-nav">
        {navItems.slice(0, 4).map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                textDecoration: 'none',
                color: isActive ? '#a78bfa' : '#6b7280',
                fontSize: '0.7rem',
                fontWeight: isActive ? '600' : '400',
                padding: '0.5rem 0',
                flex: 1
              }}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{
                whiteSpace: 'nowrap'
              }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
