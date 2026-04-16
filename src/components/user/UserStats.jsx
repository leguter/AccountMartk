import styles from './user.module.css';

export default function UserStats({ user }) {
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statItem}>
        <span className={styles.statValue}>⭐ {user.rating}</span>
        <span className={styles.statLabel}>Rating</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.statValue}>{user.reviewsCount}</span>
        <span className={styles.statLabel}>Reviews</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.statValue}>{user.totalLots}</span>
        <span className={styles.statLabel}>Lots</span>
      </div>
    </div>
  );
}
