import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store';
import { userService } from '../services/api';
import { Button, Avatar } from '../components/ui';
import styles from './CreateLotPage.module.css'; // reuse same form styling

export default function EditProfilePage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const [form, setForm] = useState({
    bio: user?.bio ?? '',
    avatar: user?.avatar ?? '',
    username: user?.username ?? '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined, global: undefined }));
  };

  const validate = () => {
    const e = {};
    if (form.username && !/^[a-zA-Z0-9_]{3,32}$/.test(form.username)) {
      e.username = 'Only letters, numbers, underscores (3–32 chars)';
    }
    if (form.bio && form.bio.length > 500) {
      e.bio = 'Bio must be 500 characters or less';
    }
    if (form.avatar && form.avatar.trim() !== '') {
      try { new URL(form.avatar); } catch {
        e.avatar = 'Enter a valid URL (or leave blank)';
      }
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setIsSubmitting(true);
    try {
      const payload = {};
      if (form.bio !== undefined)     payload.bio     = form.bio;
      if (form.avatar.trim())         payload.avatar  = form.avatar.trim();
      else if (form.avatar === '')    payload.avatar  = '';
      if (form.username.trim())       payload.username = form.username.trim();

      const updated = await userService.updateProfile(user.id, payload);

      // Merge back into local store so profile reflects changes immediately
      setUser({ ...user, ...updated,
        first_name: updated.firstName ?? user.first_name,
        bio: updated.bio ?? null,
        avatar: updated.avatar ?? null,
        username: updated.username ?? user.username,
      });

      setSuccess(true);
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      setErrors({ global: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={styles.successScreen}>
        <div className={styles.successIcon}>✅</div>
        <h2 className={styles.successTitle}>Profile Updated!</h2>
        <p className={styles.successSub}>Redirecting…</p>
      </div>
    );
  }

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'You'
    : 'Profile';

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.topBarTitle}>Edit Profile</span>
      </header>

      {/* Avatar preview */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0 8px' }}>
        <Avatar
          src={form.avatar.trim() || user?.photo_url}
          name={displayName}
          size={80}
        />
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {errors.global && (
          <div className={styles.globalError}>⚠️ {errors.global}</div>
        )}

        {/* Username */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ep-username">Username</label>
          <input
            id="ep-username"
            className={[styles.input, errors.username ? styles.inputError : ''].join(' ')}
            placeholder="e.g. john_doe"
            value={form.username}
            onChange={(e) => set('username', e.target.value)}
          />
          {errors.username && <span className={styles.error}>{errors.username}</span>}
        </div>

        {/* Bio */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ep-bio">
            Bio
            <span className={styles.labelHint}> (max 500 chars)</span>
          </label>
          <textarea
            id="ep-bio"
            className={[styles.textarea, errors.bio ? styles.inputError : ''].join(' ')}
            placeholder="Tell buyers about yourself…"
            rows={4}
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
          />
          <span style={{ fontSize: 11, color: 'var(--gray-2)', textAlign: 'right' }}>
            {form.bio.length}/500
          </span>
          {errors.bio && <span className={styles.error}>{errors.bio}</span>}
        </div>

        {/* Avatar URL */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ep-avatar">
            Avatar URL
            <span className={styles.labelHint}> (optional)</span>
          </label>
          <input
            id="ep-avatar"
            className={[styles.input, errors.avatar ? styles.inputError : ''].join(' ')}
            placeholder="https://example.com/avatar.jpg"
            value={form.avatar}
            onChange={(e) => set('avatar', e.target.value)}
          />
          {errors.avatar && <span className={styles.error}>{errors.avatar}</span>}
        </div>

        <div className={styles.submitWrap}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
