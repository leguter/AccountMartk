import { useRef } from 'react';
import { useMarketplaceStore } from '../../store';
import { useHaptic } from '../../hooks';
import styles from './CategoryTabs.module.css';
const CATEGORIES = [
  // { id: 'all', label: 'All', icon: '🔥' },
  { id: 'telegram', label: 'Telegram', icon: '#telegram-communication-chat-interaction-network-connection-svgrepo-com' },
  // { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'youtube', label: 'YouTube', icon: '#youtube-color-svgrepo-com' },
  { id: 'tiktok', label: 'TikTok', icon: '#tiktok-svgrepo-com' },
  // { id: 'phone', label: 'Numbers', icon: '📱' },
];

export default function CategoryTabs() {
  const { activeCategory, setCategory } = useMarketplaceStore();
  const { selection } = useHaptic();
  const scrollRef = useRef(null);

  const handleSelect = (id) => {
    selection();
    setCategory(id);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.track} ref={scrollRef}>
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              className={[styles.tab, active ? styles['tab--active'] : ''].join(' ')}
              onClick={() => handleSelect(cat.id)}
            >
              <svg className={styles.icon}>
                <use xlink:href={cat.icon}></use>
              </svg>
              {/* <span className={styles.icon}>{cat.icon}</span> */}
              <span className={styles.label}>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
