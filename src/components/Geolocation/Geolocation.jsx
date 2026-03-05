import React, { useState } from 'react';
import './Geolocation.css';

function Geolocation({ showNotification }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается вашим браузером');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLoading(false);
        
        if (showNotification) {
          showNotification('📍 Локация получена', {
            body: `Точность: ${Math.round(position.coords.accuracy)} метров`
          });
        }
      },
      (err) => {
        let errorMessage = 'Ошибка получения геолокации';
        switch(err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Доступ к геолокации запрещен';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Информация о местоположении недоступна';
            break;
          case err.TIMEOUT:
            errorMessage = 'Время ожидания истекло';
            break;
          default:
            errorMessage = err.message;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const shareLocation = () => {
    if (!location) return;

    const locationUrl = `https://maps.google.com/?q=${location.lat},${location.lng}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Моя локация',
        text: `Я здесь! Точность: ${Math.round(location.accuracy)}м`,
        url: locationUrl
      }).catch(() => {
        // Пользователь отменил шаринг
      });
    } else {
      navigator.clipboard.writeText(locationUrl);
      alert('Ссылка на карту скопирована!');
    }
  };

  const openInMaps = () => {
    if (!location) return;
    
    const url = `https://maps.google.com/?q=${location.lat},${location.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="geolocation-component">
      <h2>📍 Геолокация</h2>
      
      {!location && !loading && !error && (
        <button onClick={getLocation} className="geo-btn primary">
          🗺️ Получить мою локацию
        </button>
      )}

      {loading && (
        <div className="geo-loading">
          <div className="spinner"></div>
          <p>Определяем местоположение...</p>
        </div>
      )}

      {error && (
        <div className="geo-error">
          <p>⚠️ {error}</p>
          <button onClick={getLocation} className="geo-btn retry">
            🔄 Попробовать снова
          </button>
        </div>
      )}

      {location && (
        <div className="location-info">
          <div className="coordinates">
            <p><strong>Широта:</strong> {location.lat.toFixed(6)}</p>
            <p><strong>Долгота:</strong> {location.lng.toFixed(6)}</p>
            <p><strong>Точность:</strong> {Math.round(location.accuracy)} м</p>
          </div>
          
          <div className="location-actions">
            <button onClick={shareLocation} className="geo-btn share">
              📤 Поделиться
            </button>
            <button onClick={openInMaps} className="geo-btn maps">
              🗺️ Открыть на карте
            </button>
            <button onClick={getLocation} className="geo-btn refresh">
              🔄 Обновить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Geolocation;