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
import EditProfilePage from './pages/EditProfilePage';
import ChatPage from './pages/ChatPage';
import ChatsPage from './pages/ChatsPage';
import ProfileBalancePage from './pages/ProfileBalancePage';
import RulesPage from './pages/RulesPage';
import styles from './App.module.css';

const RULES_KEY = 'rules_accepted_v1';

function AppInner() {
  const location = useLocation();
  const { initTelegram, isLoading, error } = useUserStore();

  const [slowLoad, setSlowLoad]         = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(
    () => localStorage.getItem(RULES_KEY) === 'true'
  );

  const acceptRules = () => {
    localStorage.setItem(RULES_KEY, 'true');
    setRulesAccepted(true);
  };

  useEffect(() => {
    void initTelegram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // must run ONCE on mount only — initTelegram is stable but Zustand spread can change its reference

  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setSlowLoad(true), 8000);
    return () => clearTimeout(t);
  }, [isLoading]);

  if (isLoading || error) {
    return <LoadingScreen slow={slowLoad} error={error} />;
  }

  // ── First-launch gate ──────────────────────────────────────────
  if (!rulesAccepted) {
    return <RulesPage acceptMode onAccept={acceptRules} />;
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
            <Route path="/profile/edit" element={<EditProfilePage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/chat/:orderId" element={<ChatPage />} />
            <Route path="/chats" element={<ChatsPage />} />
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
function LoadingScreen({ slow, error }) {
  const { initTelegram } = useUserStore();

  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingLogo}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--yellow)' }}>
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
        <span className={styles.loadingBrand}>AccountMark</span>
      </div>
      
      {!error && (
        <div className={styles.loadingDots}>
          <span /><span /><span />
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 24,
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(255, 69, 58, 0.1)',
          border: '1px solid rgba(255, 69, 58, 0.2)',
          color: '#ff453a',
          fontSize: '13px',
          textAlign: 'center',
          maxWidth: '280px'
        }}>
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>Connection Error</p>
          <p style={{ opacity: 0.8, marginBottom: '16px' }}>{error}</p>
          <button 
            onClick={() => initTelegram()}
            style={{
              background: '#ff453a',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {slow && !error && (
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
