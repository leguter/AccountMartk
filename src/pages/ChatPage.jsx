import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrder, useHaptic } from '../hooks';
import { paymentService } from '../services/api';
import { StarsPrice, Button, Skeleton } from '../components/ui';
import ChatWindow from '../components/chat/ChatWindow';
import styles from './ChatPage.module.css';

export default function ChatPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { order, loading, error, refresh } = useOrder(orderId);
  const [supportOpen, setSupportOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { impact, notification } = useHaptic();

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

        {order?.status === 'paid' && (
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
