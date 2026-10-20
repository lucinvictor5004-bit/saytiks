import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface StudyProps {
  userId: string;
}

interface Homework {
  id: string;
  subject: string;
  title: string;
  description: string;
  due_date: string;
  status: string;
}

interface ScheduleLesson {
  id: string;
  day_of_week: number;
  lesson_number: number;
  subject: string;
  teacher?: string;
  room?: string;
}

export default function Study({ userId }: StudyProps) {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [schedule, setSchedule] = useState<ScheduleLesson[]>([]);
  const [showHwModal, setShowHwModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<{day: number, lesson: number} | null>(null);

  // Форма ДЗ
  const [hwSubject, setHwSubject] = useState('');
  const [hwTitle, setHwTitle] = useState('');
  const [hwDescription, setHwDescription] = useState('');
  const [hwDate, setHwDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Форма расписания
  const [schedSubject, setSchedSubject] = useState('');
  const [schedTeacher, setSchedTeacher] = useState('');
  const [schedRoom, setSchedRoom] = useState('');

  useEffect(() => {
    loadHomework();
    loadSchedule();
  }, [userId]);

  const loadHomework = async () => {
    const { data } = await supabase
      .from('study_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('due_date');
    setHomework(data || []);
  };

  const loadSchedule = async () => {
    const { data } = await supabase
      .from('schedule')
      .select('*')
      .eq('user_id', userId)
      .order('day_of_week, lesson_number');
    setSchedule(data || []);
  };

  const saveHomework = async () => {
    if (!hwSubject.trim() || !hwTitle.trim()) return;

    await supabase.from('study_tasks').insert({
      user_id: userId,
      subject: hwSubject.trim(),
      title: hwTitle.trim(),
      description: hwDescription.trim(),
      due_date: hwDate,
      priority: 'medium',
      status: 'not_started'
    });

    setShowHwModal(false);
    setHwSubject('');
    setHwTitle('');
    setHwDescription('');
    loadHomework();
  };

  const toggleHwStatus = async (hw: Homework) => {
    const newStatus = hw.status === 'completed' ? 'not_started' : 'completed';
    await supabase.from('study_tasks').update({ status: newStatus }).eq('id', hw.id);
    loadHomework();
  };

  const deleteHomework = async (id: string) => {
    await supabase.from('study_tasks').delete().eq('id', id);
    loadHomework();
  };

  const openScheduleEdit = (day: number, lesson: number) => {
    const existing = schedule.find(s => s.day_of_week === day && s.lesson_number === lesson);
    setEditingLesson({day, lesson});
    setSchedSubject(existing?.subject || '');
    setSchedTeacher(existing?.teacher || '');
    setSchedRoom(existing?.room || '');
    setShowScheduleModal(true);
  };

  const saveSchedule = async () => {
    if (!editingLesson || !schedSubject.trim()) return;

    const existing = schedule.find(s =>
      s.day_of_week === editingLesson.day && s.lesson_number === editingLesson.lesson
    );

    if (existing) {
      await supabase.from('schedule').update({
        subject: schedSubject.trim(),
        teacher: schedTeacher.trim(),
        room: schedRoom.trim()
      }).eq('id', existing.id);
    } else {
      await supabase.from('schedule').insert({
        user_id: userId,
        day_of_week: editingLesson.day,
        lesson_number: editingLesson.lesson,
        subject: schedSubject.trim(),
        teacher: schedTeacher.trim(),
        room: schedRoom.trim()
      });
    }

    setShowScheduleModal(false);
    setEditingLesson(null);
    loadSchedule();
  };

  const deleteScheduleLesson = async () => {
    if (!editingLesson) return;
    const existing = schedule.find(s =>
      s.day_of_week === editingLesson.day && s.lesson_number === editingLesson.lesson
    );
    if (existing) {
      await supabase.from('schedule').delete().eq('id', existing.id);
      setShowScheduleModal(false);
      setEditingLesson(null);
      loadSchedule();
    }
  };

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const maxLessons = 8;

  const getLesson = (day: number, lesson: number) => {
    return schedule.find(s => s.day_of_week === day && s.lesson_number === lesson);
  };

  return (
    <Layout userId={userId}>
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '2rem' }}>📚 Учёба</h1>

        {/* Расписание */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Расписание уроков</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '1rem', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Урок</th>
                  {weekDays.map((day, i) => (
                    <th key={i} style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#6b7280' }}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxLessons }).map((_, lessonIdx) => (
                  <tr key={lessonIdx} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem', fontWeight: '600', color: '#6b7280' }}>{lessonIdx + 1}</td>
                    {weekDays.map((_, dayIdx) => {
                      const lesson = getLesson(dayIdx + 1, lessonIdx + 1);
                      return (
                        <td
                          key={dayIdx}
                          onClick={() => openScheduleEdit(dayIdx + 1, lessonIdx + 1)}
                          style={{
                            padding: '0.5rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: lesson ? '#f5f3ff' : 'white',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = lesson ? '#ede9fe' : '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = lesson ? '#f5f3ff' : 'white'}
                        >
                          {lesson ? (
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#7c3aed' }}>{lesson.subject}</div>
                              {lesson.teacher && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{lesson.teacher}</div>}
                              {lesson.room && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{lesson.room}</div>}
                            </div>
                          ) : (
                            <div style={{ color: '#d1d5db', fontSize: '0.75rem' }}>+ добавить</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Домашние задания */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Домашние задания</h2>
            <button
              onClick={() => setShowHwModal(true)}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#a78bfa',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >+ Добавить ДЗ</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {homework.length === 0 ? (
              <div style={{
                background: 'white',
                padding: '3rem',
                borderRadius: '1rem',
                textAlign: 'center',
                color: '#9ca3af'
              }}>Нет домашних заданий</div>
            ) : (
              homework.map(hw => (
                <div
                  key={hw.id}
                  style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    gap: '1rem',
                    opacity: hw.status === 'completed' ? 0.6 : 1
                  }}
                >
                  <input
                    type="checkbox"
                    checked={hw.status === 'completed'}
                    onChange={() => toggleHwStatus(hw)}
                    style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{
                        background: '#ddd6fe',
                        color: '#5b21b6',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>{hw.subject}</span>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        📅 {format(new Date(hw.due_date), 'd MMMM', { locale: ru })}
                      </span>
                    </div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      marginBottom: '0.25rem',
                      textDecoration: hw.status === 'completed' ? 'line-through' : 'none'
                    }}>{hw.title}</h3>
                    {hw.description && (
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{hw.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteHomework(hw.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#fee2e2',
                      color: '#991b1b',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >Удалить</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Модалка добавления ДЗ */}
        {showHwModal && (
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
          }} onClick={() => setShowHwModal(false)}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              width: '90%',
              maxWidth: '500px'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Новое ДЗ</h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Предмет</label>
                <input
                  type="text"
                  value={hwSubject}
                  onChange={(e) => setHwSubject(e.target.value)}
                  placeholder="Математика"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Задание</label>
                <input
                  type="text"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  placeholder="Стр. 45, №12-18"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Детали</label>
                <textarea
                  value={hwDescription}
                  onChange={(e) => setHwDescription(e.target.value)}
                  placeholder="Дополнительная информация"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Срок сдачи</label>
                <input
                  type="date"
                  value={hwDate}
                  onChange={(e) => setHwDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={saveHomework}
                  disabled={!hwSubject.trim() || !hwTitle.trim()}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: (hwSubject.trim() && hwTitle.trim()) ? '#a78bfa' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: (hwSubject.trim() && hwTitle.trim()) ? 'pointer' : 'not-allowed'
                  }}
                >Сохранить</button>
                <button
                  onClick={() => setShowHwModal(false)}
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

        {/* Модалка редактирования расписания */}
        {showScheduleModal && editingLesson && (
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
          }} onClick={() => setShowScheduleModal(false)}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              width: '90%',
              maxWidth: '400px'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                {weekDays[editingLesson.day - 1]}, урок {editingLesson.lesson}
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Предмет</label>
                <input
                  type="text"
                  value={schedSubject}
                  onChange={(e) => setSchedSubject(e.target.value)}
                  placeholder="Математика"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Учитель</label>
                <input
                  type="text"
                  value={schedTeacher}
                  onChange={(e) => setSchedTeacher(e.target.value)}
                  placeholder="Иванов И.И."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Кабинет</label>
                <input
                  type="text"
                  value={schedRoom}
                  onChange={(e) => setSchedRoom(e.target.value)}
                  placeholder="301"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                  onClick={saveSchedule}
                  disabled={!schedSubject.trim()}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: schedSubject.trim() ? '#a78bfa' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: schedSubject.trim() ? 'pointer' : 'not-allowed'
                  }}
                >Сохранить</button>
                <button
                  onClick={() => setShowScheduleModal(false)}
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

              {schedule.find(s => s.day_of_week === editingLesson.day && s.lesson_number === editingLesson.lesson) && (
                <button
                  onClick={deleteScheduleLesson}
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
                >Удалить урок</button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
