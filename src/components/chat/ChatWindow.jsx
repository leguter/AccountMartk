import { useEffect, useRef } from 'react';
import { useUserStore } from '../../store';
import { useChat, usePayment, useHaptic } from '../../hooks';
import { Button, StarsPrice } from '../ui';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import styles from './chat.module.css';

export default function ChatWindow({ order, refresh }) {
  const user = useUserStore((s) => s.user);
  const currentUserId = user?.id ?? 'demo_user';
  const orderId = order?.id;

  const { messages, sendMessage } = useChat(orderId);
  const { purchase, paymentStatus } = usePayment();
  const { impact, notification } = useHaptic();

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!order) return null;

  const isBuyer = String(order.buyerId) === String(currentUserId);
  const isSeller = String(order.sellerId) === String(currentUserId);

  const handleSend = async (text) => {
    try {
      await sendMessage(text);
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  const handlePay = async () => {
    impact('medium');
    try {
      // In real Telegram, purchase() triggers stars invoice.
      // After it returns, we refresh the order to see "paid" status.
      await purchase(order.lot);
      notification('success');
      refresh();
    } catch (err) {
      console.error('Payment failed:', err);
      notification('error');
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
              loading={paymentStatus === 'pending'}
            >
              Pay Now
            </Button>
          </div>
        </div>
      );
    }

    if (status === 'paid' && isBuyer) {
      return (
        <div className={[styles.orderBanner, styles.bannerPaid].join(' ')}>
          <div className={styles.bannerTitle}>⏳ Waiting for delivery…</div>
          <p className={styles.bannerSub}>
            Once you receive the account details, click Confirm in the header to release payment.
          </p>
        </div>
      );
    }

    if (status === 'paid' && isSeller) {
      return (
        <div className={[styles.orderBanner, styles.bannerPaid].join(' ')}>
          <div className={styles.bannerTitle}>✅ Payment received — Deliver the account</div>
          <p className={styles.bannerSub}>
            Stars are in escrow. They'll be released once the buyer confirms.
          </p>
        </div>
      );
    }

    if (status === 'completed') {
      return (
        <div className={[styles.orderBanner, styles.bannerCompleted].join(' ')}>
          <div className={styles.bannerTitle}>🎉 Order Completed</div>
          <p className={styles.bannerSub}>
            Transaction is complete. Thank you!
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={styles.window}>
      <div className={styles.messages}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--gray-3)', fontSize: 13, marginTop: 32 }}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />
        ))}
        <div ref={bottomRef} />
      </div>

      {renderBanner()}
      <ChatInput onSend={handleSend} />
    </div>
  );
}
