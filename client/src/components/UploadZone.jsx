/* UploadZone.jsx — Drag-and-drop certificate uploader */
import { useState, useRef, useCallback } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/bmp', 'image/webp', 'image/tiff'];
const FORMATS = ['JPG', 'PNG', 'BMP', 'WEBP', 'TIFF'];

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function UploadZone({ onFileSelect, file, onAnalyse, loading }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validateAndSet = useCallback((f) => {
    setError('');
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10 MB.');
      return;
    }
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(jpg|jpeg|png|bmp|webp|tiff|tif)$/i)) {
      setError('Unsupported file type. Please upload a JPG, PNG, BMP, WEBP, or TIFF image.');
      return;
    }
    onFileSelect(f);
  }, [onFileSelect]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    validateAndSet(dropped);
  }, [validateAndSet]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleFileInput = (e) => {
    validateAndSet(e.target.files[0]);
    e.target.value = '';
  };

  const previewUrl = file ? URL.createObjectURL(file) : null;

  return (
    <div>
      <div
        id="upload-zone"
        className={`upload-zone${dragOver ? ' drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !file && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !file && inputRef.current?.click()}
        aria-label="Upload certificate image"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileInput}
          id="file-input"
        />

        {!file ? (
          <>
            <div className="upload-icon-wrapper">
              <span className="upload-icon">📄</span>
            </div>
            <p className="upload-title">
              {dragOver ? 'Drop it here!' : 'Drop your certificate here'}
            </p>
            <p className="upload-sub">or click to browse from your device</p>
            <button
              type="button"
              className="upload-btn"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              id="browse-btn"
            >
              📁 Browse Files
            </button>
            <div className="upload-formats">
              {FORMATS.map(f => <span key={f} className="format-tag">{f}</span>)}
            </div>
          </>
        ) : (
          <>
            <div className="upload-preview" onClick={(e) => e.stopPropagation()}>
              <img src={previewUrl} alt="Certificate preview" />
              <div className="preview-info">
                <p className="file-name">{file.name}</p>
                <p className="file-size">{formatBytes(file.size)}</p>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>
              Click to replace image
            </p>
          </>
        )}
      </div>

      {error && (
        <p style={{ color: 'var(--red)', fontSize: '0.82rem', marginTop: '8px', textAlign: 'center' }}>
          ⚠ {error}
        </p>
      )}

      {file && (
        <button
          id="analyse-btn"
          className="analyse-btn"
          onClick={onAnalyse}
          disabled={loading}
        >
          {loading ? (
            <>
              <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
              Analysing…
            </>
          ) : (
            <>🔬 Analyse Certificate</>
          )}
        </button>
      )}
    </div>
  );
}
