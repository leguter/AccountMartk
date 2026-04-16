import { useBalance, useMyLots, usePurchaseHistory } from '../hooks';
import { balanceService } from '../services/api';
import { Button, StarsPrice, EmptyState, Skeleton } from '../components/ui';
import { ProductCard } from '../components/marketplace/ProductCard';
import styles from './ProfileBalancePage.module.css';

export default function ProfileBalancePage() {
  const navigate = useNavigate();
  const { balance, pendingBalance, loading: balanceLoading, refresh: refreshBalance } = useBalance();
  const { data: lotsData, loading: lotsLoading } = useMyLots();
  const lots = lotsData || [];

  const { data: ordersData, loading: ordersLoading } = usePurchaseHistory();
  const activeOrders = ordersData ? ordersData.filter(o => o.status !== 'completed') : [];

  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState(null);

  const handleWithdraw = async () => {
    if (balance <= 0) return;
    setWithdrawing(true);
    try {
      await balanceService.withdraw(balance);
      setWithdrawMsg(`✅ Withdrawal of ${balance} Stars initiated!`);
      refreshBalance();
    } catch (err) {
      setWithdrawMsg(`❌ Error: ${err.message}`);
    } finally {
      setWithdrawing(false);
      setTimeout(() => setWithdrawMsg(null), 4000);
    }
  };

  const handleBack = () => navigate(-1);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const statusMap = {
    pending: { label: 'Awaiting payment', color: 'var(--yellow)' },
    paid: { label: 'In escrow', color: 'var(--info)' },
    completed: { label: 'Completed', color: 'var(--success)' },
  };

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button className={styles.backBtn} onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.topBarTitle}>Seller Dashboard</span>
      </header>

      <div className={styles.content}>
        {/* Balance card */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceGlow} />
          <div className={styles.balanceLabel}>Available Balance</div>
          <div className={styles.balanceAmount}>
            {balanceLoading ? <Skeleton width={120} height={40} /> : <StarsPrice amount={balance} size="lg" />}
          </div>
          {pendingBalance > 0 && (
            <div className={styles.pendingRow}>
              <span className={styles.pendingDot} />
              <span className={styles.pendingText}>
                <StarsPrice amount={pendingBalance} size="sm" /> pending (in escrow)
              </span>
            </div>
          )}

          {withdrawMsg && (
            <div className={styles.withdrawMsg}>{withdrawMsg}</div>
          )}

          <div className={styles.balanceActions}>
            <Button
              variant="primary"
              size="md"
              onClick={handleWithdraw}
              loading={withdrawing}
              disabled={balance <= 0 || balanceLoading}
              fullWidth
            >
              Withdraw Stars
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => alert('Support via @support')}
              fullWidth
            >
              💬 Support
            </Button>
          </div>
        </div>

        {/* Active orders */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Active Orders</h2>
            {activeOrders.length > 0 && (
              <span className={styles.sectionBadge}>{activeOrders.length}</span>
            )}
          </div>

          {ordersLoading ? (
            <Skeleton height={80} />
          ) : activeOrders.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No active orders"
              description="Active orders will appear here when buyers purchase your listings."
            />
          ) : (
            <div className={styles.ordersList}>
              {activeOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/chat/${order.id}`}
                  className={styles.orderCard}
                >
                  <div className={styles.orderCardLeft}>
                    <div className={styles.orderTitle}>{order.productTitle || 'Lot'}</div>
                    <div className={styles.orderDate}>{formatDate(order.date)}</div>
                  </div>
                  <div className={styles.orderCardRight}>
                    <StarsPrice amount={order.price} size="sm" />
                    <span
                      className={styles.orderStatus}
                    >
                      {order.status === 'pending_confirmation' ? 'In escrow' : order.status}
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
            <h2 className={styles.sectionTitle}>My Listings</h2>
            <Link to="/create-lot" className={styles.createBtn}>+ New</Link>
          </div>

          {lotsLoading ? (
            <div className={styles.lotsGrid}>
              {[1, 2].map((i) => <Skeleton key={i} height={200} radius="16px" />)}
            </div>
          ) : lots.length === 0 ? (
            <EmptyState
              icon="🏷️"
              title="No listings yet"
              description="Create your first listing to start selling."
              action={
                <Button variant="primary" size="sm" onClick={() => navigate('/create-lot')}>
                  Create Listing
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
