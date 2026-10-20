import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface HomeProps {
  userId: string;
  username: string;
  onLogout: () => void;
}

export default function Home({ userId, username, onLogout }: HomeProps) {
  const navigate = useNavigate();
  const [todayEvents, setTodayEvents] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [todayReminders, setTodayReminders] = useState<any[]>([]);
  const [todayStudy, setTodayStudy] = useState<any[]>([]);

  useEffect(() => {
    loadTodayData();
  }, [userId]);

  const loadTodayData = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');

    // События на сегодня
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .eq('start_date', today);
    setTodayEvents(events || []);

    // Задачи на сегодня
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('due_date', today)
      .eq('completed', false);
    setTodayTasks(tasks || []);

    // Напоминания на сегодня
    const { data: reminders } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .gte('due_date', `${today}T00:00:00`)
      .lte('due_date', `${today}T23:59:59`)
      .eq('completed', false);
    setTodayReminders(reminders || []);

    // Учебные задания на сегодня
    const { data: study } = await supabase
      .from('study_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('due_date', today)
      .neq('status', 'completed');
    setTodayStudy(study || []);
  };

  return (
    <Layout userId={userId} onLogout={onLogout}>
      <div style={{ padding: '2rem', paddingBottom: '6rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Привет, {username}! 👋
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
            {format(new Date(), 'd MMMM yyyy, EEEE', { locale: ru })}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* События */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer'
          }} onClick={() => navigate('/calendar')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>📅 События</h3>
              <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '500' }}>
                {todayEvents.length}
              </span>
            </div>
            {todayEvents.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Нет событий на сегодня</p>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {todayEvents.slice(0, 3).map(event => (
                  <li key={event.id} style={{ color: '#374151', fontSize: '0.875rem' }}>
                    • {event.title}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Задачи */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer'
          }} onClick={() => navigate('/tasks')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>✓ Дела</h3>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '500' }}>
                {todayTasks.length}
              </span>
            </div>
            {todayTasks.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Нет задач на сегодня</p>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {todayTasks.slice(0, 3).map(task => (
                  <li key={task.id} style={{ color: '#374151', fontSize: '0.875rem' }}>
                    • {task.title}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Учёба */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer'
          }} onClick={() => navigate('/study')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>📚 Учёба</h3>
              <span style={{ background: '#ddd6fe', color: '#5b21b6', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '500' }}>
                {todayStudy.length}
              </span>
            </div>
            {todayStudy.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Нет заданий на сегодня</p>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {todayStudy.slice(0, 3).map(task => (
                  <li key={task.id} style={{ color: '#374151', fontSize: '0.875rem' }}>
                    • {task.subject}: {task.title}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Напоминания */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer'
          }} onClick={() => navigate('/reminders')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>🔔 Напоминания</h3>
              <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '500' }}>
                {todayReminders.length}
              </span>
            </div>
            {todayReminders.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Нет напоминаний на сегодня</p>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {todayReminders.slice(0, 3).map(reminder => (
                  <li key={reminder.id} style={{ color: '#374151', fontSize: '0.875rem' }}>
                    • {reminder.title} ({format(new Date(reminder.due_date), 'HH:mm')})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Быстрые действия */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>Быстрые действия</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/notes')} style={{
              padding: '0.75rem 1.5rem',
              background: '#fef3c7',
              color: '#92400e',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              📝 Новая заметка
            </button>
            <button onClick={() => navigate('/diary')} style={{
              padding: '0.75rem 1.5rem',
              background: '#ddd6fe',
              color: '#5b21b6',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              📔 Открыть дневник
            </button>
            <button onClick={() => navigate('/calendar')} style={{
              padding: '0.75rem 1.5rem',
              background: '#dbeafe',
              color: '#1e40af',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              📅 Добавить событие
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
