import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProduct, useHaptic } from '../hooks';
import { paymentService, productService } from '../services/api';
import { useUserStore } from '../store';
import { Button, Badge, StarsPrice, Skeleton, ErrorState, Avatar } from '../components/ui';
import styles from './ProductDetail.module.css';

const CATEGORY_ICONS = {
  telegram: '✈️', instagram: '📸', youtube: '▶️', tiktok: '🎵', phone: '📱',
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { product, isLoading, error } = useProduct(id);
  const [contacting, setContacting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const currentUser = useUserStore((s) => s.user);
  const { impact, notification } = useHaptic();

  const isOwner = !!(product && currentUser && String(product.userId ?? product.seller?.id) === String(currentUser.id));

  const handleBack = () => {
    impact('light');
    navigate(-1);
  };

  const handleEdit = () => {
    impact('light');
    navigate(`/create-lot?edit=${id}`);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    impact('heavy');
    setDeleting(true);
    try {
      await productService.deleteLot(id);
      notification('success');
      navigate('/');
    } catch (err) {
      console.error('Delete failed:', err);
      notification('error');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleContact = async () => {
    if (!product) return;
    impact('medium');
    setContacting(true);
    try {
      const res = await paymentService.createOrder(product.id);
      const orderId = res?.order?.id;
      if (orderId) {
        navigate(`/chat/${orderId}`);
      }
    } catch (err) {
      console.error('Contact seller failed:', err);
    } finally {
      setContacting(false);
    }
  };

  if (error) return (
    <div className={styles.page}>
      <TopBar onBack={handleBack} />
      <ErrorState message={error} onRetry={() => navigate(0)} />
    </div>
  );

  if (isLoading || !product) return <ProductDetailSkeleton onBack={handleBack} />;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <TopBar onBack={handleBack} title={product.title} />

      {/* Hero section */}
      <div className={styles.hero}>
        <div className={styles.heroIconWrap}>
          <span className={styles.heroIcon}>{CATEGORY_ICONS[product.category] || '📦'}</span>
          {product.verified && (
            <span className={styles.verifiedBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
            </span>
          )}
        </div>

        <div className={styles.heroInfo}>
          <div className={styles.heroTags}>
            <span className={[styles.catTag, styles[`cat--${product.category}`]].join(' ')}>
              {product.category}
            </span>
            {product.badge && (
              <Badge color={product.badgeColor} size="md">{product.badge}</Badge>
            )}
          </div>
          <h1 className={styles.heroTitle}>{product.title}</h1>
          <div className={styles.heroRating}>
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24"
                fill={i < Math.floor(product.rating) ? '#f5c518' : 'none'}
                stroke={i < Math.floor(product.rating) ? 'none' : '#555'}
                strokeWidth={1.5}
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            ))}
            <span className={styles.ratingNum}>{product.rating}</span>
            <span className={styles.reviewCount}>({product.reviews} reviews)</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {product.stats && (
        <div className={styles.statsGrid}>
          {[
            { label: 'Age', value: product.stats.age },
            { label: 'Engagement', value: product.stats.engagementRate },
            { label: 'Avg. Views', value: product.stats.avgViews },
            { label: 'Country', value: product.stats.country },
          ].map((s) => (
            <div key={s.label} className={styles.statCell}>
              <span className={styles.statCellValue}>{s.value}</span>
              <span className={styles.statCellLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Followers */}
      {product.followers && (
        <div className={styles.followersBar}>
          <div className={styles.followersNum}>
            {product.followers.toLocaleString()}
          </div>
          <div className={styles.followersLabel}>followers / subscribers</div>
        </div>
      )}

      {/* Description */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>About this account</h2>
        <p className={styles.description}>{product.description}</p>
        {product.tags && (
          <div className={styles.tags}>
            {product.tags.map((tag) => (
              <span key={tag} className={styles.tag}>#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Seller */}
      {product.seller && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Seller</h2>
          <Link to={`/user/${product.seller.id}`} className={styles.sellerCard}>
            <Avatar name={product.seller.username} size={44} />
            <div className={styles.sellerInfo}>
              <div className={styles.sellerName}>@{product.seller.username}</div>
              <div className={styles.sellerStats}>
                <span className={styles.sellerRating}>
                  ⭐ {product.seller.rating}
                </span>
                <span className={styles.sellerDot}>·</span>
                <span className={styles.sellerSales}>{product.seller.sales} sales</span>
              </div>
            </div>
            <div className={styles.sellerBadge}>
              {product.seller.sales > 200 ? '🏆 Top Seller' : '✅ Trusted'}
            </div>
          </Link>
        </div>
      )}

      {/* Why buy */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Why buy here?</h2>
        <div className={styles.featureList}>
          {[
            { icon: '🔐', title: 'Escrow Protection', desc: 'Stars held until you confirm delivery' },
            { icon: '⚡', title: 'Instant Transfer', desc: 'Credentials delivered within minutes' },
            { icon: '🔄', title: '24h Dispute Window', desc: 'Open a dispute if anything is wrong' },
            { icon: '📞', title: '24/7 Support', desc: 'Live support via Telegram' },
          ].map((f) => (
            <div key={f.title} className={styles.feature}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <div>
                <div className={styles.featureTitle}>{f.title}</div>
                <div className={styles.featureDesc}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky CTA */}
      <div className={styles.ctaBar}>
        {isOwner ? (
          /* Owner: Edit + Delete */
          <div className={styles.ownerActions}>
            <Button variant="secondary" size="md" onClick={handleEdit} fullWidth>
              ✏️ Edit Listing
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleDelete}
              loading={deleting}
              fullWidth
            >
              {confirmDelete ? '⚠️ Confirm Delete' : '🗑️ Delete'}
            </Button>
          </div>
        ) : (
          /* Buyer: price + contact */
          <>
            <div className={styles.ctaPrice}>
              <StarsPrice amount={product.price} size="lg" />
              {product.originalPrice && (
                <div className={styles.ctaDiscount}>
                  <StarsPrice amount={product.originalPrice} size="sm" strikethrough />
                  <span className={styles.discountPill}>-{discount}%</span>
                </div>
              )}
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleContact}
              loading={contacting}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              }
            >
              Contact Seller
            </Button>
          </>
        )}
      </div>


    </div>
  );
}

function TopBar({ onBack, title }) {
  return (
    <div className={styles.topBar}>
      <button className={styles.backBtn} onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      {title && <span className={styles.topBarTitle}>{title}</span>}
    </div>
  );
}

function ProductDetailSkeleton({ onBack }) {
  return (
    <div className={styles.page}>
      <TopBar onBack={onBack} />
      <div className={styles.hero}>
        <Skeleton width={72} height={72} radius="18px" />
        <div className={styles.heroInfo}>
          <Skeleton width={80} height={20} />
          <Skeleton width={160} height={26} style={{ marginTop: 8 }} />
          <Skeleton width={120} height={16} style={{ marginTop: 8 }} />
        </div>
      </div>
      <div style={{ padding: '16px' }}>
        <div className={styles.statsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.statCell}>
              <Skeleton width="70%" height={18} />
              <Skeleton width="50%" height={12} style={{ marginTop: 4 }} />
            </div>
          ))}
        </div>
        <Skeleton width="100%" height={80} radius="12px" style={{ marginTop: 16 }} />
        <Skeleton width="100%" height={120} radius="12px" style={{ marginTop: 16 }} />
      </div>
    </div>
  );
}
