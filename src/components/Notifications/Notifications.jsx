import React from 'react';
import './Notifications.css';

function Notifications({ 
  notificationPermission, 
  requestNotificationPermission, 
  showNotification 
}) {
  
  const sendTestNotification = () => {
    showNotification('🔥 Тестовое уведомление!', {
      body: 'Это push-уведомление из PWA',
      tag: 'test-notification',
      renotify: true,
      vibrate: [200, 100, 200]
    });
  };

  return (
    <div className="notifications-component">
      <h2>🔔 Уведомления</h2>
      <div className="notification-controls">
        <button 
          onClick={requestNotificationPermission}
          className={`notify-btn ${notificationPermission === 'granted' ? 'active' : ''}`}
          disabled={notificationPermission === 'granted'}
        >
          {notificationPermission === 'granted' 
            ? '✅ Уведомления разрешены' 
            : '🔔 Разрешить уведомления'}
        </button>
        
        <button 
          onClick={sendTestNotification}
          className="notify-btn test"
          disabled={notificationPermission !== 'granted'}
        >
          📬 Тестовое уведомление
        </button>
      </div>
      
      {notificationPermission === 'denied' && (
        <div className="notification-warning">
          ⚠️ Уведомления заблокированы. Разрешите их в настройках браузера.
        </div>
      )}
    </div>
  );
}

export default Notifications;