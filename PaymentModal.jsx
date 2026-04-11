import { useEffect } from 'react';
import { Button, StarsPrice } from '../ui';
import { usePayment } from '../../hooks';
import styles from './PaymentModal.module.css';

export default function PaymentModal({ product, onClose }) {
  const { purchase, paymentStatus, paymentError, resetPayment } = usePayment();

  useEffect(() => {
    return () => resetPayment();
  }, []);

  const handleBuy = () => purchase(product);

  const handleClose = () => {
    resetPayment();
    onClose?.();
  };

  // Success state
  if (paymentStatus === 'success') {
    return (
      <ModalOverlay onClose={handleClose}>
        <div className={styles.modal}>
          <div className={styles.successAnim}>
            <div className={styles.checkCircle}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
          <h2 className={styles.successTitle}>Purchase Complete!</h2>
          <p className={styles.successDesc}>
            Your account credentials will be delivered to your Telegram inbox within minutes.
          </p>
          <div className={styles.successDetail}>
            <span className={styles.successProduct}>{product.title}</span>
            <StarsPrice amount={product.price} size="md" />
          </div>
          <Button variant="primary" fullWidth size="lg" onClick={handleClose}>
            Done
          </Button>
        </div>
      </ModalOverlay>
    );
  }

  // Error state
  if (paymentStatus === 'error') {
    return (
      <ModalOverlay onClose={handleClose}>
        <div className={styles.modal}>
          <div className={styles.errorAnim}>❌</div>
          <h2 className={styles.errorTitle}>Payment Failed</h2>
          <p className={styles.errorDesc}>{paymentError || 'Something went wrong. Please try again.'}</p>
          <div className={styles.errorActions}>
            <Button variant="primary" fullWidth size="lg" onClick={handleBuy}>
              Try Again
            </Button>
            <Button variant="ghost" fullWidth size="md" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </ModalOverlay>
    );
  }

  // Default: confirm
  return (
    <ModalOverlay onClose={paymentStatus === 'pending' ? undefined : handleClose}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.productIcon}>
            {product.category === 'telegram' ? '✈️' :
             product.category === 'instagram' ? '📸' :
             product.category === 'youtube' ? '▶️' :
             product.category === 'tiktok' ? '🎵' : '📱'}
          </div>
          <div>
            <h2 className={styles.productTitle}>{product.title}</h2>
            <p className={styles.productCategory}>{product.category}</p>
          </div>
        </div>

        <div className={styles.priceBlock}>
          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>Price</span>
            <StarsPrice amount={product.price} size="lg" />
          </div>
          {product.originalPrice && (
            <div className={styles.savings}>
              You save{' '}
              <StarsPrice amount={product.originalPrice - product.price} size="sm" />
            </div>
          )}
        </div>

        <div className={styles.guarantees}>
          {[
            { icon: '🔒', text: 'Secure Telegram Stars payment' },
            { icon: '⚡', text: 'Instant delivery after payment' },
            { icon: '🛡️', text: '24h buyer protection guarantee' },
          ].map((g) => (
            <div key={g.text} className={styles.guarantee}>
              <span>{g.icon}</span>
              <span>{g.text}</span>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            fullWidth
            size="xl"
            loading={paymentStatus === 'pending'}
            onClick={handleBuy}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            }
          >
            {paymentStatus === 'pending' ? 'Processing...' : `Pay ${product.price.toLocaleString()} Stars`}
          </Button>
          {paymentStatus !== 'pending' && (
            <Button variant="ghost" fullWidth size="md" onClick={handleClose}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}

function ModalOverlay({ children, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}>
      <div className={styles.sheet}>
        {onClose && (
          <div className={styles.handle} />
        )}
        {children}
      </div>
    </div>
  );
}
