import { useProducts } from '../hooks';
import { ProductCard, ProductCardSkeleton } from '../components/marketplace/ProductCard';
import CategoryTabs from '../components/marketplace/CategoryTabs';
import SearchBar from '../components/marketplace/SearchBar';
import { EmptyState, ErrorState, StarsPrice } from '../components/ui';
import { useUserStore } from '../store';
import styles from './Marketplace.module.css';

export default function Marketplace() {
  const { products, isLoading, error } = useProducts();
  const user = useUserStore((s) => s.user);

  return (
    <div className={styles.page}>
      {/* Hero Header */}
      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <div className={styles.greeting}>
              {user?.first_name ? `Hey, ${user.first_name} 👋` : 'Welcome back 👋'}
            </div>
            <h1 className={styles.heroTitle}>
              Find your<br />
              <span className={styles.heroAccent}>perfect account</span>
            </h1>
          </div>
          <div className={styles.heroBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            <span>Stars Only</span>
          </div>
        </div>

        {/* Stats strip */}
        <div className={styles.statsStrip}>
          <div className={styles.stripStat}>
            <span className={styles.stripValue}>2,400+</span>
            <span className={styles.stripLabel}>accounts sold</span>
          </div>
          <div className={styles.stripDiv} />
          <div className={styles.stripStat}>
            <span className={styles.stripValue}>98%</span>
            <span className={styles.stripLabel}>satisfaction</span>
          </div>
          <div className={styles.stripDiv} />
          <div className={styles.stripStat}>
            <span className={styles.stripValue}>⚡ Instant</span>
            <span className={styles.stripLabel}>delivery</span>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className={styles.controls}>
        <SearchBar />
        <CategoryTabs />
      </div>

      {/* Count */}
      {!isLoading && !error && (
        <div className={styles.resultCount}>
          {products.length} account{products.length !== 1 ? 's' : ''} available
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {error ? (
          <ErrorState message={error} />
        ) : isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No accounts found"
            description="Try a different search or browse another category"
          />
        ) : (
          <div className={styles.grid}>
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
