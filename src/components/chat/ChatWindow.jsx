import { useEffect, useRef } from 'react';
import { useOrderStore, useChatStore } from '../../store';
import { useUserStore } from '../../store';
import { Button, StarsPrice } from '../ui';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import styles from './chat.module.css';

export default function ChatWindow({ orderId }) {
  const user = useUserStore((s) => s.user);
  const currentUserId = user?.id ?? 'demo_user';

  const order = useOrderStore((s) => s.getOrderById(orderId));
  const payOrder = useOrderStore((s) => s.payOrder);
  const confirmOrder = useOrderStore((s) => s.confirmOrder);

  const getMessages = useChatStore((s) => s.getMessages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const messages = getMessages(orderId);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!order) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-3)' }}>
        Order not found.
      </div>
    );
  }

  const isBuyer = String(order.buyerId) === String(currentUserId);
  const isSeller = String(order.sellerId) === String(currentUserId);

  const handleSend = (text) => {
    sendMessage({ orderId, senderId: currentUserId, text, type: 'text' });
  };

  const handlePay = () => {
    payOrder(orderId);
    sendMessage({
      orderId,
      senderId: 'system',
      text: '✅ Payment has been made. Stars are held in escrow.',
      type: 'system',
    });
  };

  const handleConfirm = () => {
    confirmOrder(orderId);
    sendMessage({
      orderId,
      senderId: 'system',
      text: '🎉 Order confirmed! Stars have been released to the seller.',
      type: 'system',
    });
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
            <Button variant="primary" size="sm" onClick={handlePay}>
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
            Once you receive the account details, click Confirm to release payment.
          </p>
          <div className={styles.bannerActions}>
            <Button variant="primary" size="sm" onClick={handleConfirm}>
              Confirm Order
            </Button>
          </div>
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
