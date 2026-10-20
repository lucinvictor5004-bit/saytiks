import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthForm } from './components/AuthForm'
import Home from './pages/Home'
import Calendar from './pages/Calendar'
import Study from './pages/Study'
import Tasks from './pages/Tasks'
import Notes from './pages/Notes'
import Diary from './pages/Diary'
import Reminders from './pages/Reminders'
import Settings from './pages/Settings'

function App() {
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState<string>('')

  useEffect(() => {
    // Проверяем, есть ли сохранённый пользователь
    const savedUserId = localStorage.getItem('userId')
    const savedUsername = localStorage.getItem('displayName')
    if (savedUserId && savedUsername) {
      setUserId(savedUserId)
      setUsername(savedUsername)
    }
  }, [])

  const handleAuthSuccess = (id: string, name: string) => {
    setUserId(id)
    setUsername(name)
  }

  const handleLogout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('displayName')
    setUserId(null)
    setUsername('')
  }

  // Показываем форму авторизации, если пользователь не вошёл
  if (!userId) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />
  }

  // Передаём userId и функцию выхода во все страницы через контекст
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home userId={userId} username={username} onLogout={handleLogout} />} />
        <Route path="/calendar" element={<Calendar userId={userId} />} />
        <Route path="/study" element={<Study userId={userId} />} />
        <Route path="/tasks" element={<Tasks userId={userId} />} />
        <Route path="/notes" element={<Notes userId={userId} />} />
        <Route path="/diary" element={<Diary userId={userId} />} />
        <Route path="/reminders" element={<Reminders userId={userId} />} />
        <Route path="/settings" element={<Settings userId={userId} onLogout={handleLogout} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
