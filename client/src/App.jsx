import TopNav from './components/TopNav';

export default function App({ children }) {
  return (
    <div className="app">
      <div className="app-content">
        <TopNav />
        {children}
        <footer className="footer">
          <p>Powered by Deep CNN &amp; EasyOCR · Built for Ideathon 2026</p>
        </footer>
      </div>
    </div>
  );
}
