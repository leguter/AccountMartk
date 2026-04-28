import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { IconButton, ErrorState, Skeleton, Avatar, StarsPrice } from '../components/ui';
import { useSellerProfile, useSellerReviews } from '../hooks';
import styles from './UserProfilePage.module.css';

const CATEGORY_ICONS = {
  telegram: '✈️', instagram: '📸', youtube: '▶️', tiktok: '🎵', phone: '📱',
};

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lots');
  const { user, loading, error } = useSellerProfile(id);
  const reviewsData = useSellerReviews(user?.id);

  const handleBack = () => navigate(-1);

  if (loading) return <UserProfileSkeleton onBack={handleBack} />;

  if (error || !user) {
    return (
      <div className={styles.page}>
        <PageTopBar onBack={handleBack} />
        <ErrorState message={error || 'User not found'} onRetry={() => navigate(0)} />
      </div>
    );
  }

  const lots = user.lots ?? [];
  const completedSales = user._count?.sellOrders ?? 0;
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const displayName = user.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user.username ?? 'Unknown';

  return (
    <div className={styles.page}>
      <PageTopBar onBack={handleBack} />

      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <Avatar name={displayName} size={80} src={user.avatar ?? undefined} />
          <h1 className={styles.title}>{displayName}</h1>
          {user.username && (
            <div className={styles.username}>@{user.username}</div>
          )}
          {user.bio && (
            <p className={styles.bio}>{user.bio}</p>
          )}
          <div className={styles.joinDate}>Member since {joinDate}</div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{lots.length}</span>
            <span className={styles.statLabel}>Active lots</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {reviewsData.averageRating ? `⭐ ${reviewsData.averageRating}` : '—'}
            </span>
            <span className={styles.statLabel}>Rating ({reviewsData.count})</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{completedSales}</span>
            <span className={styles.statLabel}>Sales</span>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={[styles.tab, activeTab === 'lots' ? styles.activeTab : ''].join(' ')}
            onClick={() => setActiveTab('lots')}
          >
            Lots ({lots.length})
          </button>
          <button
            className={[styles.tab, activeTab === 'reviews' ? styles.activeTab : ''].join(' ')}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({reviewsData.count})
          </button>
        </div>

        {/* Tab content */}
        <div className={styles.tabContent}>
          {activeTab === 'lots' && <LotsList lots={lots} />}
          {activeTab === 'reviews' && <ReviewsList reviews={reviewsData.reviews} loading={reviewsData.loading} />}
        </div>
      </div>
    </div>
  );
}

function ReviewsList({ reviews, loading }) {
  if (loading) return <Skeleton width="100%" height={100} count={3} radius="12px" />;

  if (!reviews || reviews.length === 0) {
    return (
      <div className={styles.emptyReviews}>
        <span style={{ fontSize: 36 }}>⭐</span>
        <p>No reviews yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.reviewsList}>
      {reviews.map((r) => (
        <div key={r.id} className={styles.reviewCard}>
          <div className={styles.reviewHeader}>
            <div className={styles.reviewer}>
              <Avatar name={r.reviewer?.firstName || r.reviewer?.username} size={24} />
              <span className={styles.reviewerName}>
                {r.reviewer?.firstName || r.reviewer?.username}
              </span>
            </div>
            <div className={styles.reviewRating}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} style={{ opacity: i < r.rating ? 1 : 0.2 }}>⭐</span>
              ))}
            </div>
          </div>
          {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
          <div className={styles.reviewDate}>
            {new Date(r.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function LotsList({ lots }) {
  if (!lots || lots.length === 0) {
    return (
      <div className={styles.emptyLots}>
        <span style={{ fontSize: 36 }}>📭</span>
        <p>No active listings yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.lotsGrid}>
      {lots.map((lot) => (
        <Link key={lot.id} to={`/product/${lot.id}`} className={styles.lotCard}>
          <div className={styles.lotCardIcon}>
            {CATEGORY_ICONS[lot.category] ?? '📦'}
          </div>
          <div className={styles.lotCardInfo}>
            <div className={styles.lotCardTitle}>{lot.title}</div>
            <div className={styles.lotCardDesc}>{lot.description?.slice(0, 60)}…</div>
          </div>
          <div className={styles.lotCardPrice}>
            <StarsPrice amount={lot.price} size="sm" />
          </div>
        </Link>
      ))}
    </div>
  );
}

function PageTopBar({ onBack }) {
  return (
    <header className={styles.topBar}>
      <IconButton
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        }
        onClick={onBack}
      />
      <span className={styles.topBarTitle}>Seller Profile</span>
    </header>
  );
}

function UserProfileSkeleton({ onBack }) {
  return (
    <div className={styles.page}>
      <PageTopBar onBack={onBack} />
      <div className={styles.content}>
        <div className={styles.header}>
          <Skeleton width={80} height={80} radius="50%" />
          <Skeleton width={160} height={22} style={{ marginTop: 14 }} />
          <Skeleton width={100} height={14} style={{ marginTop: 8 }} />
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '0 16px', marginBottom: 24 }}>
          <Skeleton width="33%" height={56} radius="10px" />
          <Skeleton width="33%" height={56} radius="10px" />
          <Skeleton width="33%" height={56} radius="10px" />
        </div>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton width="100%" height={72} radius="12px" />
          <Skeleton width="100%" height={72} radius="12px" />
          <Skeleton width="100%" height={72} radius="12px" />
        </div>
      </div>
    </div>
  );
}
