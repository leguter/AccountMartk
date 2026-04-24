import { useNavigate } from 'react-router-dom';
import { useChats, useHaptic } from '../hooks';
import { useUserStore } from '../store';
import { Skeleton } from '../components/ui';
import styles from './ChatsPage.module.css';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60 * 1000) return 'now';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 24 * 60 * 60 * 1000) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function ChatItem({ chat, currentUserId, onClick }) {
  const isBuyer = String(chat.buyerId) === String(currentUserId);
  const other = isBuyer ? chat.seller : chat.buyer;
  const name = other?.firstName || other?.username || 'Unknown';
  const avatar = other?.avatar || null;
  const lastMsg = chat.lastMessage;
  const lastText = lastMsg?.text || '…';
  const lastTime = formatTime(lastMsg?.createdAt);
  const unread = chat.unreadCount > 0;
  const lotTitle = chat.lot?.title || null;

  return (
    <button className={styles.item} onClick={onClick}>
      <div className={styles.avatar}>
        {avatar
          ? <img src={avatar} alt={name} className={styles.avatarImg} />
          : <span className={styles.avatarFallback}>{name[0]?.toUpperCase()}</span>
        }
        {unread && <span className={styles.badgeDot} />}
      </div>

      <div className={styles.content}>
        <div className={styles.row}>
          <span className={[styles.name, unread ? styles.nameBold : ''].join(' ')}>{name}</span>
          <span className={styles.time}>{lastTime}</span>
        </div>

        {lotTitle && (
          <span className={styles.lotLabel}>{lotTitle}</span>
        )}

        <div className={styles.row}>
          <span className={[styles.preview, unread ? styles.previewUnread : ''].join(' ')}>
            {lastText}
          </span>
          {unread && (
            <span className={styles.unreadBadge}>{chat.unreadCount}</span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ChatsPage() {
  const navigate = useNavigate();
  const { selection } = useHaptic();
  const user = useUserStore((s) => s.user);
  const { chats, loading, error } = useChats();

  const handleChatClick = (orderId) => {
    selection();
    navigate(`/chat/${orderId}`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Chats</h1>
        {chats.length > 0 && (
          <span className={styles.count}>{chats.length}</span>
        )}
      </header>

      <div className={styles.list}>
        {loading && (
          <div className={styles.skeletonList}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={styles.skeletonItem}>
                <Skeleton width={48} height={48} style={{ borderRadius: '50%', flexShrink: 0 }} />
                <div className={styles.skeletonText}>
                  <Skeleton height={14} style={{ width: '60%', marginBottom: 8 }} />
                  <Skeleton height={12} style={{ width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>⚠️</div>
            <p className={styles.emptyText}>{error}</p>
          </div>
        )}

        {!loading && !error && chats.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>💬</div>
            <p className={styles.emptyTitle}>No chats yet</p>
            <p className={styles.emptyText}>
              Start by buying or selling a product.
            </p>
          </div>
        )}

        {!loading && chats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            currentUserId={user?.id}
            onClick={() => handleChatClick(chat.id)}
          />
        ))}
      </div>
    </div>
  );
}
