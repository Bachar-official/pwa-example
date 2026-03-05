import { useState, useEffect } from 'react';

export function usePWA() {

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [cacheSize, setCacheSize] = useState(0);

  const CACHE_NAME = "pwa-demo-v1";

  useEffect(() => {

    const handleInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    getBatteryInfo();
    checkCacheSize();

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };

  }, []);

  // -----------------------------
  // Battery API
  // -----------------------------

  const getBatteryInfo = async () => {
    if (!("getBattery" in navigator)) return;
    try {
      const battery = await navigator.getBattery();
      const updateBatteryInfo = () => {
        setBatteryLevel({
          level: Math.round(battery.level * 100),
          charging: battery.charging
        });
      };

      updateBatteryInfo();

      battery.addEventListener("levelchange", updateBatteryInfo);
      battery.addEventListener("chargingchange", updateBatteryInfo);

    } catch (error) {
      console.error("Ошибка получения информации о батарее:", error);
    }

  };

  // -----------------------------
  // Cache size
  // -----------------------------

  const checkCacheSize = async () => {
    try {
      if (
        "storage" in navigator &&
        "estimate" in navigator.storage
      ) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate?.usage || 0;
        setCacheSize(Math.round(usage / 1024 / 1024));
      }
    } catch (error) {
      console.error("Ошибка проверки размера кэша:", error);
    }
  };

  // -----------------------------
  // Save to cache
  // -----------------------------

  const saveToCache = async (key, data) => {

    if (!("caches" in window)) return false;

    try {

      const cache = await caches.open(CACHE_NAME);

      const response = new Response(
        JSON.stringify({
          data,
          timestamp: Date.now()
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      await cache.put(`pwa-cache-${key}`, response);
      await checkCacheSize();
      return true;
    } catch (error) {
      console.error("Ошибка сохранения в кэш:", error);
      return false;
    }
  };

  // -----------------------------
  // Load from cache
  // -----------------------------

  const loadFromCache = async (key) => {
    if (!("caches" in window)) return null;
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(`pwa-cache-${key}`);
      if (!response) return null;
      const json = await response.json();
      return json?.data || null;
    } catch (error) {
      console.error("Ошибка загрузки из кэша:", error);
      return null;
    }
  };

  // -----------------------------
  // Clear cache
  // -----------------------------

  const clearCache = async () => {
    if (!("caches" in window)) return false;
    try {
      await caches.delete(CACHE_NAME);
      setCacheSize(0);
      return true;
    } catch (error) {
      console.error("Ошибка очистки кэша:", error);
      return false;
    }
  };

  // -----------------------------
  // Notifications
  // -----------------------------

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === "granted";
    } catch (error) {
      console.error("Ошибка при запросе уведомлений:", error);
      return false;
    }
  };

  const showNotification = async (title, options = {}) => {
    if (notificationPermission !== "granted") return;
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, {
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          ...options
        });
      } else {
        new Notification(title, options);
      }
    } catch (error) {
      console.error("Ошибка показа уведомления:", error);
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