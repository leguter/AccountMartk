import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import styles from './CreateLotPage.module.css';
import { productService } from '../services/api';

const CATEGORIES = [
  { value: 'telegram', label: '✈️ Telegram' },
  { value: 'instagram', label: '📸 Instagram' },
  { value: 'youtube', label: '▶️ YouTube' },
  { value: 'tiktok', label: '🎵 TikTok' },
  { value: 'phone', label: '📱 Phone Number' },
];

const INITIAL_FORM = {
  title: '',
  description: '',
  price: '',
  category: 'telegram',
  followers: '',
  country: '',
  age: '',
  engagementRate: '',
};

export default function CreateLotPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    const price = Number(form.price);
    if (!form.price || isNaN(price) || price <= 0) e.price = 'Enter a valid price';
    if (!form.category) e.category = 'Select a category';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);

    try {
      const lotData = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        // Backend handles followers/stats in description or future expansion
      };

      await productService.createLot(lotData);
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error('Create lot failed:', err);
      setErrors({ global: err.message });
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate(-1);

  if (success) {
    return (
      <div className={styles.successScreen}>
        <div className={styles.successIcon}>🎉</div>
        <h2 className={styles.successTitle}>Lot Created!</h2>
        <p className={styles.successSub}>Redirecting to marketplace…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button className={styles.backBtn} onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.topBarTitle}>Create Listing</span>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* Category */}
        <div className={styles.field}>
          <label className={styles.label}>Category</label>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={[
                  styles.catChip,
                  form.category === cat.value ? styles.catChipActive : '',
                ].join(' ')}
                onClick={() => set('category', cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {errors.category && <span className={styles.error}>{errors.category}</span>}
        </div>

        {/* Title */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="lot-title">Title</label>
          <input
            id="lot-title"
            className={[styles.input, errors.title ? styles.inputError : ''].join(' ')}
            placeholder="e.g. Crypto News Channel — 50k subs"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
          {errors.title && <span className={styles.error}>{errors.title}</span>}
        </div>

        {/* Description */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="lot-desc">Description</label>
          <textarea
            id="lot-desc"
            className={[styles.textarea, errors.description ? styles.inputError : ''].join(' ')}
            placeholder="Describe your account in detail…"
            rows={4}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
          {errors.description && <span className={styles.error}>{errors.description}</span>}
        </div>

        {/* Price */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="lot-price">
            Price
            <span className={styles.labelHint}> (Telegram Stars)</span>
          </label>
          <div className={styles.priceWrap}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--yellow)', flexShrink: 0 }}>
              <path d="M12 2L9.19 8.63L2 9.24L7 13.97L5.82 21L12 17.27L18.18 21L17 13.97L22 9.24L14.81 8.63L12 2Z"/>
            </svg>
            <input
              id="lot-price"
              className={[styles.input, styles.priceInput, errors.price ? styles.inputError : ''].join(' ')}
              type="number"
              min="1"
              placeholder="e.g. 1200"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
            />
          </div>
          {errors.price && <span className={styles.error}>{errors.price}</span>}
        </div>

        {/* Optional stats */}
        <div className={styles.sectionLabel}>Account Details (optional)</div>

        <div className={styles.rowFields}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="lot-followers">Followers</label>
            <input
              id="lot-followers"
              className={styles.input}
              type="number"
              placeholder="e.g. 52000"
              value={form.followers}
              onChange={(e) => set('followers', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="lot-age">Account Age</label>
            <input
              id="lot-age"
              className={styles.input}
              placeholder="e.g. 2 years"
              value={form.age}
              onChange={(e) => set('age', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.rowFields}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="lot-er">Engagement Rate</label>
            <input
              id="lot-er"
              className={styles.input}
              placeholder="e.g. 4.5%"
              value={form.engagementRate}
              onChange={(e) => set('engagementRate', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="lot-country">Country</label>
            <input
              id="lot-country"
              className={styles.input}
              placeholder="e.g. USA"
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.submitWrap}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
          >
            Publish Listing
          </Button>
        </div>
      </form>
    </div>
  );
}
