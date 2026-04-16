import { ProductCard } from '../marketplace/ProductCard';
import { EmptyState } from '../ui';
import styles from './user.module.css';

export default function UserLots({ lots }) {
  if (!lots || lots.length === 0) {
    return (
      <EmptyState
        title="No lots yet"
        description="This seller hasn't posted any active listings yet."
      />
    );
  }

  return (
    <div className={styles.lotsGrid}>
      {lots.map((lot, index) => (
        <ProductCard key={lot.id} product={lot} index={index} />
      ))}
    </div>
  );
}
