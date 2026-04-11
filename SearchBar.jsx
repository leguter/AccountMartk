import { useState, useEffect } from 'react';
import { useMarketplaceStore } from '../../store';
import { useDebounce, useHaptic } from '../../hooks';
import styles from './SearchBar.module.css';

export default function SearchBar({ placeholder = 'Search accounts...' }) {
  const [value, setValue] = useState('');
  const { setSearch, setSort, sortBy } = useMarketplaceStore();
  const { selection } = useHaptic();
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    setSearch(debouncedValue);
  }, [debouncedValue]);

  const handleSort = (e) => {
    selection();
    setSort(e.target.value);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputWrap}>
        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {value && (
          <button className={styles.clearBtn} onClick={() => setValue('')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      <select className={styles.sortSelect} value={sortBy} onChange={handleSort}>
        <option value="popular">Popular</option>
        <option value="newest">Newest</option>
        <option value="price_asc">Price ↑</option>
        <option value="price_desc">Price ↓</option>
      </select>
    </div>
  );
}
