import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useUserStore } from './store';
import BottomNav from './components/layout/BottomNav';
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import Search from './pages/Search';
import styles from './App.module.css';

function AppInner() {
  const location = useLocation();
  const { initTelegram, isLoading } = useUserStore();

  useEffect(() => {
    void initTelegram();
  }, [initTelegram]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className={styles.app}>
      <main className={styles.main} key={location.pathname}>
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

function LoadingScreen() {
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
