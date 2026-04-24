import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../store';
import { useBalance, useMyLots, useMyOrders } from '../hooks';
import { Avatar, StarsPrice, Skeleton, EmptyState } from '../components/ui';
import styles from './Profile.module.css';

const STATUS_LABELS = {
  pending: 'Chatting',
  paid: 'In Escrow',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_CSS = {
  pending: styles['status--pending'],
  paid: styles['status--paid'],
  completed: styles['status--completed'],
  cancelled: styles['status--error'],
};

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Profile() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [ordersTab, setOrdersTab] = useState('purchases');

  const { balance, loading: balanceLoading } = useBalance();

  const { data: lotsData } = useMyLots();
  const myLots = Array.isArray(lotsData) ? lotsData : [];

  const { data: fetchedOrders, loading: ordersLoading } = useMyOrders();
  const allOrders = Array.isArray(fetchedOrders) ? fetchedOrders : [];

  const purchases = allOrders.filter(
    (o) => String(o.buyerId) === String(user?.id) && o.status !== 'pending'
  );
  const sales = allOrders.filter(
    (o) => String(o.sellerId) === String(user?.id) && o.status !== 'pending'
  );

  const activeOrdersCount = allOrders.filter(
    (o) => o && o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'pending'
  ).length;

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <Skeleton width="100%" height={100} />
        </div>
      </div>
    );
  }

  const renderOrderItem = (item) => {
    const lot = item.lot;
    const icon = lot?.category ? ({ telegram: '✈️', instagram: '📸', youtube: '▶️', tiktok: '🎵', phone: '📱' }[lot.category] || '📦') : '📦';
    return (
      <div key={item.id} className={styles.historyItem} onClick={() => navigate(`/chat/${item.id}`)} style={{ cursor: 'pointer' }}>
        <div className={styles.historyIcon}>{icon}</div>
        <div className={styles.historyInfo}>
          <div className={styles.historyTitle}>{lot?.title || 'Order #' + item.id}</div>
          <div className={styles.historyDate}>{formatDate(item.createdAt)}</div>
        </div>
        <div className={styles.historyRight}>
          {lot?.price != null && <StarsPrice amount={lot.price} size="sm" />}
          <span className={[styles.statusBadge, STATUS_CSS[item.status] || ''].join(' ')}>
            {STATUS_LABELS[item.status] || item.status}
          </span>
        </div>
      </div>
    );
  };

  const activeList = ordersTab === 'purchases' ? purchases : sales;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Profile</h1>
      </div>

      <div className={styles.userCard}>
        <div className={styles.userCardInner}>
          <Avatar
            src={user?.avatar || user?.photo_url}
            name={[user?.first_name, user?.last_name].filter(Boolean).join(' ')}
            size={64}
          />
          <div className={styles.userInfo}>
            <div className={styles.userName}>
              {user?.first_name} {user?.last_name}
            </div>
            {user?.username && (
              <div className={styles.userHandle}>@{user.username}</div>
            )}
            {user?.bio && (
              <div className={styles.userBio}>{user.bio}</div>
            )}
            <div className={styles.userTgId}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.5 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              ID: {user?.id}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div className={styles.premiumBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              <span>Buyer</span>
            </div>
            <Link to="/profile/edit" className={styles.editProfileBtn}>
              ✏️ Edit
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statBoxValue}>{purchases.length}</span>
          <span className={styles.statBoxLabel}>Purchases</span>
        </div>
        <div className={styles.statBoxDivider} />
        <div className={styles.statBox}>
          <span className={styles.statBoxValue}>{sales.length}</span>
          <span className={styles.statBoxLabel}>Sales</span>
        </div>
        <div className={styles.statBoxDivider} />
        <div className={styles.statBox}>
          <span className={styles.statBoxValue}>{myLots.length}</span>
          <span className={styles.statBoxLabel}>Listings</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Orders</h2>
          {activeOrdersCount > 0 && (
            <span className={styles.sectionCount}>{activeOrdersCount} active</span>
          )}
        </div>

        <div className={styles.tabRow}>
          <button
            className={[styles.tab, ordersTab === 'purchases' ? styles.tabActive : ''].join(' ')}
            onClick={() => setOrdersTab('purchases')}
          >
            My Purchases
            {purchases.length > 0 && <span className={styles.tabBadge}>{purchases.length}</span>}
          </button>
          <button
            className={[styles.tab, ordersTab === 'sales' ? styles.tabActive : ''].join(' ')}
            onClick={() => setOrdersTab('sales')}
          >
            My Sales
            {sales.length > 0 && <span className={styles.tabBadge}>{sales.length}</span>}
          </button>
        </div>

        {ordersLoading ? (
          <div className={styles.historyList}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.historyItem}>
                <Skeleton width={40} height={40} radius="10px" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="55%" height={15} />
                  <Skeleton width="35%" height={12} style={{ marginTop: 6 }} />
                </div>
                <Skeleton width={60} height={20} />
              </div>
            ))}
          </div>
        ) : activeList.length === 0 ? (
          <EmptyState
            icon={ordersTab === 'purchases' ? '🛒' : '🏪'}
            title={ordersTab === 'purchases' ? 'No purchases yet' : 'No sales yet'}
            description={ordersTab === 'purchases' ? 'Browse the marketplace and find your first account' : 'Create a listing to start selling'}
          />
        ) : (
          <div className={styles.historyList}>
            {activeList.map(renderOrderItem)}
          </div>
        )}
      </div>

      <Link to="/profile/balance" className={styles.sellerCard}>
        <div className={styles.sellerCardLeft}>
          <div className={styles.sellerCardIcon}>🏪</div>
          <div>
            <div className={styles.sellerCardTitle}>Seller Dashboard</div>
            <div className={styles.sellerCardSub}>
              {myLots.length} listing{myLots.length !== 1 ? 's' : ''}
              {activeOrdersCount > 0 && ` · ${activeOrdersCount} active order${activeOrdersCount !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
        <div className={styles.sellerCardRight}>
          {balanceLoading ? <Skeleton width={50} height={20} /> : <StarsPrice amount={balance} size="sm" />}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </Link>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Settings</h2>
        <div className={styles.settingsList}>
          {[
            { icon: '🔔', label: 'Notifications', action: 'toggle' },
            { icon: '🌐', label: 'Language', value: user?.language_code?.toUpperCase() || 'EN' },
            { icon: '📋', label: 'Marketplace Rules', action: 'rules' },
            { icon: '📄', label: 'Terms of Service', action: 'link' },
            { icon: '🔒', label: 'Privacy Policy', action: 'link' },
            { icon: '📞', label: 'Support', action: 'support' },
          ].map((item) => (
            <div
              key={item.label}
              className={styles.settingItem}
              onClick={() => {
                if (item.action === 'support') {
                  alert('Support will be implemented later. For now, contact @support on Telegram.');
                }
                if (item.action === 'rules') {
                  navigate('/rules');
                }
              }}
            >
              <span className={styles.settingIcon}>{item.icon}</span>
              <span className={styles.settingLabel}>{item.label}</span>
              <span className={styles.settingRight}>
                {item.value && <span className={styles.settingValue}>{item.value}</span>}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.appInfo}>
        <div className={styles.appLogo}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--yellow)' }}>
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          <span>AccountMark</span>
        </div>
        <span className={styles.appVersion}>v1.0.0</span>
      </div>
    </div>
  );
}
