import React, { useState } from 'react';
import './FileManager.css';

function FileManager({ saveToCache, cacheSize, clearCache, showNotification }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    processFiles(uploadedFiles);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(event.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const processFiles = async (fileList) => {
    const newFiles = fileList.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      file: file
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Сохраняем в кэш
    for (const fileData of newFiles) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        await saveToCache(`file-${fileData.id}`, {
          name: fileData.name,
          type: fileData.type,
          size: fileData.size,
          data: e.target.result
        });
      };
      reader.readAsDataURL(fileData.file);
    }

    if (showNotification) {
      showNotification('📎 Файлы загружены', {
        body: `Загружено файлов: ${newFiles.length}`
      });
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.startsWith('text/')) return '📄';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word')) return '📘';
    if (fileType.includes('excel')) return '📗';
    return '📎';
  };

  const handleClearCache = async () => {
    if (await clearCache()) {
      setFiles([]);
      if (showNotification) {
        showNotification('🧹 Кэш очищен', {
          body: 'Все кэшированные файлы удалены'
        });
      }
    }
  };

  return (
    <div className="file-manager">
      <div className="file-manager-header">
        <h2>💾 Файлы и кэш</h2>
        <div className="cache-info">
          <span className="cache-size">Кэш: {cacheSize} MB</span>
          {cacheSize > 0 && (
            <button onClick={handleClearCache} className="clear-cache-btn">
              🗑️ Очистить
            </button>
          )}
        </div>
      </div>

      <div 
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          type="file"
          id="file-input"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        
        <div className="drop-zone-content">
          <span className="upload-icon">📎</span>
          <p>Перетащите файлы сюда или нажмите для выбора</p>
          <p className="upload-hint">Поддерживаются любые файлы</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="files-list">
          <h4>Загруженные файлы ({files.length})</h4>
          <div className="files-grid">
            {files.map(file => (
              <div key={file.id} className="file-item">
                <div className="file-icon">{getFileIcon(file.type)}</div>
                <div className="file-info">
                  <div className="file-name" title={file.name}>
                    {file.name.length > 20 
                      ? file.name.substring(0, 20) + '...' 
                      : file.name}
                  </div>
                  <div className="file-meta">
                    <span>{formatFileSize(file.size)}</span>
                    <button 
                      className="remove-file"
                      onClick={() => removeFile(file.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileManager;