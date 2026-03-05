import React, { useState, useEffect } from 'react';
import './BatteryInfo.css';

function BatteryInfo() {
  const [battery, setBattery] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    getBatteryInfo();
  }, []);

  const getBatteryInfo = async () => {
    if ('getBattery' in navigator) {
      try {
        const batteryManager = await navigator.getBattery();
        
        const updateBatteryInfo = () => {
          setBattery({
            level: Math.round(batteryManager.level * 100),
            charging: batteryManager.charging,
            chargingTime: batteryManager.chargingTime,
            dischargingTime: batteryManager.dischargingTime
          });
        };

        updateBatteryInfo();

        batteryManager.addEventListener('levelchange', updateBatteryInfo);
        batteryManager.addEventListener('chargingchange', updateBatteryInfo);
        batteryManager.addEventListener('chargingtimechange', updateBatteryInfo);
        batteryManager.addEventListener('dischargingtimechange', updateBatteryInfo);

        return () => {
          batteryManager.removeEventListener('levelchange', updateBatteryInfo);
          batteryManager.removeEventListener('chargingchange', updateBatteryInfo);
          batteryManager.removeEventListener('chargingtimechange', updateBatteryInfo);
          batteryManager.removeEventListener('dischargingtimechange', updateBatteryInfo);
        };
      } catch (error) {
        console.error('Ошибка получения информации о батарее:', error);
        setIsSupported(false);
      }
    } else {
      setIsSupported(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="battery-info not-supported">
        <h2>🔋 Батарея</h2>
        <p className="not-supported-message">
          ⚠️ Информация о батарее не поддерживается на этом устройстве
        </p>
      </div>
    );
  }

  if (!battery) {
    return (
      <div className="battery-info loading">
        <h2>🔋 Батарея</h2>
        <div className="battery-loading">
          <div className="spinner-small"></div>
          <p>Получение информации...</p>
        </div>
      </div>
    );
  }

  const getBatteryColor = (level) => {
    if (level <= 15) return '#f44336';
    if (level <= 30) return '#ff9800';
    return '#4CAF50';
  };

  const formatTime = (seconds) => {
    if (seconds === Infinity || seconds === 0) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}ч ${minutes}м`;
  };

  return (
    <div className="battery-info">
      <h2>🔋 Батарея</h2>
      
      <div className="battery-display">
        <div className="battery-icon">
          <div 
            className="battery-level" 
            style={{ 
              width: `${battery.level}%`,
              backgroundColor: getBatteryColor(battery.level)
            }}
          />
          {battery.charging && <span className="charging-icon">⚡</span>}
        </div>
        <span className="battery-percent">{battery.level}%</span>
      </div>

      <div className="battery-details">
        <div className="battery-detail-item">
          <span className="detail-label">Статус:</span>
          <span className="detail-value">
            {battery.charging ? '🔌 Заряжается' : '📱 Разряжается'}
          </span>
        </div>
        
        {battery.charging ? (
          <div className="battery-detail-item">
            <span className="detail-label">До полной зарядки:</span>
            <span className="detail-value">{formatTime(battery.chargingTime)}</span>
          </div>
        ) : (
          <div className="battery-detail-item">
            <span className="detail-label">Осталось:</span>
            <span className="detail-value">{formatTime(battery.dischargingTime)}</span>
          </div>
        )}

        {battery.level <= 15 && (
          <div className="battery-warning">
            ⚠️ Низкий заряд батареи!
          </div>
        )}
      </div>
    </div>
  );
}

export default BatteryInfo;