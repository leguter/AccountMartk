import { useHaptic } from '../../hooks';
import styles from './ui.module.css';

// ─── BUTTON ──────────────────────────────────────────────────────────────────
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconRight,
  onClick,
  className = '',
  ...props
}) {
  const { impact } = useHaptic();

  const handleClick = (e) => {
    if (disabled || loading) return;
    impact('medium');
    onClick?.(e);
  };

  return (
    <button
      className={[
        styles.btn,
        styles[`btn--${variant}`],
        styles[`btn--${size}`],
        fullWidth ? styles['btn--full'] : '',
        loading ? styles['btn--loading'] : '',
        disabled ? styles['btn--disabled'] : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={styles.spinner} />
      ) : (
        <>
          {icon && <span className={styles.btnIcon}>{icon}</span>}
          <span>{children}</span>
          {iconRight && <span className={styles.btnIconRight}>{iconRight}</span>}
        </>
      )}
    </button>
  );
}

// ─── BADGE ───────────────────────────────────────────────────────────────────
export function Badge({ children, color, size = 'sm' }) {
  return (
    <span
      className={[styles.badge, styles[`badge--${size}`]].join(' ')}
      style={color ? { background: color, color: '#fff' } : undefined}
    >
      {children}
    </span>
  );
}

// ─── SKELETON ────────────────────────────────────────────────────────────────
export function Skeleton({ width, height, radius, className = '' }) {
  return (
    <span
      className={[styles.skeleton, className].join(' ')}
      style={{ width, height, borderRadius: radius }}
    />
  );
}

// ─── STAR ICON ───────────────────────────────────────────────────────────────
export function StarIcon({ size = 16, filled = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// ─── STARS PRICE ─────────────────────────────────────────────────────────────
export function StarsPrice({ amount, size = 'md', strikethrough = false }) {
  return (
    <span className={[styles.starsPrice, styles[`starsPrice--${size}`], strikethrough ? styles['starsPrice--strike'] : ''].filter(Boolean).join(' ')}>
      <svg width={size === 'lg' ? 20 : size === 'md' ? 16 : 13} height={size === 'lg' ? 20 : size === 'md' ? 16 : 13} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L9.19 8.63L2 9.24L7 13.97L5.82 21L12 17.27L18.18 21L17 13.97L22 9.24L14.81 8.63L12 2Z"/>
      </svg>
      <span>{amount?.toLocaleString()}</span>
    </span>
  );
}

// ─── DIVIDER ─────────────────────────────────────────────────────────────────
export function Divider({ label }) {
  return (
    <div className={styles.divider}>
      {label && <span className={styles.dividerLabel}>{label}</span>}
    </div>
  );
}

// ─── ICON BUTTON ─────────────────────────────────────────────────────────────
export function IconButton({ icon, onClick, label, active = false, className = '' }) {
  const { impact } = useHaptic();
  return (
    <button
      className={[styles.iconBtn, active ? styles['iconBtn--active'] : '', className].filter(Boolean).join(' ')}
      onClick={() => { impact('light'); onClick?.(); }}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────
export function Avatar({ src, name, size = 40 }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div
      className={styles.avatar}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? (
        <img src={src} alt={name} className={styles.avatarImg} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className={styles.emptyState}>
      {icon && <div className={styles.emptyIcon}>{icon}</div>}
      <h3 className={styles.emptyTitle}>{title}</h3>
      {description && <p className={styles.emptyDesc}>{description}</p>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  );
}

// ─── ERROR STATE ─────────────────────────────────────────────────────────────
export function ErrorState({ message, onRetry }) {
  return (
    <div className={styles.errorState}>
      <div className={styles.errorIcon}>⚠️</div>
      <p className={styles.errorMsg}>{message || 'Something went wrong'}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
