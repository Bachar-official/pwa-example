import React, { useState, useRef, useEffect } from 'react';
import './Camera.css';

function Camera({ onPhotoTaken, saveToCache }) {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Очистка потока при размонтировании
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
  if (stream && videoRef.current) {
    videoRef.current.srcObject = stream;
    videoRef.current.play().catch(e => {
      console.error('Ошибка воспроизведения:', e);
    });
  }
}, [stream]);

  const startCamera = async () => {
    setError(null);
    
    try {
      // Проверяем поддержку медиа устройств
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Ваш браузер не поддерживает доступ к камере');
      }

      // Запрашиваем доступ к камере
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Задняя камера
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      setIsCameraActive(true);

      // Устанавливаем поток в видео элемент
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Важно: для мобильных устройств нужно запустить видео
        videoRef.current.play().catch(e => {
          console.error('Ошибка воспроизведения видео:', e);
          setError('Не удалось запустить видео');
        });
      }

    } catch (err) {
      console.error('Ошибка камеры:', err);
      if (err.name === 'NotAllowedError') {
        setError('Доступ к камере запрещен. Разрешите доступ в настройках браузера.');
      } else if (err.name === 'NotFoundError') {
        setError('Камера не найдена на этом устройстве');
      } else {
        setError(`Ошибка: ${err.message}`);
      }
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      setStream(null);
      setIsCameraActive(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Убеждаемся что видео имеет размеры
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Видео еще не готово, подождите...');
      return;
    }

    // Устанавливаем размер canvas равным видео
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Рисуем кадр из видео на canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Получаем данные фото
    const photoData = canvas.toDataURL('image/jpeg', 0.9); // Используем JPEG для меньшего размера

    // Добавляем в локальный стейт
    setPhotos(prev => [photoData, ...prev]);

    // Сохраняем в кэш если есть функция
    if (saveToCache) {
      saveToCache(`photo-${Date.now()}`, photoData);
    }

    // Вызываем колбэк если есть
    if (onPhotoTaken) {
      onPhotoTaken(photoData);
    }
  };

  return (
    <div className="camera-component">
      <h2>📸 Камера</h2>
      
      {!isCameraActive ? (
        <button 
          onClick={startCamera} 
          className="camera-btn start"
        >
          📷 Включить камеру
        </button>
      ) : (
        <div className="camera-container">
          <div className="video-wrapper">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-preview"
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
          </div>
          
          <div className="camera-controls">
            <button onClick={takePhoto} className="camera-btn capture">
              📸 Сфотографировать
            </button>
            <button onClick={stopCamera} className="camera-btn stop">
              ⏹️ Выключить камеру
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="camera-error">
          ⚠️ {error}
        </div>
      )}

      {photos.length > 0 && (
        <div className="photo-gallery">
          <h4>Сделано фото: {photos.length}</h4>
          <div className="photo-list">
            {photos.slice(0, 4).map((photo, index) => (
              <div key={index} className="photo-item">
                <img src={photo} alt={`Фото ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Camera;