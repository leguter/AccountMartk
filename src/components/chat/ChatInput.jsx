import { useState } from 'react';
import styles from './chat.module.css';

export default function ChatInput({ onSend, onTyping }) {
  const [text, setText] = useState('');

  const handleChange = (e) => {
    setText(e.target.value);
    // Notify parent that user is typing (debounce handled by the hook / server TTL)
    onTyping?.();
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.inputBar}>
      <textarea
        className={styles.inputField}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKey}
        placeholder="Type a message…"
        rows={1}
      />
      <button
        className={[styles.sendBtn, text.trim() ? styles.sendBtnActive : ''].join(' ')}
        onClick={handleSend}
        aria-label="Send"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 12L22 2L12 22L10 14L2 12Z" />
        </svg>
      </button>
    </div>
  );
}
