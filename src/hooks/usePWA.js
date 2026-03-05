import { useState, useEffect } from 'react';

export function usePWA() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    // Слушаем событие установки PWA
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });

    // Отслеживание онлайн статуса
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    // Получение информации о батарее
    getBatteryInfo();

    // Проверка кэша
    checkCacheSize();

    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  const getBatteryInfo = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        
        const updateBatteryInfo = () => {
          setBatteryLevel({
            level: Math.round(battery.level * 100),
            charging: battery.charging
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

  const checkCacheSize = async () => {
    if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      setCacheSize(Math.round(estimate.usage / 1024 / 1024));
    }
  };

  const saveToCache = async (key, data) => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('pwa-demo-v1');
        const response = new Response(JSON.stringify({
          data: data,
          timestamp: new Date().getTime()
        }));
        cache.put(`/cache/${key}`, response);
        checkCacheSize();
        return true;
      } catch (error) {
        console.error('Ошибка сохранения в кэш:', error);
        return false;
      }
    }
    return false;
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

  const clearCache = async () => {
    if ('caches' in window) {
      await caches.delete('pwa-demo-v1');
      setCacheSize(0);
      return true;
    }
    return false;
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Ошибка при запросе уведомлений:', error);
      return false;
    }
  };

  const showNotification = (title, options = {}) => {
    if (notificationPermission === 'granted') {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            ...options
          });
        });
      } else {
        new Notification(title, options);
      }
    }
  };

  return {
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
  };
}