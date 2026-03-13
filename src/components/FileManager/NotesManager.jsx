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
      // Пытаемся загрузить все заметки из кэша
      // Предполагаем, что заметки хранятся с префиксом 'note-'
      const cachedNotes = [];
      
      // Если у вас есть метод для получения всех ключей кэша, используйте его
      // Или перебираем возможные ID
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('note-')) {
          const noteData = localStorage.getItem(key);
          if (noteData) {
            try {
              const parsed = JSON.parse(noteData);
              cachedNotes.push({
                ...parsed,
                id: key.replace('note-', '')
              });
            } catch (e) {
              console.error('Ошибка парсинга заметки:', e);
            }
          }
        }
      }
      
      // Сортируем по дате создания (новые сверху)
      cachedNotes.sort((a, b) => b.createdAt - a.createdAt);
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

    // Добавляем в состояние
    setNotes(prev => [newNote, ...prev]);
    setNewNoteText('');

    // Сохраняем в кэш
    try {
      await saveToCache?.(`note-${newNote.id}`, JSON.stringify(newNote));
      showNotification?.('✅ Заметка добавлена', { body: 'Заметка сохранена в кэш' });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const deleteNote = async (noteId) => {
    // Удаляем из состояния
    setNotes(prev => prev.filter(n => n.id !== noteId));

    // Удаляем из кэша
    try {
      // Если saveToCache использует localStorage:
      localStorage.removeItem(`note-${noteId}`);
      
      // Или если есть специальный метод удаления:
      // await removeFromCache?.(`note-${noteId}`);
      
      showNotification?.('🗑️ Заметка удалена', { body: 'Заметка удалена из кэша' });
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const updateNote = async (noteId, newText) => {
    if (!newText.trim()) return;

    const updatedNote = {
      ...notes.find(n => n.id === noteId),
      text: newText.trim(),
      updatedAt: Date.now()
    };

    // Обновляем в состоянии
    setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));

    // Обновляем в кэше
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

    // Удаляем все заметки из кэша
    const noteKeys = notes.map(n => `note-${n.id}`);
    for (const key of noteKeys) {
      localStorage.removeItem(key);
    }

    setNotes([]);
    
    if (showNotification) {
      showNotification('🧹 Заметки очищены', { body: 'Все заметки удалены' });
    }
  };

  const formatDate = (timestamp) => {
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

  if (isLoading) {
    return <div className="notes-manager loading">Загрузка заметок...</div>;
  }

  return (
    <div className="notes-manager">
      <div className="notes-header">
        <h2>📝 Заметки</h2>
        <div className="notes-stats">
          <span className="notes-count">Заметок: {notes.length}</span>
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

// Отдельный компонент для одной заметки (с возможностью редактирования)
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
            <span className="note-date">{formatDate(note.createdAt)}</span>
            {note.updatedAt !== note.createdAt && (
              <span className="note-edited">(изменено)</span>
            )}
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