import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';

interface NotesProps {
  userId: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  position_x: number;
  position_y: number;
}

export default function Notes({ userId }: NotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#fff9c4');

  useEffect(() => {
    loadNotes();
  }, [userId]);

  const loadNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false);

    // Преобразуем tags в position_x и position_y (используем tags для хранения позиций)
    const positioned: Note[] = (data || []).map(n => {
      const [x, y] = n.tags?.split(',').map(Number) || [Math.random() * 60, Math.random() * 60];
      return {
        id: n.id,
        title: n.title,
        content: n.content,
        color: n.color || '#fff9c4',
        position_x: x,
        position_y: y
      };
    });

    setNotes(positioned);
  };

  const openNewNote = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setColor('#fff9c4');
    setShowModal(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color);
    setShowModal(true);
  };

  const saveNote = async () => {
    if (!title.trim() && !content.trim()) return;

    const position = editingNote
      ? `${editingNote.position_x},${editingNote.position_y}`
      : `${Math.random() * 60 + 10},${Math.random() * 60 + 10}`;

    if (editingNote) {
      const { error } = await supabase.from('notes').update({
        title: title.trim(),
        content: content.trim(),
        color
      }).eq('id', editingNote.id);

      if (error) {
        console.error('Ошибка обновления заметки:', error);
        alert('Не удалось сохранить заметку');
        return;
      }
    } else {
      const { error } = await supabase.from('notes').insert({
        user_id: userId,
        title: title.trim() || 'Без названия',
        content: content.trim(),
        color,
        tags: position,
        is_pinned: false,
        is_archived: false
      });

      if (error) {
        console.error('Ошибка создания заметки:', error);
        alert('Не удалось создать заметку');
        return;
      }
    }

    setShowModal(false);
    loadNotes();
  };

  const deleteNote = async (id: string) => {
    if (window.confirm('Удалить заметку?')) {
      await supabase.from('notes').delete().eq('id', id);
      loadNotes();
    }
  };

  const colors = [
    { name: 'Жёлтый', value: '#fff9c4' },
    { name: 'Розовый', value: '#fce7f3' },
    { name: 'Голубой', value: '#dbeafe' },
    { name: 'Зелёный', value: '#d1fae5' },
    { name: 'Фиолетовый', value: '#f3e8ff' },
    { name: 'Оранжевый', value: '#fed7aa' }
  ];

  return (
    <Layout userId={userId}>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>📝 Заметки</h1>
          <button
            onClick={openNewNote}
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
          >+ Новая заметка</button>
        </div>

        {/* Холст с линиями как в тетради */}
        <div style={{
          position: 'relative',
          minHeight: 'calc(100vh - 250px)',
          background: 'repeating-linear-gradient(white, white 29px, #e0e0e0 29px, #e0e0e0 30px)',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {notes.length === 0 ? (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '1.125rem'
            }}>
              Нажми «+ Новая заметка» для создания стикера
            </div>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                onClick={() => openEditNote(note)}
                style={{
                  position: 'absolute',
                  left: `${note.position_x}%`,
                  top: `${note.position_y}%`,
                  width: '200px',
                  minHeight: '200px',
                  background: note.color,
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  transform: `rotate(${(Math.random() - 0.5) * 6}deg)`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'rotate(0deg) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
                  e.currentTarget.style.zIndex = '10';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `rotate(${(Math.random() - 0.5) * 6}deg) scale(1)`;
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  e.currentTarget.style.zIndex = '1';
                }}
              >
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#1f2937',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>{note.title}</h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#374151',
                  lineHeight: '1.5',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 6,
                  WebkitBoxOrient: 'vertical'
                }}>{note.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Модалка создания/редактирования заметки */}
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
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                {editingNote ? 'Редактировать заметку' : 'Новая заметка'}
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Заголовок</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Название заметки"
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Текст</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Содержимое заметки"
                  rows={8}
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Цвет стикера</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {colors.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      title={c.name}
                      style={{
                        width: '3rem',
                        height: '3rem',
                        background: c.value,
                        border: color === c.value ? '3px solid #1f2937' : '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: editingNote ? '1rem' : '0' }}>
                <button
                  onClick={saveNote}
                  disabled={!title.trim() && !content.trim()}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: (title.trim() || content.trim()) ? '#a78bfa' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: (title.trim() || content.trim()) ? 'pointer' : 'not-allowed'
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

              {editingNote && (
                <button
                  onClick={() => {
                    deleteNote(editingNote.id);
                    setShowModal(false);
                  }}
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
                >Удалить заметку</button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
