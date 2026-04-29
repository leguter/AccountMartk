import styles from './chat.module.css';

export default function MessageBubble({ message, currentUserId }) {
  const isMine = message.type !== 'system' && String(message.senderId) === String(currentUserId);
  const isSystem = message.type === 'system';

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (isSystem) {
    return (
      <div className={styles.systemMsg}>
        <span className={styles.systemMsgText}>{message.text}</span>
        <span className={styles.systemMsgTime}>{formatTime(message.createdAt)}</span>
      </div>
    );
  }

  const isSupport = message.sender?.username === 'StarcSupport';

  return (
    <div className={[
      styles.bubble, 
      isMine ? styles.bubbleMine : styles.bubbleTheirs,
      isSupport ? styles.bubbleSupport : ''
    ].join(' ')}>
      {isSupport && <div className={styles.supportBadge}>[Support] StarcSupport</div>}
      <p className={styles.bubbleText}>{message.text}</p>
      <span className={styles.bubbleTime}>{formatTime(message.createdAt)}</span>
    </div>
  );
}
