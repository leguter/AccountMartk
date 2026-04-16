import { StarIcon, EmptyState } from '../ui';
import styles from './user.module.css';

export default function UserReviews({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return (
      <EmptyState
        title="No reviews yet"
        description="This seller hasn't received any feedback from buyers yet."
      />
    );
  }

  return (
    <div className={styles.reviewsList}>
      {reviews.map((review) => (
        <div key={review.id} className={styles.reviewCard}>
          <div className={styles.reviewHeader}>
            <span className={styles.reviewerName}>@{review.username}</span>
            <span className={styles.reviewDate}>{review.date}</span>
          </div>
          <div className={styles.reviewRating}>
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon key={i} size={14} filled={i < review.rating} />
            ))}
          </div>
          <p className={styles.reviewComment}>{review.comment}</p>
        </div>
      ))}
    </div>
  );
}
