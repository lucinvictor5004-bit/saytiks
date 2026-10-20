import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface RemindersProps {
  userId: string;
}

interface Reminder {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export default function Reminders({ userId }: RemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    loadReminders();
    // Проверяем напоминания каждую минуту
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadReminders = async () => {
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('due_date');
    setReminders(data || []);
  };

  const checkReminders = async () => {
    const now = new Date();
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .lte('due_date', now.toISOString());

    if (data && data.length > 0) {
      // Показываем браузерное уведомление
      if ('Notification' in window && Notification.permission === 'granted') {
        data.forEach(reminder => {
          new Notification('🔔 Напоминание', {
            body: reminder.title,
            icon: '/favicon.ico'
          });
        });
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const openNewReminder = () => {
    setTitle('');
    setDescription('');
    const now = new Date();
    setDueDate(format(now, 'yyyy-MM-dd'));
    setDueTime(format(now, 'HH:mm'));
    setPriority('medium');
    setShowModal(true);
    requestNotificationPermission();
  };

  const saveReminder = async () => {
    if (!title.trim() || !dueDate || !dueTime) return;

    const dueDatetime = `${dueDate}T${dueTime}:00`;

    await supabase.from('reminders').insert({
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      due_date: dueDatetime,
      priority,
      completed: false
    });

    setShowModal(false);
    loadReminders();
  };

  const toggleComplete = async (reminder: Reminder) => {
    await supabase.from('reminders').update({
      completed: !reminder.completed
    }).eq('id', reminder.id);
    loadReminders();
  };

  const deleteReminder = async (id: string) => {
    if (window.confirm('Удалить напоминание?')) {
      await supabase.from('reminders').delete().eq('id', id);
      loadReminders();
    }
  };

  const priorityColors = {
    low: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
    medium: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
    high: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' }
  };

  const priorityLabels = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий'
  };

  const isOverdue = (reminder: Reminder) => {
    return !reminder.completed && new Date(reminder.due_date) < new Date();
  };

  return (
    <Layout userId={userId}>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>🔔 Напоминания</h1>
          <button
            onClick={openNewReminder}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#a78bfa',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >+ Новое напоминание</button>
        </div>

        {/* Уведомление о разрешениях */}
        {'Notification' in window && Notification.permission === 'default' && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#92400e' }}>
              Разреши уведомления, чтобы получать напоминания
            </span>
            <button
              onClick={requestNotificationPermission}
              style={{
                padding: '0.5rem 1rem',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >Разрешить</button>
          </div>
        )}

        {/* Список напоминаний */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reminders.length === 0 ? (
            <div style={{
              background: 'white',
              padding: '3rem',
              borderRadius: '1rem',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '1.125rem'
            }}>
              Нет активных напоминаний
            </div>
          ) : (
            reminders.map(reminder => {
              const colors = priorityColors[reminder.priority];
              const overdue = isOverdue(reminder);

              return (
                <div
                  key={reminder.id}
                  style={{
                    background: 'white',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderLeft: `4px solid ${colors.border}`,
                    opacity: reminder.completed ? 0.6 : 1,
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={reminder.completed}
                    onChange={() => toggleComplete(reminder)}
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      cursor: 'pointer',
                      marginTop: '0.25rem',
                      flexShrink: 0
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        background: colors.bg,
                        color: colors.text,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>{priorityLabels[reminder.priority]}</span>

                      <span style={{
                        fontSize: '0.875rem',
                        color: overdue ? '#991b1b' : '#6b7280',
                        fontWeight: overdue ? '600' : '400'
                      }}>
                        {overdue && '⚠️ '}
                        {format(new Date(reminder.due_date), 'd MMMM, HH:mm', { locale: ru })}
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      marginBottom: '0.25rem',
                      textDecoration: reminder.completed ? 'line-through' : 'none',
                      color: '#1f2937'
                    }}>{reminder.title}</h3>

                    {reminder.description && (
                      <p style={{
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        lineHeight: '1.5'
                      }}>{reminder.description}</p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#fee2e2',
                      color: '#991b1b',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      flexShrink: 0
                    }}
                  >Удалить</button>
                </div>
              );
            })
          )}
        </div>

        {/* Модалка создания напоминания */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }} onClick={() => setShowModal(false)}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              width: '90%',
              maxWidth: '500px'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                Новое напоминание
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Напоминание</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="О чём напомнить?"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Детали (необязательно)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Дополнительная информация"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Дата</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Время</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Приоритет</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: priority === p ? priorityColors[p].bg : '#f3f4f6',
                        color: priority === p ? priorityColors[p].text : '#6b7280',
                        border: priority === p ? `2px solid ${priorityColors[p].border}` : '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >{priorityLabels[p]}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={saveReminder}
                  disabled={!title.trim() || !dueDate || !dueTime}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: (title.trim() && dueDate && dueTime) ? '#a78bfa' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: (title.trim() && dueDate && dueTime) ? 'pointer' : 'not-allowed'
                  }}
                >Сохранить</button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    color: '#1f2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >Отмена</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
