import { useLocation, useNavigate } from 'react-router-dom';
import { useHaptic } from '../../hooks';
import styles from './BottomNav.module.css';

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Market',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <path d="M3 3h18v4H3zM3 11h18v4H3zM3 19h18v4H3z" strokeLinecap="round" strokeLinejoin="round"/>
        {active && <path d="M3 3h18v4H3zM3 11h18v4H3zM3 19h18v2H3z"/>}
        <rect x="3" y="3" width="18" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="10" width="18" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="17" width="18" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    path: '/search',
    label: 'Search',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </>
        ) : (
          <>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </>
        )}
      </svg>
    ),
  },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selection } = useHaptic();

  const handleNav = (path) => {
    if (location.pathname !== path) {
      selection();
      navigate(path);
    }
  };

  // Hide on product detail pages
  if (location.pathname.startsWith('/product/')) return null;

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        {NAV_ITEMS.map((item) => {
          const active =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              className={[styles.navItem, active ? styles['navItem--active'] : ''].join(' ')}
              onClick={() => handleNav(item.path)}
            >
              <span className={styles.navIcon}>{item.icon(active)}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {active && <span className={styles.navDot} />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
