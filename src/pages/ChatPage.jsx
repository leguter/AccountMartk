import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrder, useHaptic } from '../hooks';
import { useUserStore } from '../store';
import { paymentService } from '../services/api';
import { StarsPrice, Button, Skeleton } from '../components/ui';
import ChatWindow from '../components/chat/ChatWindow';
import styles from './ChatPage.module.css';

export default function ChatPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { order, loading, error, refresh } = useOrder(orderId);
  const user = useUserStore((s) => s.user);
  const [supportOpen, setSupportOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const { impact, notification } = useHaptic();

  const isBuyer = order && user ? String(order.buyerId) === String(user.id) : false;

  const handleBack = () => navigate(-1);

  const handleConfirm = async () => {
    if (!order) return;
    impact('heavy');
    setConfirming(true);
    try {
      await paymentService.confirmOrder(order.id);
      notification('success');
      refresh();
    } catch (err) {
      console.error('Confirm failed:', err);
      notification('error');
    } finally {
      setConfirming(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!order) return;
    impact('medium');
    setSubmittingReview(true);
    try {
      await paymentService.submitReview(order.id, { rating, comment });
      notification('success');
      refresh();
    } catch (err) {
      console.error('Review failed:', err);
      notification('error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const statusLabel = {
    pending: { text: 'Awaiting payment', color: 'var(--yellow)' },
    paid: { text: 'In escrow', color: 'var(--info)' },
    completed: { text: 'Completed', color: 'var(--success)' },
    cancelled: { text: 'Cancelled', color: 'var(--error)' },
  };

  const status = order ? statusLabel[order.status] : null;

  if (loading && !order) return <div className={styles.page}><Skeleton height={60} /></div>;
  if (error && !order) return <div className={styles.page}>{error}</div>;

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button className={styles.backBtn} onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className={styles.topBarCenter}>
          <span className={styles.topBarTitle}>
            {order ? order.lot?.title : 'Chat'}
          </span>
          {status && (
            <span className={styles.statusChip} style={{ color: status.color }}>
              {status.text}
            </span>
          )}
        </div>

        {order?.status === 'paid' && isBuyer && (
          <Button 
            variant="success" 
            size="sm" 
            onClick={handleConfirm}
            loading={confirming}
            className={styles.confirmBtn}
          >
            Confirm Receipt
          </Button>
        )}

        {order && (
          <div className={styles.topBarAmount}>
            <StarsPrice amount={order.amount} size="sm" />
          </div>
        )}

        <button
          className={styles.supportBtn}
          onClick={() => setSupportOpen(true)}
          aria-label="Support"
          title="Support"
        >
          💬
        </button>
      </header>

      <div className={styles.chatBody}>
        <ChatWindow order={order} refresh={refresh} />
      </div>

      {/* Review Section */}
      {order?.status === 'completed' && isBuyer && (
        <div className={styles.reviewSection}>
          {order.review ? (
            <div className={styles.reviewSubmitted}>
              ✅ You've already reviewed this order
            </div>
          ) : (
            <>
              <h3 className={styles.reviewTitle}>Leave a Review</h3>
              <div className={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={[styles.starBtn, rating >= star ? styles.starBtnActive : ''].join(' ')}
                    onClick={() => { impact('light'); setRating(star); }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
              </div>
              <textarea
                className={styles.reviewTextarea}
                placeholder="What do you think about the account?"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmitReview}
                loading={submittingReview}
                fullWidth
              >
                Submit Review
              </Button>
            </>
          )}
        </div>
      )}

      {/* Support Modal */}
      {supportOpen && (
        <div className={styles.modalOverlay} onClick={() => setSupportOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>💬</div>
            <h2 className={styles.modalTitle}>Support</h2>
            <p className={styles.modalBody}>
              Support will be implemented later.<br />
              For urgent issues contact <strong>@support</strong> on Telegram.
            </p>
            <button className={styles.modalClose} onClick={() => setSupportOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
