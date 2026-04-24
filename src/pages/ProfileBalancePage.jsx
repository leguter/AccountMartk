import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBalance, useMyLots, usePurchaseHistory } from '../hooks';
import { balanceService } from '../services/api';
import { Button, StarsPrice, EmptyState, Skeleton } from '../components/ui';
import { ProductCard } from '../components/marketplace/ProductCard';
import { useTranslation } from '../i18n';
import styles from './ProfileBalancePage.module.css';

const FAST_FEE = 0.10;

export default function ProfileBalancePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { balance, pendingBalance, loading: balanceLoading, refresh: refreshBalance } = useBalance();
  const { data: lotsData, loading: lotsLoading } = useMyLots();
  const lots = Array.isArray(lotsData) ? lotsData : [];

  const { data: ordersData, loading: ordersLoading } = usePurchaseHistory();
  const rawOrders = Array.isArray(ordersData) ? ordersData : [];
  const activeOrders = rawOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

  // Withdraw state
  const [withdrawing, setWithdrawing]       = useState(false);
  const [withdrawMsg, setWithdrawMsg]       = useState(null);
  const [showOptions, setShowOptions]       = useState(false);
  const [eligibility, setEligibility]       = useState(null);
  const [eligLoading, setEligLoading]       = useState(false);

  const loadEligibility = async () => {
    setEligLoading(true);
    try {
      const e = await balanceService.getWithdrawEligibility();
      setEligibility(e);
    } catch {
      setEligibility(null);
    } finally {
      setEligLoading(false);
    }
  };

  const handleWithdrawClick = () => {
    if (balance <= 0) return;
    setShowOptions(true);
    loadEligibility();
  };

  const handleWithdraw = async (mode) => {
    setWithdrawing(true);
    setShowOptions(false);
    try {
      const res = await balanceService.withdraw(balance, mode);
      const { netAmount, fee } = res;
      if (fee > 0) {
        setWithdrawMsg(`✅ ${t('withdraw_stars')}: ${netAmount} ⭐  (${t('fee')}: ${fee} ⭐)`);
      } else {
        setWithdrawMsg(`✅ ${netAmount} ⭐  — ${t('no_fee')}!`);
      }
      refreshBalance();
    } catch (err) {
      setWithdrawMsg(`❌ ${err.message}`);
    } finally {
      setWithdrawing(false);
      setTimeout(() => setWithdrawMsg(null), 5000);
    }
  };

  const handleBack = () => navigate(-1);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const fastNet  = balance - Math.floor(balance * FAST_FEE);
  const fastFee  = Math.floor(balance * FAST_FEE);

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button className={styles.backBtn} onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.topBarTitle}>{t('seller_dashboard')}</span>
      </header>

      <div className={styles.content}>
        {/* Balance card */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceGlow} />
          <div className={styles.balanceLabel}>{t('available_balance')}</div>
          <div className={styles.balanceAmount}>
            {balanceLoading ? <Skeleton width={120} height={40} /> : <StarsPrice amount={balance} size="lg" />}
          </div>
          {pendingBalance > 0 && (
            <div className={styles.pendingRow}>
              <span className={styles.pendingDot} />
              <span className={styles.pendingText}>
                <StarsPrice amount={pendingBalance} size="sm" /> {t('pending_escrow')}
              </span>
            </div>
          )}

          {withdrawMsg && (
            <div className={styles.withdrawMsg}>{withdrawMsg}</div>
          )}

          {/* Withdraw option picker */}
          {showOptions && (
            <div className={styles.withdrawOptions}>
              <div className={styles.withdrawOptionsTitle}>{t('choose_withdraw')}</div>

              {eligLoading ? (
                <Skeleton height={48} radius="10px" />
              ) : eligibility && !eligibility.eligible ? (
                <div className={styles.withdrawLocked}>
                  🔒 {t('funds_locked')} —{' '}
                  <strong>{Math.ceil(2 - eligibility.daysElapsed)} {t('days')}</strong>
                </div>
              ) : (
                <>
                  {/* Fast — 10 % fee */}
                  <button
                    className={styles.withdrawOption}
                    onClick={() => handleWithdraw('fast')}
                    disabled={!eligibility?.eligible}
                  >
                    <div className={styles.withdrawOptionLeft}>
                      <span className={styles.withdrawOptionTitle}>⚡ {t('fast_withdraw')}</span>
                      <span className={styles.withdrawOptionSub}>{t('fast_withdraw_sub')}</span>
                    </div>
                    <div className={styles.withdrawOptionRight}>
                      <span className={styles.withdrawOptionAmount}>
                        <StarsPrice amount={fastNet} size="sm" />
                      </span>
                      <span className={styles.withdrawOptionFee}>−{fastFee} ⭐</span>
                    </div>
                  </button>

                  {/* Free — 20 days */}
                  <button
                    className={styles.withdrawOption}
                    onClick={() => handleWithdraw('free')}
                    disabled={eligibility?.mode !== 'free'}
                    style={{ opacity: eligibility?.mode !== 'free' ? 0.45 : 1 }}
                  >
                    <div className={styles.withdrawOptionLeft}>
                      <span className={styles.withdrawOptionTitle}>🆓 {t('free_withdraw')}</span>
                      <span className={styles.withdrawOptionSub}>
                        {eligibility?.mode === 'free'
                          ? t('free_withdraw_available')
                          : t('free_withdraw_days', { n: Math.ceil(20 - (eligibility?.daysElapsed ?? 0)) })}
                      </span>
                    </div>
                    <div className={styles.withdrawOptionRight}>
                      <span className={styles.withdrawOptionAmount}>
                        <StarsPrice amount={balance} size="sm" />
                      </span>
                      <span className={styles.withdrawOptionFee}>{t('no_fee')}</span>
                    </div>
                  </button>
                </>
              )}

              <button className={styles.withdrawCancel} onClick={() => setShowOptions(false)}>
                {t('cancel')}
              </button>
            </div>
          )}

          {!showOptions && (
            <div className={styles.balanceActions}>
              <Button
                variant="primary"
                size="md"
                onClick={handleWithdrawClick}
                loading={withdrawing}
                disabled={balance <= 0 || balanceLoading}
                fullWidth
              >
                {t('withdraw_stars')}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => navigate('/rules')}
                fullWidth
              >
                {t('withdraw_rules')}
              </Button>
            </div>
          )}
        </div>

        {/* Active orders */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('active_orders')}</h2>
            {activeOrders.length > 0 && (
              <span className={styles.sectionBadge}>{activeOrders.length}</span>
            )}
          </div>

          {ordersLoading ? (
            <Skeleton height={80} />
          ) : activeOrders.length === 0 ? (
            <EmptyState
              icon="📦"
              title={t('no_active_orders')}
              description={t('no_active_orders_desc')}
            />
          ) : (
            <div className={styles.ordersList}>
              {activeOrders.map((order) => (
                <Link key={order.id} to={`/chat/${order.id}`} className={styles.orderCard}>
                  <div className={styles.orderCardLeft}>
                    <div className={styles.orderTitle}>{order.lot?.title || 'Order'}</div>
                    <div className={styles.orderDate}>{formatDate(order.createdAt)}</div>
                  </div>
                  <div className={styles.orderCardRight}>
                    <StarsPrice amount={order.amount} size="sm" />
                    <span className={styles.orderStatus}>
                      {order.status === 'paid' ? t('in_escrow') : order.status}
                    </span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Lots */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('my_listings')}</h2>
            <Link to="/create-lot" className={styles.createBtn}>{t('new')}</Link>
          </div>

          {lotsLoading ? (
            <div className={styles.lotsGrid}>
              {[1, 2].map((i) => <Skeleton key={i} height={200} radius="16px" />)}
            </div>
          ) : lots.length === 0 ? (
            <EmptyState
              icon="🏷️"
              title={t('no_listings_title')}
              description={t('no_listings_desc')}
              action={
                <Button variant="primary" size="sm" onClick={() => navigate('/create-lot')}>
                  {t('create_listing')}
                </Button>
              }
            />
          ) : (
            <div className={styles.lotsGrid}>
              {lots.map((lot, i) => (
                <ProductCard key={lot.id} product={lot} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
