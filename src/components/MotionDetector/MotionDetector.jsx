import React, { useState, useEffect } from 'react';
import './MotionDetector.css';

function MotionDetector({ showNotification }) {
  const [isSupported, setIsSupported] = useState(false);
  const [shakeDetected, setShakeDetected] = useState(false);
  const [motionData, setMotionData] = useState({ x: 0, y: 0, z: 0 });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Проверяем поддержку датчиков движения
    if ('DeviceMotionEvent' in window) {
      setIsSupported(true);
    } else {
      console.log('Датчики движения не поддерживаются');
    }
  }, []); // Пустой массив зависимостей - выполняется только при монтировании

  // Отдельный эффект для управления слушателями событий
  useEffect(() => {
    if (!isActive) return;

    const handleMotion = (event) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const { x, y, z } = acceleration;
      
      setMotionData({
        x: x ? x.toFixed(2) : 0,
        y: y ? y.toFixed(2) : 0,
        z: z ? z.toFixed(2) : 0
      });

      // Детектор встряхивания
      if (Math.abs(x) > 15 || Math.abs(y) > 15 || Math.abs(z) > 15) {
        setShakeDetected(true);
        
        if (showNotification) {
          showNotification('👋 Встряхнуто!', {
            body: 'Детектор движения сработал'
          });
        }
        
        // Сбрасываем через 2 секунды
        setTimeout(() => setShakeDetected(false), 2000);
      }
    };

    // Запрашиваем разрешение на iOS 13+
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(console.error);
    } else {
      // Для Android и других браузеров
      window.addEventListener('devicemotion', handleMotion);
    }

    // Очистка
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [isActive, showNotification]); // Зависимости: isActive и showNotification

  const startDetection = () => {
    setIsActive(true);
  };

  const stopDetection = () => {
    setIsActive(false);
    setShakeDetected(false);
    setMotionData({ x: 0, y: 0, z: 0 });
  };

  if (!isSupported) {
    return (
      <div className="motion-component not-supported">
        <h2>🔄 Детектор движения</h2>
        <p className="not-supported-message">
          ⚠️ Датчики движения не поддерживаются на этом устройстве
        </p>
      </div>
    );
  }

  return (
    <div className="motion-component">
      <h2>🔄 Детектор движения</h2>
      
      {!isActive ? (
        <button onClick={startDetection} className="motion-btn start">
          ▶️ Запустить детектор движения
        </button>
      ) : (
        <>
          <div className={`shake-indicator ${shakeDetected ? 'active' : ''}`}>
            {shakeDetected ? '🚀 Встряхнуто!' : '👀 Слежу за движением...'}
          </div>
          
          <div className="motion-data">
            <div className="data-item">
              <span className="data-label">X:</span>
              <span className="data-value">{motionData.x}</span>
            </div>
            <div className="data-item">
              <span className="data-label">Y:</span>
              <span className="data-value">{motionData.y}</span>
            </div>
            <div className="data-item">
              <span className="data-label">Z:</span>
              <span className="data-value">{motionData.z}</span>
            </div>
          </div>
          
          <button onClick={stopDetection} className="motion-btn stop">
            ⏹️ Остановить
          </button>
        </>
      )}
      
      <p className="motion-hint">
        💡 Потрясите телефон чтобы проверить детектор
      </p>
    </div>
  );
}

export default MotionDetector;