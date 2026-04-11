import { useState, useEffect } from 'react';
import { useMarketplaceStore } from '../store';
import { useProducts, useDebounce, useHaptic } from '../hooks';
import { ProductCard, ProductCardSkeleton } from '../components/marketplace/ProductCard';
import { EmptyState } from '../components/ui';
import styles from './Search.module.css';

const TRENDING = ['@crypto', 'telegram channel', 'instagram 100k', 'youtube monetized', 'US number'];

export default function Search() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const { setSearch, filteredProducts } = useMarketplaceStore();
  const { isLoading } = useProducts();
  const { selection } = useHaptic();
  const debouncedQuery = useDebounce(query, 280);

  useEffect(() => {
    setSearch(debouncedQuery);
  }, [debouncedQuery, setSearch]);

  // Reset category on search page mount
  useEffect(() => {
    return () => setSearch('');
  }, [setSearch]);

  const handleTrending = (term) => {
    selection();
    setQuery(term);
  };

  const showResults = query.length > 0;
  const showTrending = !showResults && !focused;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Search</h1>
        <p className={styles.subtitle}>Find accounts, channels & numbers</p>
      </div>

      {/* Search input */}
      <div className={styles.inputArea}>
        <div className={[styles.inputWrap, focused ? styles['inputWrap--focused'] : ''].join(' ')}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className={styles.input}
            placeholder="Search accounts, usernames..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoFocus
          />
          {query && (
            <button className={styles.clearBtn} onMouseDown={(e) => { e.preventDefault(); setQuery(''); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Trending */}
      {showTrending && (
        <div className={styles.trending}>
          <div className={styles.trendingLabel}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--yellow)' }}>
              <path d="M13.5 2C13.5 2 14.5 8.5 12 10C9.5 11.5 7 8 7 8C7 8 5 16 12 19C15.5 20.5 22 18 22 12C22 8 19 5 15.5 4L13.5 2Z"/>
              <path d="M8.5 19.5C8.5 19.5 9 21.5 12 22C12 22 8 22 7 19C6 16 8 14.5 8 14.5C8 14.5 7.5 17 8.5 19.5Z"/>
            </svg>
            Trending searches
          </div>
          <div className={styles.trendingList}>
            {TRENDING.map((term) => (
              <button key={term} className={styles.trendingChip} onClick={() => handleTrending(term)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                </svg>
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {showResults && (
        <div className={styles.results}>
          {isLoading ? (
            <div className={styles.resultList}>
              {Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No results found"
              description={`No accounts matching "${query}"`}
            />
          ) : (
            <>
              <div className={styles.resultCount}>
                {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}
              </div>
              <div className={styles.resultList}>
                {filteredProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
