import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CalendarProps {
  userId: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  color: string;
}

export default function Calendar({ userId }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#a78bfa');

  useEffect(() => {
    loadEvents();
  }, [currentDate, userId]);

  const loadEvents = async () => {
    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', start)
      .lte('start_date', end)
      .order('start_date');

    setEvents(data || []);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowModal(true);
    setTitle('');
    setDescription('');
  };

  const handleSave = async () => {
    if (!selectedDate || !title.trim()) return;

    await supabase.from('events').insert({
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      start_date: format(selectedDate, 'yyyy-MM-dd'),
      color
    });

    setShowModal(false);
    loadEvents();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    loadEvents();
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(e => isSameDay(new Date(e.start_date), date));
  };

  return (
    <Layout userId={userId}>
      <div style={{ padding: '1rem', paddingBottom: '5rem' }}>
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
          marginBottom: '1.5rem',
          gap: '1rem'
        }}>
          <h1 style={{
            fontSize: window.innerWidth < 768 ? '1.5rem' : '2rem',
            fontWeight: 'bold',
            color: '#1f2937'
          }}>📅 Календарь</h1>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={{
              padding: '0.5rem 0.75rem',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1.25rem'
            }}>←</button>
            <span style={{
              fontSize: window.innerWidth < 768 ? '1rem' : '1.25rem',
              fontWeight: '600',
              minWidth: window.innerWidth < 768 ? 'auto' : '200px',
              textAlign: 'center',
              textTransform: 'capitalize'
            }}>
              {format(currentDate, 'LLLL yyyy', { locale: ru })}
            </span>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={{
              padding: '0.5rem 0.75rem',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1.25rem'
            }}>→</button>
            <button onClick={() => setCurrentDate(new Date())} style={{
              padding: '0.5rem 1rem',
              background: '#a78bfa',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}>Сегодня</button>
          </div>
        </div>

        {/* Календарная сетка */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem',
          background: 'white',
          padding: '1rem',
          borderRadius: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <div key={day} style={{
              textAlign: 'center',
              fontWeight: '600',
              color: '#6b7280',
              padding: '0.5rem',
              fontSize: '0.875rem'
            }}>{day}</div>
          ))}

          {/* Пустые ячейки в начале */}
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} style={{ minHeight: '120px' }} />
          ))}

          {/* Дни месяца */}
          {days.map(day => {
            const dayEvents = getEventsForDate(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                style={{
                  minHeight: '120px',
                  padding: '0.5rem',
                  border: isToday ? '2px solid #a78bfa' : '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  background: isToday ? '#f5f3ff' : 'white',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = isToday ? '#f5f3ff' : 'white'}
              >
                <div style={{
                  fontWeight: isToday ? '700' : '500',
                  color: isToday ? '#7c3aed' : '#1f2937',
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem'
                }}>{format(day, 'd')}</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Удалить событие?')) handleDelete(event.id);
                      }}
                      style={{
                        background: event.color,
                        color: 'white',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                      }}
                      title={`${event.title}\n${event.description || ''}\n(Нажми для удаления)`}
                    >{event.title}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Модалка добавления события */}
        {showModal && selectedDate && (
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
              maxWidth: '500px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Событие</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Название события"
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Детали события"
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

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Цвет</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['#a78bfa', '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#f472b6'].map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        background: c,
                        border: color === c ? '3px solid #1f2937' : 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleSave}
                  disabled={!title.trim()}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: title.trim() ? '#a78bfa' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: title.trim() ? 'pointer' : 'not-allowed'
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
