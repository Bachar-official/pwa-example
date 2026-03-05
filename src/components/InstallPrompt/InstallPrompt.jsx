import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

function InstallPrompt({ installPrompt, onInstall }) {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Проверяем iOS
    const ua = window.navigator.userAgent;
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    const webkit = !!ua.match(/WebKit/i);
    const iOSChrome = !!ua.match(/CriOS/i);
    const isIOSDevice = iOS && webkit && !iOSChrome;
    
    setIsIOS(isIOSDevice);
    
    // Проверяем запущено ли как PWA
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      const result = await onInstall();
      if (result) {
        // Показываем сообщение об успешной установке
        alert('✅ Приложение установлено! Найдите его на главном экране.');
      }
    }
  };

  // Если уже запущено как PWA или не поддерживается установка
  if (isStandalone || (!installPrompt && !isIOS)) {
    return null;
  }

  return (
    <div className="install-prompt">
      {isIOS ? (
        // Инструкция для iOS
        <div className="ios-install">
          <div className="install-icon">📱</div>
          <div className="install-content">
            <h3>Установите на iPhone</h3>
            <p>
              1. Нажмите <span className="share-icon">⎙</span> Поделиться<br />
              2. Выберите "На экран домой"<br />
              3. Нажмите "Добавить"
            </p>
          </div>
        </div>
      ) : (
        // Для Android
        <button onClick={handleInstall} className="install-button">
          <span className="install-icon">📲</span>
          <span className="install-text">Установить приложение</span>
        </button>
      )}
    </div>
  );
}

export default InstallPrompt;