/* Header.jsx — App header with branding */
export default function Header() {
  return (
    <header className="header">
      <div className="header-badge">
        <span className="badge-dot"></span>
        AI-Powered Verification
      </div>
      <h1>
        <span className="gradient-text">CertVerify</span> AI
      </h1>
      <p>
        Upload any certificate and our AI instantly detects tampering using
        Deep Convolutional Neural Networks (CNN) and EasyOCR text extraction.
      </p>
      <div className="header-chips">
        <span className="chip"><span className="chip-icon">🧠</span> Deep CNN Detection</span>
        <span className="chip"><span className="chip-icon">🔍</span> EasyOCR Extraction</span>
        <span className="chip"><span className="chip-icon">⚡</span> Real-time Analysis</span>
        <span className="chip"><span className="chip-icon">🛡️</span> Tamper Detection</span>
      </div>
    </header>
  );
}
