import { useLocation, useNavigate } from 'react-router-dom';
import { useHaptic } from '../../hooks';
import styles from './BottomNav.module.css';

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Market',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <rect x="3" y="3" width="18" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="10" width="18" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="17" width="18" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    path: '/chats',
    label: 'Chats',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    path: '/create-lot',
    label: 'Sell',
    isSell: true,
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selection, impact } = useHaptic();

  const handleNav = (item) => {
    if (item.isSell) {
      impact('medium');
    } else {
      selection();
    }
    if (location.pathname !== item.path) {
      navigate(item.path);
    }
  };

  // Hide on detail / chat / create pages that use full-screen layout
  const hideOn = ['/product/', '/chat/', '/create-lot', '/user/', '/profile/balance'];
  if (hideOn.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        {NAV_ITEMS.map((item) => {
          const active =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          if (item.isSell) {
            return (
              <button
                key={item.path}
                className={styles.sellBtn}
                onClick={() => handleNav(item)}
                aria-label="Sell"
              >
                <span className={styles.sellBtnInner}>{item.icon(false)}</span>
                <span className={styles.navLabel}>Sell</span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              className={[styles.navItem, active ? styles['navItem--active'] : ''].join(' ')}
              onClick={() => handleNav(item)}
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
