import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

interface DiaryProps {
  userId: string;
}

interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  mood?: string;
  drawing_data?: string;
  created_at: string;
}

export default function Diary({ userId }: DiaryProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'draw'>('text');

  // Текст
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('😊');

  // Рисование
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  useEffect(() => {
    loadEntries();
  }, [userId]);

  useEffect(() => {
    if (showModal && activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
      }
    }
  }, [showModal, activeTab]);

  const loadEntries = async () => {
    const { data } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setEntries(data || []);
  };

  const saveToHistory = () => {
    if (!canvasRef.current) return;
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(canvasRef.current.toDataURL());
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = history[historyStep - 1];
      }
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = history[historyStep + 1];
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCanvasCoords(e);

    ctx.strokeStyle = tool === 'eraser' ? 'white' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCanvasCoords(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const downloadDrawing = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `diary-${new Date().getTime()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const openNewEntry = () => {
    setContent('');
    setMood('😊');
    setActiveTab('text');
    setHistory([]);
    setHistoryStep(-1);
    setShowModal(true);
  };

  const saveEntry = async () => {
    // Проверяем есть ли хоть что-то для сохранения
    const hasText = content.trim().length > 0;
    const hasDrawing = canvasRef.current && history.length > 0;

    if (!hasText && !hasDrawing) {
      alert('Добавь текст или рисунок перед сохранением');
      return;
    }

    const drawingData = hasDrawing ? canvasRef.current?.toDataURL() : null;

    // Всегда создаём НОВУЮ запись
    const { error } = await supabase.from('diary_entries').insert({
      user_id: userId,
      date: format(new Date(), 'yyyy-MM-dd'),
      content: content.trim(),
      mood,
      drawing_data: drawingData
    });

    if (error) {
      console.error('Ошибка создания записи:', error);
      alert('Не удалось создать запись');
      return;
    }

    setShowModal(false);
    loadEntries();
  };

  const deleteEntry = async (id: string) => {
    if (window.confirm('Удалить эту страницу из дневника?')) {
      await supabase.from('diary_entries').delete().eq('id', id);
      loadEntries();
      if (currentPage >= entries.length - 1 && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const moods = ['😊', '😄', '😢', '😠', '😴', '😍', '🤔', '😎'];

  const currentEntry = entries[currentPage];

  return (
    <Layout userId={userId}>
      <div style={{
        padding: '1rem',
        paddingBottom: '6rem',
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #fef3c7, #fde68a)'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Заголовок */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#78350f' }}>
              📖 Мой дневник
            </h2>
            <button
              onClick={openNewEntry}
              style={{
                background: '#a78bfa',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '500'
              }}
            >
              <Plus size={20} /> Новая запись
            </button>
          </div>

          {/* Странички дневника */}
          {entries.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '3rem',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '2px solid #fbbf24'
            }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</p>
              <p style={{ color: '#92400e', fontSize: '1.125rem' }}>
                Дневник пуст. Создай первую запись!
              </p>
            </div>
          ) : (
            <>
              {/* Страничка */}
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                border: '3px solid #fbbf24',
                minHeight: '500px',
                position: 'relative',
                backgroundImage: 'repeating-linear-gradient(white, white 30px, #fde68a 31px)',
                backgroundSize: '100% 31px'
              }}>
                {/* Заголовок страницы */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  paddingBottom: '1rem',
                  borderBottom: '2px solid #fbbf24'
                }}>
                  <div>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#92400e' }}>
                      {format(new Date(currentEntry.date), 'd MMMM yyyy, EEEE', { locale: ru })}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#a16207', marginTop: '0.25rem' }}>
                      Запись #{entries.length - currentPage} из {entries.length}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '2rem' }}>{currentEntry.mood}</span>
                    <button
                      onClick={() => deleteEntry(currentEntry.id)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Содержимое */}
                <div style={{
                  fontSize: '1rem',
                  color: '#1f2937',
                  lineHeight: '1.8',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'Georgia, serif',
                  minHeight: '200px'
                }}>
                  {currentEntry.content}
                </div>

                {/* Рисунок */}
                {currentEntry.drawing_data && (
                  <div style={{ marginTop: '1.5rem', borderTop: '2px dashed #fbbf24', paddingTop: '1.5rem' }}>
                    <img
                      src={currentEntry.drawing_data}
                      alt="Рисунок"
                      style={{
                        maxWidth: '100%',
                        borderRadius: '0.5rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Навигация между страницами */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '2rem'
              }}>
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  style={{
                    background: currentPage === 0 ? '#d1d5db' : '#a78bfa',
                    color: 'white',
                    padding: '0.75rem',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronLeft size={24} />
                </button>

                <span style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#78350f'
                }}>
                  Страница {currentPage + 1} / {entries.length}
                </span>

                <button
                  onClick={() => setCurrentPage(Math.min(entries.length - 1, currentPage + 1))}
                  disabled={currentPage === entries.length - 1}
                  style={{
                    background: currentPage === entries.length - 1 ? '#d1d5db' : '#a78bfa',
                    color: 'white',
                    padding: '0.75rem',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: currentPage === entries.length - 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Модальное окно создания новой записи */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 100
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '1.5rem'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>Новая запись</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >×</button>
            </div>

            {/* Вкладки */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb' }}>
              <button
                onClick={() => setActiveTab('text')}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: activeTab === 'text' ? '#a78bfa' : 'transparent',
                  color: activeTab === 'text' ? 'white' : '#6b7280',
                  borderRadius: '0.5rem 0.5rem 0 0',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >Текст</button>
              <button
                onClick={() => setActiveTab('draw')}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: activeTab === 'draw' ? '#a78bfa' : 'transparent',
                  color: activeTab === 'draw' ? 'white' : '#6b7280',
                  borderRadius: '0.5rem 0.5rem 0 0',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >Рисунок</button>
            </div>

            {activeTab === 'text' ? (
              <>
                {/* Настроение */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Настроение
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {moods.map(m => (
                      <button
                        key={m}
                        onClick={() => setMood(m)}
                        style={{
                          fontSize: '2rem',
                          padding: '0.5rem',
                          border: mood === m ? '3px solid #a78bfa' : '2px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          background: 'white',
                          cursor: 'pointer'
                        }}
                      >{m}</button>
                    ))}
                  </div>
                </div>

                {/* Текст */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Что произошло сегодня?
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Напиши о своём дне..."
                    style={{
                      width: '100%',
                      minHeight: '200px',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Инструменты рисования */}
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={() => setTool('pen')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: tool === 'pen' ? '#a78bfa' : '#e5e7eb',
                      color: tool === 'pen' ? 'white' : '#1f2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >✏️ Карандаш</button>
                  <button
                    onClick={() => setTool('eraser')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: tool === 'eraser' ? '#a78bfa' : '#e5e7eb',
                      color: tool === 'eraser' ? 'white' : '#1f2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >🧹 Ластик</button>

                  {tool === 'pen' && (
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      style={{ width: '50px', height: '40px', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                    />
                  )}

                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(Number(e.target.value))}
                    style={{ width: '120px' }}
                  />
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{lineWidth}px</span>

                  <button onClick={undo} disabled={historyStep <= 0} style={{
                    padding: '0.5rem 1rem',
                    background: historyStep <= 0 ? '#e5e7eb' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: historyStep <= 0 ? 'not-allowed' : 'pointer'
                  }}>↶ Отменить</button>
                  <button onClick={redo} disabled={historyStep >= history.length - 1} style={{
                    padding: '0.5rem 1rem',
                    background: historyStep >= history.length - 1 ? '#e5e7eb' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: historyStep >= history.length - 1 ? 'not-allowed' : 'pointer'
                  }}>↷ Вернуть</button>
                  <button onClick={clearCanvas} style={{
                    padding: '0.5rem 1rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}>🗑️ Очистить</button>
                  <button onClick={downloadDrawing} style={{
                    padding: '0.5rem 1rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}>💾 Скачать PNG</button>
                </div>

                {/* Canvas */}
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    width: '100%',
                    maxWidth: '800px',
                    cursor: tool === 'pen' ? 'crosshair' : 'pointer',
                    touchAction: 'none'
                  }}
                />
              </>
            )}

            {/* Кнопки */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                onClick={saveEntry}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >Сохранить</button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >Отмена</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}