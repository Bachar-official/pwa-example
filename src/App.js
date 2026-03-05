import React from 'react';
import { usePWA } from './hooks/usePWA';
import Camera from './components/Camera/Camera';
import Notifications from './components/Notifications/Notifications';
import Geolocation from './components/Geolocation/Geolocation';
import MotionDetector from './components/MotionDetector/MotionDetector';
import Posts from './components/Posts/Posts';
import FileManager from './components/FileManager/FileManager';
import BatteryInfo from './components/BatteryInfo/BatteryInfo';
import ShareButton from './components/ShareButton/ShareButton';
import InstallPrompt from './components/InstallPrompt/InstallPrompt';
import './App.css';

function App() {
  const {
    isOnline,
    installPrompt,
    setInstallPrompt,
    notificationPermission,
    batteryLevel,
    cacheSize,
    saveToCache,
    loadFromCache,
    clearCache,
    requestNotificationPermission,
    showNotification
  } = usePWA();

  const handleInstall = async () => {
    if (!installPrompt) return false;
    
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    
    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
      showNotification('✅ Приложение установлено!', {
        body: 'Теперь оно доступно на главном экране'
      });
      return true;
    }
    return false;
  };

  const handlePhotoTaken = (photoData) => {
    showNotification('📸 Фото сделано!', {
      body: 'Фотография сохранена'
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <h1>📱 PWA Демо</h1>
          <ShareButton />
        </div>
        
        <p className="subtitle">
          Все возможности Progressive Web App
        </p>
        
        <div className="status-bar">
          <div className={`status ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '🟢 Онлайн' : '🔴 Офлайн'}
          </div>
          
          {batteryLevel && (
            <div className="battery-indicator">
              🔋 {batteryLevel.level}% {batteryLevel.charging ? '⚡' : ''}
            </div>
          )}

          {cacheSize > 0 && (
            <div className="cache-indicator">
              💾 {cacheSize} MB
            </div>
          )}
        </div>

        <InstallPrompt 
          installPrompt={installPrompt}
          onInstall={handleInstall}
        />
      </header>

      <main className="app-main">
        <Notifications 
          notificationPermission={notificationPermission}
          requestNotificationPermission={requestNotificationPermission}
          showNotification={showNotification}
        />

        <Camera 
          onPhotoTaken={handlePhotoTaken}
          saveToCache={saveToCache}
        />

        <Geolocation 
          showNotification={showNotification}
        />

        <MotionDetector 
          showNotification={showNotification}
        />

        <BatteryInfo />

        <Posts 
          saveToCache={saveToCache}
          loadFromCache={loadFromCache}
          showNotification={showNotification}
        />

        <FileManager 
          saveToCache={saveToCache}
          cacheSize={cacheSize}
          clearCache={clearCache}
          showNotification={showNotification}
        />

        <section className="info-section">
          <h2>ℹ️ Информация</h2>
          <ul className="info-list">
            <li>✅ Service Worker активен</li>
            <li>✅ Работает офлайн</li>
            <li>✅ Кэширование данных</li>
            <li>✅ Push-уведомления</li>
            <li>✅ Доступ к камере</li>
            <li>✅ Геолокация</li>
            <li>✅ Детектор движения</li>
            <li>✅ Информация о батарее</li>
            <li>✅ Загрузка файлов</li>
          </ul>
        </section>
      </main>

      <footer className="app-footer">
        <p>📱 PWA Демо для студентов</p>
        <p className="hint">
          💡 Нажмите "Поделиться" → "На экран домой" для установки
        </p>
      </footer>
    </div>
  );
}

export default App;