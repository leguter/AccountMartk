import { useEffect, useRef, useState } from 'react';
import { useUserStore } from '../../store';
import { useChat, useHaptic } from '../../hooks';
import { paymentService, disputeService } from '../../services/api';
import { Button, StarsPrice } from '../ui';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import styles from './chat.module.css';

const CATEGORY_ICONS = {
  telegram: '✈️', instagram: '📸', youtube: '▶️', tiktok: '🎵', phone: '📱',
};

export default function ChatWindow({ order, refresh }) {
  const user = useUserStore((s) => s.user);
  const currentUserId = user?.id ?? 'demo_user';
  const orderId = order?.id;

  const { messages, sendMessage, otherIsTyping, notifyTyping } = useChat(orderId);
  const { impact, notification } = useHaptic();

  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Dispute UI state
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputing, setDisputing] = useState(false);
  const [disputeError, setDisputeError] = useState(null);

  const bottomRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Check if we are already at or very near the bottom
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    
    // Check if last message is from current user (indicates we just sent something)
    const lastMsg = messages[messages.length - 1];
    const sentByMe = lastMsg && String(lastMsg.senderId) === String(currentUserId);

    if (isAtBottom || sentByMe) {
      // Use 'auto' instead of 'smooth' to avoid jumpy behavior/loops in some browsers
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, currentUserId]);

  if (!order) return null;

  const isBuyer = String(order.buyerId) === String(currentUserId);
  const isSeller = String(order.sellerId) === String(currentUserId);
  const lot = order.lot;

  const handleSend = async (text) => {
    try {
      await sendMessage(text);
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  const handlePay = async () => {
    impact('medium');
    setPaying(true);
    try {
      const { invoiceUrl } = await paymentService.createInvoice(order.id);
      const tg = window.Telegram?.WebApp;
      if (tg?.openInvoice) {
        await paymentService.triggerStarsPayment(invoiceUrl);
      } else {
        await new Promise((r) => setTimeout(r, 800));
      }
      try {
        await paymentService.manualConfirmPayment(order.id);
      } catch (e) {
        console.warn('Manual confirm (may already be paid):', e.message);
      }
      notification('success');
      refresh();
    } catch (err) {
      console.error('Payment failed:', err);
      notification('error');
    } finally {
      setPaying(false);
    }
  };

  const handleConfirm = async () => {
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

  const handleOpenDispute = async () => {
    const trimmed = disputeReason.trim();
    if (trimmed.length < 10) {
      setDisputeError('Please describe the issue in at least 10 characters.');
      return;
    }
    impact('heavy');
    setDisputing(true);
    setDisputeError(null);
    try {
      await disputeService.openDispute(order.id, trimmed);
      notification('success');
      setShowDisputeForm(false);
      setDisputeReason('');
      refresh();
    } catch (err) {
      setDisputeError(err.message || 'Failed to open dispute. Please try again.');
      notification('error');
    } finally {
      setDisputing(false);
    }
  };

  const renderBanner = () => {
    const { status } = order;

    if (status === 'pending' && isBuyer) {
      return (
        <div className={[styles.orderBanner, styles.bannerPending].join(' ')}>
          <div className={styles.bannerTitle}>
            💰 Payment Required — <StarsPrice amount={order.amount} size="sm" />
          </div>
          <p className={styles.bannerSub}>
            Stars are held securely until you confirm delivery.
          </p>
          <div className={styles.bannerActions}>
            <Button variant="primary" size="sm" onClick={handlePay} loading={paying}>
              Pay Stars
            </Button>
          </div>
        </div>
      );
    }

    if (status === 'pending' && isSeller) {
      return (
        <div className={[styles.orderBanner, styles.bannerPending].join(' ')}>
          <div className={styles.bannerTitle}>⏳ Waiting for payment</div>
          <p className={styles.bannerSub}>
            The buyer hasn't paid yet. Stars will be held in escrow once payment is made.
          </p>
        </div>
      );
    }

    if (status === 'paid') {
      return (
        <div className={[styles.orderBanner, styles.bannerPaid].join(' ')}>
          {isBuyer ? (
            <>
              <div className={styles.bannerTitle}>⏳ Waiting for delivery…</div>
              <p className={styles.bannerSub}>
                Once you receive the account details, confirm to release payment.
              </p>
              <div className={styles.bannerActions}>
                <Button variant="success" size="sm" onClick={handleConfirm} loading={confirming}>
                  Confirm Receipt
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => { setShowDisputeForm(true); setDisputeError(null); }}
                  disabled={disputing}
                >
                  ⚠️ Open Dispute
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.bannerTitle}>✅ Paid — please deliver</div>
              <p className={styles.bannerSub}>
                Stars are in escrow. Send the account credentials and wait for the buyer to confirm.
              </p>
              <div className={styles.bannerActions}>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => { setShowDisputeForm(true); setDisputeError(null); }}
                  disabled={disputing}
                >
                  ⚠️ Open Dispute
                </Button>
              </div>
            </>
          )}

          {/* Dispute Form */}
          {showDisputeForm && (
            <div className={styles.disputeForm}>
              <div className={styles.disputeTitle}>⚠️ Open a Dispute</div>
              <p className={styles.disputeSub}>
                Explain the issue. Our team will review and resolve within 24h.
                Funds stay frozen until resolved.
              </p>
              <textarea
                className={styles.disputeTextarea}
                placeholder="Describe the problem in detail (min 10 characters)…"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              {disputeError && (
                <div className={styles.disputeError}>{disputeError}</div>
              )}
              <div className={styles.disputeActions}>
                <Button variant="danger" size="sm" onClick={handleOpenDispute} loading={disputing}>
                  Submit Dispute
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowDisputeForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (status === 'disputed') {
      return (
        <div className={[styles.orderBanner, styles.bannerDisputed].join(' ')}>
          <div className={styles.bannerTitle}>⚠️ Dispute in Progress</div>
          <p className={styles.bannerSub}>
            Our support team is reviewing this order. Funds are frozen until resolved.
            Please do not share credentials while the dispute is active.
          </p>
        </div>
      );
    }

    if (status === 'completed') {
      return (
        <div className={[styles.orderBanner, styles.bannerCompleted].join(' ')}>
          <div className={styles.bannerTitle}>🎉 Order Completed</div>
          <p className={styles.bannerSub}>Transaction is complete. Thank you!</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={styles.window}>
      {lot && (
        <div className={styles.lotCard}>
          <div className={styles.lotCardIcon}>
            {CATEGORY_ICONS[lot.category] || '📦'}
          </div>
          <div className={styles.lotCardInfo}>
            <div className={styles.lotCardTitle}>{lot.title}</div>
            <div className={styles.lotCardPrice}>
              <StarsPrice amount={lot.price} size="sm" />
            </div>
          </div>
          <div className={styles.lotCardStatus} data-status={order.status}>
            {order.status === 'pending' && '⏳ Pending'}
            {order.status === 'paid' && '🔒 In Escrow'}
            {order.status === 'disputed' && '⚠️ Disputed'}
            {order.status === 'completed' && '✅ Done'}
            {order.status === 'cancelled' && '❌ Cancelled'}
          </div>
        </div>
      )}

      <div className={styles.messages} ref={scrollRef}>
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg._key || msg.id}
            message={msg}
            currentUserId={currentUserId}
            isOptimistic={!!msg._optimistic}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {renderBanner()}

      {/* Typing indicator */}
      {otherIsTyping && (
        <div className={styles.typingIndicator}>
          <span className={styles.typingDot} />
          <span className={styles.typingDot} />
          <span className={styles.typingDot} />
        </div>
      )}

      <ChatInput onSend={handleSend} onTyping={notifyTyping} />
    </div>
  );
}
