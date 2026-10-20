import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { format, startOfWeek, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TasksProps {
  userId: string;
}

interface Task {
  id: string;
  title: string;
  day_of_week: number; // 1=Пн, 7=Вс
  time_slot: number; // 0-23 (час дня)
  completed: boolean;
}

export default function Tasks({ userId }: TasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{day: number, hour: number} | null>(null);
  const [taskTitle, setTaskTitle] = useState('');

  useEffect(() => {
    loadTasks();
  }, [userId]);

  const loadTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .not('category', 'is', null); // Фильтр для недельного расписания

    // Преобразуем tasks в нужный формат (используем description для хранения day_of_week и time_slot)
    const weekTasks: Task[] = (data || [])
      .filter(t => t.description?.startsWith('WEEK:'))
      .map(t => {
        const [_, day, hour] = t.description!.split(':');
        return {
          id: t.id,
          title: t.title,
          day_of_week: parseInt(day),
          time_slot: parseInt(hour),
          completed: t.completed
        };
      });

    setTasks(weekTasks);
  };

  const openModal = (day: number, hour: number) => {
    const existing = tasks.find(t => t.day_of_week === day && t.time_slot === hour);
    if (existing) {
      setTaskTitle(existing.title);
      setSelectedSlot({day, hour});
      setShowModal(true);
    } else {
      setSelectedSlot({day, hour});
      setTaskTitle('');
      setShowModal(true);
    }
  };

  const saveTask = async () => {
    if (!selectedSlot || !taskTitle.trim()) return;

    const existing = tasks.find(t => t.day_of_week === selectedSlot.day && t.time_slot === selectedSlot.hour);

    if (existing) {
      // Обновляем существующую задачу
      await supabase.from('tasks').update({
        title: taskTitle.trim()
      }).eq('id', existing.id);
    } else {
      // Создаём новую задачу
      await supabase.from('tasks').insert({
        user_id: userId,
        title: taskTitle.trim(),
        description: `WEEK:${selectedSlot.day}:${selectedSlot.hour}`,
        category: 'Распорядок',
        priority: 'medium',
        completed: false
      });
    }

    setShowModal(false);
    setSelectedSlot(null);
    loadTasks();
  };

  const deleteTask = async () => {
    if (!selectedSlot) return;
    const existing = tasks.find(t => t.day_of_week === selectedSlot.day && t.time_slot === selectedSlot.hour);
    if (existing) {
      await supabase.from('tasks').delete().eq('id', existing.id);
      setShowModal(false);
      setSelectedSlot(null);
      loadTasks();
    }
  };

  const toggleComplete = async (task: Task) => {
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id);
    loadTasks();
  };

  const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0-23

  const getTaskForSlot = (day: number, hour: number) => {
    return tasks.find(t => t.day_of_week === day && t.time_slot === hour);
  };

  return (
    <Layout userId={userId}>
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '2rem' }}>✓ Распорядок дня</h1>

        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'white',
            borderRadius: '1rem',
            overflow: 'hidden'
          }}>
            <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#6b7280',
                  position: 'sticky',
                  left: 0,
                  background: '#f3f4f6',
                  zIndex: 11
                }}>Время</th>
                {weekDays.map((day, i) => (
                  <th key={i} style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#6b7280',
                    minWidth: '150px'
                  }}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map(hour => (
                <tr key={hour} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{
                    padding: '1rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    position: 'sticky',
                    left: 0,
                    background: 'white',
                    borderRight: '1px solid #e5e7eb'
                  }}>
                    {hour.toString().padStart(2, '0')}:00
                  </td>
                  {weekDays.map((_, dayIdx) => {
                    const task = getTaskForSlot(dayIdx + 1, hour);
                    return (
                      <td
                        key={dayIdx}
                        onClick={() => openModal(dayIdx + 1, hour)}
                        style={{
                          padding: '0.5rem',
                          cursor: 'pointer',
                          background: task ? (task.completed ? '#dcfce7' : '#fef3c7') : 'white',
                          transition: 'all 0.2s',
                          verticalAlign: 'top'
                        }}
                        onMouseEnter={(e) => {
                          if (!task) e.currentTarget.style.background = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          if (!task) e.currentTarget.style.background = 'white';
                        }}
                      >
                        {task ? (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleComplete(task);
                              }}
                              style={{ marginTop: '0.25rem', cursor: 'pointer', flexShrink: 0 }}
                            />
                            <span style={{
                              fontSize: '0.875rem',
                              color: task.completed ? '#16a34a' : '#92400e',
                              textDecoration: task.completed ? 'line-through' : 'none',
                              wordBreak: 'break-word'
                            }}>{task.title}</span>
                          </div>
                        ) : (
                          <div style={{ color: '#d1d5db', fontSize: '0.75rem', textAlign: 'center' }}>+</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Модалка редактирования задачи */}
        {showModal && selectedSlot && (
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
              maxWidth: '400px'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                {weekDays[selectedSlot.day - 1]}, {selectedSlot.hour.toString().padStart(2, '0')}:00
              </h3>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Задача</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Что нужно сделать?"
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

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                  onClick={saveTask}
                  disabled={!taskTitle.trim()}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: taskTitle.trim() ? '#a78bfa' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: taskTitle.trim() ? 'pointer' : 'not-allowed'
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

              {tasks.find(t => t.day_of_week === selectedSlot.day && t.time_slot === selectedSlot.hour) && (
                <button
                  onClick={deleteTask}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#fee2e2',
                    color: '#991b1b',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >Удалить</button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
