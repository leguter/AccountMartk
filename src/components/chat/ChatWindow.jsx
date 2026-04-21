import { useEffect, useRef, useState } from 'react';
import { useUserStore } from '../../store';
import { useChat, useHaptic } from '../../hooks';
import { paymentService } from '../../services/api';
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

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      // Telegram confirmed payment — immediately update the backend
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
            <Button
              variant="primary"
              size="sm"
              onClick={handlePay}
              loading={paying}
            >
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

    if (status === 'paid' && isBuyer) {
      return (
        <div className={[styles.orderBanner, styles.bannerPaid].join(' ')}>
          <div className={styles.bannerTitle}>⏳ Waiting for delivery…</div>
          <p className={styles.bannerSub}>
            Once you receive the account details, confirm to release payment.
          </p>
          <div className={styles.bannerActions}>
            <Button
              variant="success"
              size="sm"
              onClick={handleConfirm}
              loading={confirming}
            >
              Confirm Receipt
            </Button>
          </div>
        </div>
      );
    }

    if (status === 'paid' && isSeller) {
      return (
        <div className={[styles.orderBanner, styles.bannerPaid].join(' ')}>
          <div className={styles.bannerTitle}>✅ Paid — please deliver</div>
          <p className={styles.bannerSub}>
            Stars are in escrow. Send the account credentials and wait for the buyer to confirm.
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
            {order.status === 'completed' && '✅ Done'}
            {order.status === 'cancelled' && '❌ Cancelled'}
          </div>
        </div>
      )}

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />
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
