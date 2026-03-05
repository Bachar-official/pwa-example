import React, { useState } from 'react';
import './ShareButton.css';

function ShareButton() {
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: 'PWA Демо',
      text: 'Попробуй это PWA приложение со всеми возможностями!',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log('Успешно поделились');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Ошибка при шаринге:', error);
          // Показываем альтернативное меню
          setShowShareMenu(true);
        }
      }
    } else {
      // Если Web Share API не поддерживается
      setShowShareMenu(true);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('✅ Ссылка скопирована!');
      setShowShareMenu(false);
    } catch (err) {
      console.error('Ошибка копирования:', err);
      alert('❌ Не удалось скопировать ссылку');
    }
  };

  return (
    <div className="share-button-container">
      <button onClick={handleShare} className="share-button">
        📤
      </button>

      {showShareMenu && (
        <div className="share-menu">
          <div className="share-menu-header">
            <h4>Поделиться</h4>
            <button 
              className="close-menu" 
              onClick={() => setShowShareMenu(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="share-options">
            <button onClick={copyToClipboard} className="share-option">
              <span className="option-icon">📋</span>
              <span className="option-text">Копировать ссылку</span>
            </button>
            
            <a 
              href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('PWA Демо')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="share-option"
              onClick={() => setShowShareMenu(false)}
            >
              <span className="option-icon">📱</span>
              <span className="option-text">Telegram</span>
            </a>
            
            <a 
              href={`https://wa.me/?text=${encodeURIComponent('PWA Демо: ' + window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="share-option"
              onClick={() => setShowShareMenu(false)}
            >
              <span className="option-icon">💬</span>
              <span className="option-text">WhatsApp</span>
            </a>
            
            <a 
              href={`mailto:?subject=PWA Демо&body=Попробуй это PWA: ${window.location.href}`}
              className="share-option"
              onClick={() => setShowShareMenu(false)}
            >
              <span className="option-icon">✉️</span>
              <span className="option-text">Email</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShareButton;