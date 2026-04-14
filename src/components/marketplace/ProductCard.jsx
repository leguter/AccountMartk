import { useNavigate } from 'react-router-dom';
import { Badge, StarsPrice, Skeleton } from '../ui';
import { useHaptic } from '../../hooks';
import styles from './ProductCard.module.css';

const CATEGORY_ICONS = {
  telegram: '/icons-media.svg#telegram-communication-chat-interaction-network-connection-svgrepo-com',
  instagram: '📸',
  youtube: '/icons-media.svg#youtube-color-svgrepo-com',
  tiktok: '/icons-media.svg#tiktok-svgrepo-com',
  phone: '📱',
};

export function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const { impact } = useHaptic();

  const handleClick = () => {
    impact('light');
    navigate(`/product/${product.id}`);
  };

  const formatFollowers = (n) => {
    if (!n) return null;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };

  return (
    <div
      className={styles.card}
      onClick={handleClick}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Badge */}
      {/* {product.badge && (
        <div className={styles.badgeWrap}>
          <Badge color={product.badgeColor} size="sm">
            {product.badge}
          </Badge>
        </div>
      )} */}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.avatar}>
         
             <svg className={styles.avatarIcon}>
                            <use href={CATEGORY_ICONS[product.category] || '📦'}></use>
                          </svg>
        
        </div>
        <div className={styles.meta}>
          <h3 className={styles.title}>{product.title}</h3>
          <div className={styles.categoryRow}>
            <span className={[styles.categoryTag, styles[`cat--${product.category}`]].join(' ')}>
              {product.category}
            </span>
            {product.verified && (
              <span className={styles.verified}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
                Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      {product.followers && (
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatFollowers(product.followers)}</span>
            <span className={styles.statLabel}>followers</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{product.stats?.engagementRate || '—'}</span>
            <span className={styles.statLabel}>engagement</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{product.stats?.age || '—'}</span>
            <span className={styles.statLabel}>age</span>
          </div>
        </div>
      )}

      {/* Description */}
      <p className={styles.desc}>{product.description}</p>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.priceBlock}>
          <StarsPrice amount={product.price} size="md" />
          {product.originalPrice && (
            <StarsPrice amount={product.originalPrice} size="sm" strikethrough />
          )}
        </div>

        <div className={styles.rating}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#f5c518">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          <span>{product.rating}</span>
          <span className={styles.reviewCount}>({product.reviews})</span>
        </div>
      </div>

      {/* Tap indicator */}
      <div className={styles.tapArrow}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className={styles.card} style={{ pointerEvents: 'none' }}>
      <div className={styles.header}>
        <Skeleton width={44} height={44} radius="50%" />
        <div className={styles.meta}>
          <Skeleton width="60%" height={18} />
          <Skeleton width="35%" height={14} style={{ marginTop: 6 }} />
        </div>
      </div>
      <Skeleton width="100%" height={14} style={{ marginTop: 12 }} />
      <Skeleton width="80%" height={14} style={{ marginTop: 6 }} />
      <div className={styles.footer} style={{ marginTop: 16 }}>
        <Skeleton width={80} height={20} />
        <Skeleton width={60} height={16} />
      </div>
    </div>
  );
}
