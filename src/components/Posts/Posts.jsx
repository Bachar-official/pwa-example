import React, { useState, useEffect, useCallback } from 'react';
import './Posts.css';

function Posts({ saveToCache, loadFromCache, showNotification }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Пытаемся загрузить из кэша сначала
      let cachedData = null;
      if (loadFromCache) {
        cachedData = await loadFromCache('posts');
      }
      
      // Пытаемся загрузить свежие данные
      const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
      
      if (response.ok) {
        const freshPosts = await response.json();
        setPosts(freshPosts);
        
        // Сохраняем в кэш
        if (saveToCache) {
          await saveToCache('posts', freshPosts);
        }
        
        if (showNotification && !navigator.onLine) {
          showNotification('📰 Посты обновлены', {
            body: 'Данные загружены и сохранены для офлайн-доступа'
          });
        }
      } else {
        throw new Error('Ошибка загрузки');
      }
    } catch (err) {
      console.error('Ошибка загрузки постов:', err);
      
      // Проверяем наличие кэшированных данных
      if (loadFromCache) {
        const cachedData = await loadFromCache('posts');
        
        // Если офлайн, используем кэшированные данные
        if (cachedData && cachedData.length > 0) {
          setPosts(cachedData);
          setError('Вы в офлайн-режиме. Показаны сохраненные данные.');
        } else {
          setError('Не удалось загрузить посты');
        }
      } else {
        setError('Не удалось загрузить посты');
      }
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, saveToCache, showNotification]); // Зависимости

  useEffect(() => {
    loadPosts();
  }, [loadPosts]); // loadPosts в зависимостях

  return (
    <div className="posts-component">
      <div className="posts-header">
        <h2>📰 Демо-посты</h2>
        <button 
          onClick={loadPosts} 
          className="refresh-btn"
          disabled={loading}
        >
          🔄 {loading ? 'Загрузка...' : 'Обновить'}
        </button>
      </div>

      {error && (
        <div className="posts-error">
          ⚠️ {error}
        </div>
      )}

      {loading && !posts.length && (
        <div className="posts-loading">
          <div className="spinner-small"></div>
          <p>Загрузка постов...</p>
        </div>
      )}

      <div className="posts-list">
        {posts.map(post => (
          <article key={post.id} className="post-card">
            <h3 className="post-title">{post.title}</h3>
            <p className="post-body">{post.body}</p>
            <div className="post-meta">
              <span className="post-id">ID: {post.id}</span>
              {!navigator.onLine && (
                <span className="offline-badge">📴 Офлайн</span>
              )}
            </div>
          </article>
        ))}
      </div>

      {posts.length === 0 && !loading && (
        <div className="posts-empty">
          <p>Нет постов для отображения</p>
        </div>
      )}
    </div>
  );
}

export default Posts;