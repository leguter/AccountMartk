import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState, Component } from 'react';
import { useUserStore } from './store';
import BottomNav from './components/layout/BottomNav';
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import Search from './pages/Search';
import UserProfilePage from './pages/UserProfilePage';
import CreateLotPage from './pages/CreateLotPage';
import ChatPage from './pages/ChatPage';
import ProfileBalancePage from './pages/ProfileBalancePage';
import styles from './App.module.css';

function AppInner() {
  const location = useLocation();
  const { initTelegram, isLoading } = useUserStore();

  const [slowLoad, setSlowLoad] = useState(false);

  useEffect(() => {
    void initTelegram();
  }, [initTelegram]);

  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setSlowLoad(true), 8000);
    return () => clearTimeout(t);
  }, [isLoading]);

  if (isLoading) {
    return <LoadingScreen slow={slowLoad} />;
  }

  return (
    <div className={styles.app}>
      <main className={styles.main} key={location.pathname}>
        <ErrorBoundary key={location.pathname}>
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/user/:id" element={<UserProfilePage />} />
            <Route path="/search" element={<Search />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/balance" element={<ProfileBalancePage />} />
            <Route path="/create-lot" element={<CreateLotPage />} />
            <Route path="/chat/:orderId" element={<ChatPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <BottomNav />
    </div>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100dvh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px', textAlign: 'center', gap: '16px',
          background: 'var(--black)', color: 'var(--white)'
        }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Something went wrong</h2>
          <p style={{ color: 'var(--gray-3)', fontSize: 13, maxWidth: 300 }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => { this.setState({ error: null }); window.history.back(); }}
            style={{
              marginTop: 8, padding: '10px 24px', borderRadius: 12,
              background: 'var(--yellow)', color: 'var(--black)',
              fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none'
            }}
          >
            Go Back
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
function LoadingScreen({ slow }) {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingLogo}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--yellow)' }}>
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
        <span className={styles.loadingBrand}>AccountMark</span>
      </div>
      <div className={styles.loadingDots}>
        <span /><span /><span />
      </div>
      {slow && (
        <p style={{
          marginTop: 16,
          fontSize: 12,
          color: 'var(--gray-3)',
          textAlign: 'center',
          padding: '0 32px',
          lineHeight: 1.5,
        }}>
          Server is waking up…<br/>This takes up to 2 minutes on first launch.
        </p>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
