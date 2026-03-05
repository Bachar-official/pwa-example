import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [cameraStream, setCameraStream] = useState(null);
  const [geoLocation, setGeoLocation] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [files, setFiles] = useState([]);
  const [vibrationSupported, setVibrationSupported] = useState(false);
  const [shakeDetected, setShakeDetected] = useState(false);
  const [posts, setPosts] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    initPWA();
    fetchPosts();
    
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [
    cameraStream,
  ]);

  const initPWA = async () => {
    // Проверка поддержки вибрации
    setVibrationSupported('vibrate' in navigator);

    // Слушаем событие установки PWA
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('📲 Приложение готово к установке');
    });

    // Отслеживание онлайн статуса
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    // Получение геолокации
    getLocation();

    // Получение информации о батарее
    getBatteryInfo();

    // Детектор встряхивания
    initShakeDetector();

    // Проверка кэша
    checkCacheSize();
  };

  // ========== УСТАНОВКА PWA ==========
  const installPWA = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    
    if (result.outcome === 'accepted') {
      console.log('✅ PWA установлено');
      setInstallPrompt(null);
      showNotification('Приложение установлено!', {
        body: 'Теперь оно доступно на главном экране'
      });
    }
  };

  // ========== УВЕДОМЛЕНИЯ ==========
  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        showNotification('Уведомления включены!', {
          body: 'Теперь вы будете получать уведомления от приложения',
          icon: '/icon-192.png'
        });
      }
    } catch (error) {
      console.error('Ошибка при запросе уведомлений:', error);
    }
  };

  const showNotification = (title, options = {}) => {
    if (notificationPermission === 'granted') {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            ...options
          });
        });
      } else {
        new Notification(title, options);
      }
    }
  };

  const sendTestNotification = () => {
    showNotification('🔥 Тестовое уведомление!', {
      body: 'Это push-уведомление из PWA',
      tag: 'test-notification',
      renotify: true
    });
  };

  // ========== КАМЕРА ==========
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });
      setCameraStream(stream);
      
      const videoElement = document.getElementById('camera-preview');
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      alert('Не удалось получить доступ к камере. Убедитесь, что камера подключена и доступ разрешен.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const takePhoto = () => {
    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('photo-canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoData = canvas.toDataURL('image/png');
    
    // Сохраняем фото
    setPhotos(prev => [photoData, ...prev]);
    
    // Кэшируем фото
    saveToCache(`photo-${Date.now()}`, photoData);
  };

  // ========== ГЕОЛОКАЦИЯ ==========
  const getLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Ошибка геолокации:', error);
        },
        { 
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  };

  const shareLocation = () => {
    if (geoLocation && navigator.share) {
      navigator.share({
        title: 'Моя локация',
        text: `Я здесь! Точность: ${Math.round(geoLocation.accuracy)}м`,
        url: `https://maps.google.com/?q=${geoLocation.lat},${geoLocation.lng}`
      }).catch(console.error);
    } else if (geoLocation) {
      navigator.clipboard.writeText(
        `https://maps.google.com/?q=${geoLocation.lat},${geoLocation.lng}`
      );
      alert('Ссылка на локацию скопирована!');
    }
  };

  // ========== БАТАРЕЯ ==========
  const getBatteryInfo = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        
        const updateBatteryInfo = () => {
          setBatteryLevel({
            level: Math.round(battery.level * 100),
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime
          });
        };

        updateBatteryInfo();
        
        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);
      } catch (error) {
        console.error('Ошибка получения информации о батарее:', error);
      }
    }
  };

  // ========== ВИБРАЦИЯ ==========
  const vibrateDevice = (pattern) => {
    if (vibrationSupported) {
      navigator.vibrate(pattern);
      showNotification('Вибрация', {
        body: `Выполнен паттерн вибрации: ${pattern}`
      });
    } else {
      alert('Вибрация не поддерживается на этом устройстве');
    }
  };

  // ========== ДЕТЕКТОР ВСТРЯХИВАНИЯ ==========
  const initShakeDetector = () => {
    if ('DeviceMotionEvent' in window) {
      let lastX, lastY, lastZ;
      let lastTime = 0;
      const threshold = 15;

      window.addEventListener('devicemotion', (event) => {
        const acceleration = event.accelerationIncludingGravity;
        if (!acceleration) return;

        const currentTime = new Date().getTime();
        if (currentTime - lastTime > 100) {
          const deltaX = Math.abs(acceleration.x - lastX);
          const deltaY = Math.abs(acceleration.y - lastY);
          const deltaZ = Math.abs(acceleration.z - lastZ);

          if (deltaX > threshold && deltaY > threshold && deltaZ > threshold) {
            setShakeDetected(true);
            vibrateDevice(200);
            showNotification('👋 Встряхнули телефон!', {
              body: 'Детектор движения сработал'
            });
            
            setTimeout(() => setShakeDetected(false), 2000);
          }

          lastX = acceleration.x;
          lastY = acceleration.y;
          lastZ = acceleration.z;
          lastTime = currentTime;
        }
      });
    }
  };

  // ========== ЗАГРУЗКА ПОСТОВ ==========
  const fetchPosts = async () => {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
      const data = await response.json();
      setPosts(data);
      
      // Кэшируем посты
      saveToCache('posts', data);
    } catch (error) {
      console.log('Офлайн режим, загружаем из кэша');
      loadFromCache('posts').then(cachedPosts => {
        if (cachedPosts) setPosts(cachedPosts);
      });
    }
  };

  // ========== КЭШИРОВАНИЕ ==========
  const saveToCache = async (key, data) => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('pwa-demo-v1');
        const response = new Response(JSON.stringify({
          data: data,
          timestamp: new Date().getTime()
        }));
        cache.put(`/cache/${key}`, response);
        console.log(`💾 Данные сохранены в кэш: ${key}`);
        checkCacheSize();
      } catch (error) {
        console.error('Ошибка сохранения в кэш:', error);
      }
    }
  };

  const loadFromCache = async (key) => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('pwa-demo-v1');
        const response = await cache.match(`/cache/${key}`);
        if (response) {
          const data = await response.json();
          return data.data;
        }
      } catch (error) {
        console.error('Ошибка загрузки из кэша:', error);
      }
    }
    return null;
  };

  const checkCacheSize = async () => {
    if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      setCacheSize(Math.round(estimate.usage / 1024 / 1024)); // в MB
    }
  };

  const clearCache = async () => {
    if ('caches' in window) {
      await caches.delete('pwa-demo-v1');
      setCacheSize(0);
      showNotification('Кэш очищен', {
        body: 'Все кэшированные данные удалены'
      });
    }
  };

  // ========== РАБОТА С ФАЙЛАМИ ==========
  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    setFiles(prev => [...prev, ...uploadedFiles]);
    
    uploadedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        saveToCache(`file-${file.name}`, {
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // ========== ПОДЕЛИТЬСЯ ==========
  const shareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PWA Демо',
          text: 'Попробуй это PWA приложение!',
          url: window.location.href
        });
      } catch (error) {
        console.log('Отмена шаринга');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Ссылка скопирована!');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <h1>📱 PWA Демо</h1>
          <button onClick={shareApp} className="share-btn">📤</button>
        </div>
        <p className="subtitle">Все возможности Progressive Web App в одном месте</p>
        
        <div className="status-bar">
          <div className={`status ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '🟢 Онлайн' : '🔴 Офлайн'}
          </div>
          
          {installPrompt && (
            <button onClick={installPWA} className="install-btn">
              📲 Установить приложение
            </button>
          )}

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
      </header>

      <main className="app-main">
        {/* УВЕДОМЛЕНИЯ */}
        <section className="feature-section">
          <h2>🔔 Уведомления</h2>
          <div className="feature-controls">
            <button 
              onClick={requestNotificationPermission}
              className={`feature-btn ${notificationPermission === 'granted' ? 'active' : ''}`}
              disabled={notificationPermission === 'granted'}
            >
              {notificationPermission === 'granted' ? '✅ Уведомления разрешены' : '🔔 Разрешить уведомления'}
            </button>
            <button 
              onClick={sendTestNotification}
              className="feature-btn"
              disabled={notificationPermission !== 'granted'}
            >
              📬 Тестовое уведомление
            </button>
          </div>
        </section>

        {/* КАМЕРА */}
        <section className="feature-section">
          <h2>📸 Камера</h2>
          {!cameraStream ? (
            <button onClick={startCamera} className="feature-btn camera-btn">
              📷 Включить камеру
            </button>
          ) : (
            <>
              <div className="camera-container">
                <video 
                  id="camera-preview" 
                  autoPlay 
                  playsInline 
                  muted
                  className="camera-preview"
                />
                <canvas id="photo-canvas" style={{ display: 'none' }} />
                <div className="camera-controls">
                  <button onClick={takePhoto} className="feature-btn">📸 Сфоткать</button>
                  <button onClick={stopCamera} className="feature-btn stop">⏹️ Выключить</button>
                </div>
              </div>
              
              {photos.length > 0 && (
                <div className="photo-gallery">
                  <h4>Последние фото:</h4>
                  <div className="photo-list">
                    {photos.slice(0, 3).map((photo, index) => (
                      <img key={index} src={photo} alt={`Фото ${index + 1}`} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ГЕОЛОКАЦИЯ */}
        <section className="feature-section">
          <h2>📍 Геолокация</h2>
          {geoLocation ? (
            <div className="location-info">
              <p><strong>Широта:</strong> {geoLocation.lat.toFixed(6)}</p>
              <p><strong>Долгота:</strong> {geoLocation.lng.toFixed(6)}</p>
              <p><strong>Точность:</strong> {Math.round(geoLocation.accuracy)} метров</p>
              <button onClick={shareLocation} className="feature-btn">
                📤 Поделиться локацией
              </button>
            </div>
          ) : (
            <button onClick={getLocation} className="feature-btn">
              🗺️ Получить геолокацию
            </button>
          )}
        </section>

        {/* ВИБРАЦИЯ */}
        <section className="feature-section">
          <h2>📳 Вибрация</h2>
          <div className="feature-controls">
            <button 
              onClick={() => vibrateDevice(200)} 
              className="feature-btn"
              disabled={!vibrationSupported}
            >
              Короткая (200ms)
            </button>
            <button 
              onClick={() => vibrateDevice([200, 100, 200])} 
              className="feature-btn"
              disabled={!vibrationSupported}
            >
              Двойная
            </button>
            <button 
              onClick={() => vibrateDevice(1000)} 
              className="feature-btn"
              disabled={!vibrationSupported}
            >
              Длинная (1s)
            </button>
          </div>
          {!vibrationSupported && (
            <p className="warning">⚠️ Вибрация не поддерживается на этом устройстве</p>
          )}
        </section>

        {/* ДЕТЕКТОР ДВИЖЕНИЯ */}
        <section className="feature-section">
          <h2>🔄 Детектор движения</h2>
          <div className={`shake-detector ${shakeDetected ? 'active' : ''}`}>
            {shakeDetected ? '🚀 Встряхнуто!' : 'Потрясите телефон чтобы проверить'}
          </div>
        </section>

        {/* ДЕМО-ПОСТЫ */}
        <section className="feature-section">
          <h2>📰 Демо-посты (кэшируются)</h2>
          <div className="posts-list">
            {posts.map(post => (
              <article key={post.id} className="post-card">
                <h4>{post.title}</h4>
                <p>{post.body.substring(0, 100)}...</p>
              </article>
            ))}
          </div>
          <button onClick={fetchPosts} className="feature-btn small">
            🔄 Обновить
          </button>
        </section>

        {/* ФАЙЛЫ И КЭШ */}
        <section className="feature-section">
          <h2>💾 Файлы и кэш</h2>
          <div className="file-upload">
            <input 
              type="file" 
              multiple 
              onChange={handleFileUpload}
              id="file-input"
              className="file-input"
            />
            <label htmlFor="file-input" className="feature-btn">
              📎 Выбрать файлы
            </label>
          </div>
          
          {files.length > 0 && (
            <div className="files-list">
              <h4>Загружено файлов: {files.length}</h4>
              <ul>
                {files.slice(0, 3).map((file, index) => (
                  <li key={index}>
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="cache-controls">
            <span className="cache-size">Кэш: {cacheSize} MB</span>
            <button onClick={clearCache} className="feature-btn small warning">
              🗑️ Очистить кэш
            </button>
          </div>
        </section>

        {/* ИНФОРМАЦИЯ О PWA */}
        <section className="feature-section info-section">
          <h2>ℹ️ О PWA</h2>
          <ul className="info-list">
            <li>✅ Manifest.json настроен</li>
            <li>✅ Service Worker активен</li>
            <li>✅ Работает офлайн</li>
            <li>✅ Можно установить на телефон</li>
            <li>✅ Push-уведомления</li>
            <li>✅ Доступ к камере</li>
            <li>✅ Геолокация</li>
            <li>✅ Вибрация</li>
            <li>✅ Детектор движения</li>
            <li>✅ Кэширование файлов</li>
          </ul>
        </section>
      </main>

      <footer className="app-footer">
        <p>📱 PWA Демо для студентов</p>
        <p className="hint">
          💡 Нажмите "Поделиться" → "На экран домой" чтобы установить
        </p>
      </footer>
    </div>
  );
}

export default App;