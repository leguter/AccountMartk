import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const SUBSCRIBERS_REQUIRED_CATS = ['telegram', 'youtube'];
const COMMISSION_RATE = 0.10;

const INITIAL_FORM = {
  title: '',
  description: '',
  price: '',
  category: 'telegram',
  subscribersCount: '',
  stockCount: '1',
  country: '',
  age: '',
  engagementRate: '',
};

export default function CreateLotPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingLot, setLoadingLot] = useState(!!editId);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!editId) return;
    setLoadingLot(true);
    productService
      .getById(editId)
      .then((res) => {
        const lot = res.data;
        setForm((f) => ({
          ...f,
          title: lot.title ?? '',
          description: lot.description ?? '',
          price: String(lot.price ?? ''),
          category: lot.category ?? 'telegram',
          subscribersCount: lot.subscribersCount ? String(lot.subscribersCount) : '',
          stockCount: lot.stockCount ? String(lot.stockCount) : '1',
        }));
      })
      .catch((err) => setErrors({ global: err.message }))
      .finally(() => setLoadingLot(false));
  }, [editId]);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined, global: undefined }));
  };

  const needsSubscribers = SUBSCRIBERS_REQUIRED_CATS.includes(form.category);

  // Commission preview
  const priceNum = Number(form.price);
  const isValidPrice = form.price && !isNaN(priceNum) && priceNum > 0;
  const stockNum = Math.max(1, Number(form.stockCount) || 1);
  const buyerPays = isValidPrice ? priceNum : 0;
  const sellerReceives = isValidPrice ? Math.floor(priceNum * (1 - COMMISSION_RATE)) : 0;
  const commission = buyerPays - sellerReceives;

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.price || isNaN(priceNum) || priceNum <= 0) e.price = 'Enter a valid price';
    if (!form.category) e.category = 'Select a category';
    if (needsSubscribers) {
      const subs = Number(form.subscribersCount);
      if (!form.subscribersCount || isNaN(subs) || subs <= 0)
        e.subscribersCount = `Subscribers count is required for ${form.category} listings`;
    }
    const stock = Number(form.stockCount);
    if (!form.stockCount || isNaN(stock) || stock < 1 || stock > 100)
      e.stockCount = 'Enter a valid number of accounts (1-100)';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setIsSubmitting(true);
    const lotData = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      stockCount: Number(form.stockCount),
      ...(form.subscribersCount ? { subscribersCount: Number(form.subscribersCount) } : {}),
    };

    try {
      if (editId) {
        await productService.updateLot(editId, lotData);
      } else {
        await productService.createLot(lotData);
      }
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      const msg = err.message || 'Something went wrong';
      const isProfanity = msg.toLowerCase().includes('inappropriate') || msg.toLowerCase().includes('profanity');
      setErrors({
        global: isProfanity
          ? 'Your listing contains prohibited words. Please revise the title or description.'
          : msg,
      });
      setIsSubmitting(false);
    }
  };

  if (loadingLot) {
    return <div className={styles.page}><div className={styles.loadingWrap}>Loading lot…</div></div>;
  }

  if (success) {
    return (
      <div className={styles.successScreen}>
        <div className={styles.successIcon}>{editId ? '✅' : '🎉'}</div>
        <h2 className={styles.successTitle}>{editId ? 'Lot Updated!' : 'Lot Created!'}</h2>
        <p className={styles.successSub}>Redirecting to marketplace…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.topBarTitle}>{editId ? 'Edit Listing' : 'Create Listing'}</span>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {errors.global && <div className={styles.globalError}>⚠️ {errors.global}</div>}

        {/* Category */}
        <div className={styles.field}>
          <label className={styles.label}>Category</label>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={[styles.catChip, form.category === cat.value ? styles.catChipActive : ''].join(' ')}
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
          <input id="lot-title" className={[styles.input, errors.title ? styles.inputError : ''].join(' ')}
            placeholder="e.g. Crypto News Channel — 50k subs"
            value={form.title} onChange={(e) => set('title', e.target.value)} />
          {errors.title && <span className={styles.error}>{errors.title}</span>}
        </div>

        {/* Description */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="lot-desc">Description</label>
          <textarea id="lot-desc" className={[styles.textarea, errors.description ? styles.inputError : ''].join(' ')}
            placeholder="Describe your account in detail…" rows={4}
            value={form.description} onChange={(e) => set('description', e.target.value)} />
          {errors.description && <span className={styles.error}>{errors.description}</span>}
        </div>

        {/* Price + Commission Preview */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="lot-price">
            Price per account
            <span className={styles.labelHint}> (Telegram Stars)</span>
          </label>
          <div className={styles.priceWrap}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--yellow)', flexShrink: 0 }}>
              <path d="M12 2L9.19 8.63L2 9.24L7 13.97L5.82 21L12 17.27L18.18 21L17 13.97L22 9.24L14.81 8.63L12 2Z"/>
            </svg>
            <input id="lot-price" className={[styles.input, styles.priceInput, errors.price ? styles.inputError : ''].join(' ')}
              type="number" min="1" placeholder="e.g. 1200"
              value={form.price} onChange={(e) => set('price', e.target.value)} />
          </div>
          {errors.price && <span className={styles.error}>{errors.price}</span>}

          {/* Commission breakdown */}
          {isValidPrice && (
            <div className={styles.commissionBox}>
              <div className={styles.commissionRow}>
                <span className={styles.commissionLabel}>🛒 Buyer pays</span>
                <span className={styles.commissionValue}>⭐ {buyerPays.toLocaleString()}</span>
              </div>
              <div className={styles.commissionRow}>
                <span className={styles.commissionLabel}>💰 You receive (after 10% fee)</span>
                <span className={styles.commissionValue + ' ' + styles.commissionGreen}>⭐ {sellerReceives.toLocaleString()}</span>
              </div>
              <div className={styles.commissionRow}>
                <span className={styles.commissionLabel}>🏦 Platform fee</span>
                <span className={styles.commissionValue + ' ' + styles.commissionGray}>⭐ {commission}</span>
              </div>
            </div>
          )}
        </div>

        {/* Number of accounts available */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="lot-stock">
            Number of accounts available
            <span className={styles.labelHint}> (required)</span>
          </label>
          <input id="lot-stock"
            className={[styles.input, errors.stockCount ? styles.inputError : ''].join(' ')}
            type="number" min="1" max="100" placeholder="e.g. 5"
            value={form.stockCount} onChange={(e) => set('stockCount', e.target.value)} />
          {errors.stockCount && <span className={styles.error}>{errors.stockCount}</span>}
          <span className={styles.fieldHint}>
            Buyers can purchase 1 to {stockNum} account{stockNum > 1 ? 's' : ''} from this listing
          </span>
        </div>

        {/* Subscribers count — required for Telegram / YouTube */}
        {needsSubscribers && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="lot-subs">
              Subscribers count
              <span className={styles.labelHint}> (required)</span>
            </label>
            <input id="lot-subs"
              className={[styles.input, errors.subscribersCount ? styles.inputError : ''].join(' ')}
              type="number" min="1" placeholder="e.g. 52000"
              value={form.subscribersCount} onChange={(e) => set('subscribersCount', e.target.value)} />
            {errors.subscribersCount && <span className={styles.error}>{errors.subscribersCount}</span>}
          </div>
        )}

        {/* Optional account details — no Followers (duplicate of subscribers) */}
        {!editId && (
          <>
            <div className={styles.sectionLabel}>Account Details (optional)</div>
            <div className={styles.rowFields}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="lot-age">Account Age</label>
                <input id="lot-age" className={styles.input}
                  placeholder="e.g. 2 years"
                  value={form.age} onChange={(e) => set('age', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="lot-country">Country</label>
                <input id="lot-country" className={styles.input}
                  placeholder="e.g. USA"
                  value={form.country} onChange={(e) => set('country', e.target.value)} />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="lot-er">Engagement Rate</label>
              <input id="lot-er" className={styles.input}
                placeholder="e.g. 4.5%"
                value={form.engagementRate} onChange={(e) => set('engagementRate', e.target.value)} />
            </div>
          </>
        )}

        <div className={styles.submitWrap}>
          <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
            {editId ? 'Save Changes' : 'Publish Listing'}
          </Button>
        </div>
      </form>
    </div>
  );
}
