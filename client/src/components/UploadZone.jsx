/* UploadZone.jsx — Drag-and-drop certificate uploader */
import { useState, useRef, useCallback } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/bmp', 'image/webp', 'image/tiff', 'application/pdf'];
const FORMATS = ['JPG', 'PNG', 'BMP', 'WEBP', 'TIFF', 'PDF'];

function formatBytes(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function UploadZone({ onFileSelect, file, onAnalyse, loading }) {
  const [dragOver, setDragOver] = useState(false);
  const [error,    setError]    = useState('');
  const inputRef = useRef(null);

  const validateAndSet = useCallback((f) => {
    setError('');
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10 MB.');
      return;
    }
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(jpg|jpeg|png|bmp|webp|tiff|tif|pdf)$/i)) {
      setError('Unsupported file type. Please upload a JPG/PNG/BMP/WEBP/TIFF image or a PDF.');
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

  const handleDragOver  = (e) => { e.preventDefault(); setDragOver(true);  };
  const handleDragLeave = ()  => setDragOver(false);

  const handleFileInput = (e) => {
    validateAndSet(e.target.files[0]);
    e.target.value = ''; // allow re-picking same file
  };

  const previewUrl = file ? URL.createObjectURL(file) : null;

  // Clicking the zone (when no file) → open file picker
  const handleZoneClick = () => {
    if (!file) inputRef.current?.click();
  };

  return (
    <div>
      <div
        id="upload-zone"
        className={`upload-zone${dragOver ? ' drag-over' : ''}${file ? ' has-file' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleZoneClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleZoneClick()}
        aria-label="Upload certificate image"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
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
              {dragOver ? '📥 Drop it here!' : 'Drop your certificate here'}
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
              {file.type && file.type.startsWith('image/') ? (
                <img src={previewUrl} alt="Certificate preview" />
              ) : (
                <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 8, color: '#111', fontWeight: 700 }}>
                  📄 PDF
                </div>
              )}
              <div className="preview-info">
                <p className="file-name" title={file.name}>{file.name}</p>
                <p className="file-size">{formatBytes(file.size)}</p>
              </div>
            </div>
            {/* Replace button — explicit click, doesn't propagate to zone */}
            <button
              type="button"
              className="replace-btn"
              id="replace-btn"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              🔄 Replace Image
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="upload-error" id="upload-error-msg">⚠ {error}</p>
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
              <span className="btn-spinner" />
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
