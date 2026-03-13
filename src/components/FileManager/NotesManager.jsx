import React, { useState, useEffect } from 'react';
import './NotesManager.css';

function NotesManager({ saveToCache, loadFromCache, clearCache, cacheSize, showNotification }) {
  const [notes, setNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем заметки из кэша при монтировании
  useEffect(() => {
    loadNotesFromCache();
  }, []);

  const loadNotesFromCache = async () => {
    setIsLoading(true);
    try {
      const cachedNotes = [];
      
      // Проверяем доступность Cache API
      if (!('caches' in window)) {
        console.warn('Cache API не поддерживается');
        setIsLoading(false);
        return;
      }

      const cache = await caches.open('pwa-demo-v1');
      const keys = await cache.keys();
      
      // Фильтруем только ключи заметок (начинаются с 'pwa-cache-note-')
      const noteKeys = keys.filter(request => {
        const url = request.url;
        return url.includes('pwa-cache-note-');
      });

      console.log('Найдено заметок в кэше:', noteKeys.length);

      for (const request of noteKeys) {
        try {
          const response = await cache.match(request);
          if (response) {
            const json = await response.json();
            const noteData = json?.data;
            
            if (noteData) {
              try {
                const parsed = JSON.parse(noteData);
                // Извлекаем ID из URL ключа
                const url = request.url;
                const idMatch = url.match(/pwa-cache-note-(.+)$/);
                const id = idMatch ? idMatch[1] : parsed.id;
                
                cachedNotes.push({
                  ...parsed,
                  id: id
                });
              } catch (e) {
                console.error('Ошибка парсинга заметки:', e);
              }
            }
          }
        } catch (e) {
          console.error('Ошибка чтения заметки из кэша:', e);
        }
      }
      
      // Сортируем по дате создания (новые сверху)
      cachedNotes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      console.log('Загружено заметок:', cachedNotes.length);
      setNotes(cachedNotes);
      
    } catch (error) {
      console.error('Ошибка загрузки заметок:', error);
      showNotification?.('❌ Ошибка загрузки', { body: 'Не удалось загрузить заметки' });
    } finally {
      setIsLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNoteText.trim()) {
      showNotification?.('⚠️ Пустая заметка', { body: 'Введите текст заметки' });
      return;
    }

    const newNote = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Добавляем в состояние сразу для UI responsiveness
    setNotes(prev => [newNote, ...prev]);
    setNewNoteText('');

    // Сохраняем в кэш через пропс saveToCache
    try {
      const success = await saveToCache?.(`note-${newNote.id}`, JSON.stringify(newNote));
      if (success) {
        showNotification?.('✅ Заметка добавлена', { body: 'Заметка сохранена в кэш' });
      } else {
        console.warn('saveToCache вернул false');
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      showNotification?.('❌ Ошибка сохранения', { body: 'Не удалось сохранить заметку' });
    }
  };

  const deleteNote = async (noteId) => {
    // Удаляем из состояния
    setNotes(prev => prev.filter(n => n.id !== noteId));

    // Удаляем из Cache API напрямую
    try {
      if (!('caches' in window)) return;
      
      const cache = await caches.open('pwa-demo-v1');
      const key = `pwa-cache-note-${noteId}`;
      
      // Находим и удаляем по полному URL
      const keys = await cache.keys();
      const targetKey = keys.find(req => req.url.includes(key));
      
      if (targetKey) {
        await cache.delete(targetKey);
        showNotification?.('🗑️ Заметка удалена', { body: 'Заметка удалена из кэша' });
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const updateNote = async (noteId, newText) => {
    if (!newText.trim()) return;

    const noteToUpdate = notes.find(n => n.id === noteId);
    if (!noteToUpdate) return;

    const updatedNote = {
      ...noteToUpdate,
      text: newText.trim(),
      updatedAt: Date.now()
    };

    // Обновляем в состоянии
    setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));

    // Обновляем в кэше через saveToCache (перезапишет существующую)
    try {
      await saveToCache?.(`note-${noteId}`, JSON.stringify(updatedNote));
      showNotification?.('✏️ Заметка обновлена', { body: 'Изменения сохранены' });
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  const handleClearAllNotes = async () => {
    if (!window.confirm('Удалить все заметки? Это действие нельзя отменить.')) {
      return;
    }

    try {
      if (!('caches' in window)) return;
      
      const cache = await caches.open('pwa-demo-v1');
      const keys = await cache.keys();
      
      // Удаляем только ключи заметок
      const noteKeys = keys.filter(req => req.url.includes('pwa-cache-note-'));
      
      for (const key of noteKeys) {
        await cache.delete(key);
      }

      setNotes([]);
      showNotification?.('🧹 Заметки очищены', { body: 'Все заметки удалены' });
    } catch (error) {
      console.error('Ошибка очистки:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNote();
    }
  };

  // Ручное обновление из кэша
  const handleRefresh = () => {
    loadNotesFromCache();
    showNotification?.('🔄 Обновлено', { body: 'Заметки перезагружены из кэша' });
  };

  if (isLoading) {
    return <div className="notes-manager loading">Загрузка заметок...</div>;
  }

  return (
    <div className="notes-manager">
      <div className="notes-header">
        <h2>📝 Заметки</h2>
        <div className="notes-stats">
          <span className="notes-count">Заметок: {notes.length}</span>
          <button onClick={handleRefresh} className="refresh-btn" title="Обновить из кэша">
            🔄
          </button>
          {notes.length > 0 && (
            <button onClick={handleClearAllNotes} className="clear-all-btn">
              🗑️ Очистить все
            </button>
          )}
        </div>
      </div>

      {/* Форма добавления */}
      <div className="add-note-form">
        <textarea
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Введите текст заметки... (Enter — сохранить, Shift+Enter — новая строка)"
          className="note-input"
          rows={3}
        />
        <button 
          onClick={addNote}
          disabled={!newNoteText.trim()}
          className="add-note-btn"
        >
          ➕ Добавить заметку
        </button>
      </div>

      {/* Список заметок */}
      {notes.length === 0 ? (
        <div className="empty-notes">
          <span className="empty-icon">📝</span>
          <p>Нет заметок</p>
          <p className="empty-hint">Добавьте первую заметку выше</p>
        </div>
      ) : (
        <div className="notes-list">
          {notes.map(note => (
            <NoteItem 
              key={note.id}
              note={note}
              onDelete={deleteNote}
              onUpdate={updateNote}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Отдельный компонент для одной заметки
function NoteItem({ note, onDelete, onUpdate, formatDate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);

  const handleSave = () => {
    onUpdate(note.id, editText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(note.text);
    setIsEditing(false);
  };

  return (
    <div className="note-item">
      {isEditing ? (
        <div className="note-edit-mode">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="note-edit-input"
            rows={3}
            autoFocus
          />
          <div className="note-edit-actions">
            <button onClick={handleSave} className="save-btn">✅ Сохранить</button>
            <button onClick={handleCancel} className="cancel-btn">❌ Отмена</button>
          </div>
        </div>
      ) : (
        <>
          <div className="note-content">
            <p className="note-text">{note.text}</p>
            <div className="note-meta">
              <span className="note-date">{formatDate(note.createdAt)}</span>
              {note.updatedAt !== note.createdAt && (
                <span className="note-edited">(изменено {formatDate(note.updatedAt)})</span>
              )}
            </div>
          </div>
          <div className="note-actions">
            <button 
              onClick={() => setIsEditing(true)}
              className="edit-btn"
              title="Редактировать"
            >
              ✏️
            </button>
            <button 
              onClick={() => onDelete(note.id)}
              className="delete-btn"
              title="Удалить"
            >
              🗑️
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default NotesManager;