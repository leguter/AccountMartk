import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore, useSellerStore, useOrderStore } from '../store';
import { Button, StarsPrice, EmptyState } from '../components/ui';
import { ProductCard } from '../components/marketplace/ProductCard';
import styles from './ProfileBalancePage.module.css';

export default function ProfileBalancePage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const userId = user?.id ?? 'demo_user';

  const getBalance = useSellerStore((s) => s.getBalance);
  const lots = useSellerStore((s) => s.lots);
  const withdraw = useSellerStore((s) => s.withdraw);

  const orders = useOrderStore((s) => s.orders);

  const balance = getBalance(userId);

  // Pending = sum of all paid-but-not-confirmed orders where I'm the seller
  const pendingAmount = orders
    .filter((o) => String(o.sellerId) === String(userId) && o.status === 'paid')
    .reduce((acc, o) => acc + o.amount, 0);

  const activeOrders = orders.filter(
    (o) => String(o.sellerId) === String(userId) && o.status !== 'completed'
  );

  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState(null);

  const handleWithdraw = async () => {
    if (balance.available <= 0) return;
    setWithdrawing(true);
    await new Promise((r) => setTimeout(r, 1000));
    const ok = withdraw(userId, balance.available);
    setWithdrawing(false);
    setWithdrawMsg(
      ok
        ? `✅ Withdrawal of ${balance.available} Stars initiated! (Simulated)`
        : '❌ Insufficient balance'
    );
    setTimeout(() => setWithdrawMsg(null), 4000);
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
            <StarsPrice amount={balance.available} size="lg" />
          </div>
          {pendingAmount > 0 && (
            <div className={styles.pendingRow}>
              <span className={styles.pendingDot} />
              <span className={styles.pendingText}>
                <StarsPrice amount={pendingAmount} size="sm" /> pending (in escrow)
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
              disabled={balance.available <= 0}
              fullWidth
            >
              Withdraw Stars
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => alert('Support will be implemented later.')}
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

          {activeOrders.length === 0 ? (
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
                    <div className={styles.orderTitle}>{order.lotTitle}</div>
                    <div className={styles.orderDate}>{formatDate(order.createdAt)}</div>
                  </div>
                  <div className={styles.orderCardRight}>
                    <StarsPrice amount={order.amount} size="sm" />
                    <span
                      className={styles.orderStatus}
                      style={{ color: statusMap[order.status]?.color }}
                    >
                      {statusMap[order.status]?.label}
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

          {lots.length === 0 ? (
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
