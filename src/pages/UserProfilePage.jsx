import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconButton, ErrorState, Skeleton } from '../components/ui';
import UserHeader from '../components/user/UserHeader';
import UserStats from '../components/user/UserStats';
import UserLots from '../components/user/UserLots';
import UserReviews from '../components/user/UserReviews';
import styles from './UserProfilePage.module.css';

const MOCK_USER = {
  id: 'douglas_j',
  username: 'douglas_j',
  name: 'Douglas Johnson',
  avatar: null,
  joinDate: 'Joined March 2024',
  bio: 'Top seller of premium Telegram and Instagram accounts. 100% manual growth, high engagement, and safe transfer guaranteed.',
  rating: 4.9,
  reviewsCount: 154,
  totalLots: 12,
  sales: 243,
};

const MOCK_LOTS = [
  {
    id: 'tg-101',
    category: 'telegram',
    title: 'Crypto News Channel (50k)',
    description: 'Highly active crypto news channel with organic growth and high engagement.',
    price: 1200,
    followers: 52000,
    rating: 4.8,
    reviews: 12,
    verified: true,
    stats: { age: '2y', engagementRate: '5.2%', avgViews: '8k', country: 'Global' }
  },
  {
    id: 'inst-202',
    category: 'instagram',
    title: 'Fitness Lifestyle (120k)',
    description: 'Premium fitness account with real followers and daily active engagement.',
    price: 3500,
    followers: 124000,
    rating: 5.0,
    reviews: 24,
    verified: true,
    stats: { age: '3y', engagementRate: '4.1%', avgViews: '25k', country: 'USA' }
  },
  {
    id: 'yt-303',
    category: 'youtube',
    title: 'Tech Reviews Channel',
    description: 'Monetized channel focused on gadget reviews and tutorials.',
    price: 8500,
    followers: 85000,
    rating: 4.9,
    reviews: 45,
    verified: true,
    stats: { age: '4y', engagementRate: '8.5%', avgViews: '40k', country: 'UK' }
  }
];

const MOCK_REVIEWS = [
  {
    id: 1,
    username: 'alex_green',
    rating: 5,
    comment: 'Excellent seller! The transfer was smooth and the account is exactly as described.',
    date: '2 days ago'
  },
  {
    id: 2,
    username: 'crypto_king',
    rating: 4,
    comment: 'Good communication. Had some issues with the 2FA but Douglas helped me resolve it quickly.',
    date: '1 week ago'
  },
  {
    id: 3,
    username: 'maria_s',
    rating: 5,
    comment: 'Very reliable and professional. Highly recommended!',
    date: '2 weeks ago'
  }
];

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lots');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return <UserProfileSkeleton onBack={handleBack} />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <IconButton
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          }
          onClick={handleBack}
        />
        <span className={styles.topBarTitle}>Seller Profile</span>
      </header>

      <div className={styles.content}>
        <UserHeader user={MOCK_USER} />
        <UserStats user={MOCK_USER} />

        <div className={styles.tabs}>
          <button
            className={[styles.tab, activeTab === 'lots' ? styles.activeTab : ''].join(' ')}
            onClick={() => setActiveTab('lots')}
          >
            Lots ({MOCK_USER.totalLots})
          </button>
          <button
            className={[styles.tab, activeTab === 'reviews' ? styles.activeTab : ''].join(' ')}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({MOCK_USER.reviewsCount})
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'lots' ? (
            <UserLots lots={MOCK_LOTS} />
          ) : (
            <UserReviews reviews={MOCK_REVIEWS} />
          )}
        </div>
      </div>
    </div>
  );
}

function UserProfileSkeleton({ onBack }) {
  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <IconButton
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          }
          onClick={onBack}
        />
        <span className={styles.topBarTitle}>Seller Profile</span>
      </header>
      <div className={styles.content}>
        <div style={{ padding: '20px 0' }}>
          <Skeleton width={80} height={80} radius="50%" />
          <Skeleton width={180} height={24} style={{ marginTop: 16 }} />
          <Skeleton width={120} height={16} style={{ marginTop: 8 }} />
          <Skeleton width="100%" height={60} style={{ marginTop: 16 }} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <Skeleton width="30%" height={40} radius="8px" />
          <Skeleton width="30%" height={40} radius="8px" />
          <Skeleton width="30%" height={40} radius="8px" />
        </div>
      </div>
    </div>
  );
}
