import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import styles from './RulesPage.module.css';

const SECTIONS = [
  {
    id: 'general',
    icon: '📜',
    title: 'General Rules',
    items: [
      'All trades are final once a buyer confirms receipt.',
      'Both parties must communicate respectfully in the chat.',
      'False listings or misrepresented accounts will be removed.',
      'AccountMark is not responsible for changes to accounts after delivery.',
      'Use of the platform constitutes acceptance of these rules.',
    ],
  },
  {
    id: 'buyer',
    icon: '🛡️',
    title: 'Buyer Protection',
    items: [
      'Payment is held in escrow until you confirm delivery.',
      'You have 7 days after payment to confirm or raise a dispute.',
      'If no confirmation, the order is auto-completed after 7 days.',
      'Raise a dispute in chat — our support team will review within 24 h.',
      'Refunds are only issued if the seller fails to deliver.',
    ],
  },
  {
    id: 'seller',
    icon: '🏪',
    title: 'Seller Rules',
    items: [
      'Listings must be accurate — subscribers, age, and engagement data.',
      'Do not sell accounts that violate their platform\'s Terms of Service.',
      'Deliver access credentials via the secure chat only.',
      'Do not attempt to reclaim an account after sale.',
      'Repeated violations may result in a permanent ban.',
    ],
  },
  {
    id: 'withdraw',
    icon: '💸',
    title: 'Withdraw Rules',
    isHighlight: true,
    items: null, // rendered separately
    custom: (
      <div key="withdraw-custom">
        <p className={styles.withdrawIntro}>
          Funds are held in escrow after order completion to protect both parties.
          Your withdraw options depend on how much time has passed since the order was completed.
        </p>

        <div className={styles.withdrawCards}>
          <div className={`${styles.withdrawCard} ${styles.locked}`}>
            <div className={styles.withdrawCardIcon}>🔒</div>
            <div className={styles.withdrawCardTitle}>Locked</div>
            <div className={styles.withdrawCardPeriod}>0 – 2 days</div>
            <div className={styles.withdrawCardDesc}>
              Funds are frozen. Withdrawal is <strong>not available</strong> during this period.
            </div>
          </div>

          <div className={`${styles.withdrawCard} ${styles.fast}`}>
            <div className={styles.withdrawCardIcon}>⚡</div>
            <div className={styles.withdrawCardTitle}>Fast Withdraw</div>
            <div className={styles.withdrawCardPeriod}>2 – 20 days</div>
            <div className={styles.withdrawCardFee}>10% fee</div>
            <div className={styles.withdrawCardDesc}>
              Available for immediate processing.<br />
              <strong>Example:</strong> 100 ⭐ → you receive 90 ⭐, 10 ⭐ platform fee.
            </div>
          </div>

          <div className={`${styles.withdrawCard} ${styles.free}`}>
            <div className={styles.withdrawCardIcon}>🆓</div>
            <div className={styles.withdrawCardTitle}>Free Withdraw</div>
            <div className={styles.withdrawCardPeriod}>20+ days</div>
            <div className={styles.withdrawCardFee}>No fee</div>
            <div className={styles.withdrawCardDesc}>
              Full amount transferred to your Telegram Stars balance.<br />
              <strong>Example:</strong> 100 ⭐ → you receive 100 ⭐.
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'disputes',
    icon: '⚖️',
    title: 'Disputes & Support',
    items: [
      'Open a dispute via the order chat by messaging @support.',
      'Provide evidence: screenshots, access logs, or other proof.',
      'Decisions made by AccountMark support are final.',
      'Bad-faith disputes may result in account suspension.',
    ],
  },
];

export default function RulesPage({ acceptMode = false, onAccept }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(acceptMode ? null : 'general');

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        {!acceptMode && (
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <span className={styles.topBarTitle}>
          {acceptMode ? `📋 ${t('rules_title')}` : t('rules_title')}
        </span>
      </header>

      {acceptMode && (
        <div className={styles.acceptBanner}>
          {t('rules_accept_banner')}
        </div>
      )}

      <div className={styles.content}>
        {SECTIONS.map((section) => (
          <div
            key={section.id}
            className={[
              styles.section,
              section.isHighlight ? styles.sectionHighlight : '',
            ].join(' ')}
          >
            <button
              className={styles.sectionHeader}
              onClick={() => setExpanded(expanded === section.id ? null : section.id)}
            >
              <span className={styles.sectionIcon}>{section.icon}</span>
              <span className={styles.sectionTitle}>{section.title}</span>
              <svg
                className={[styles.chevron, expanded === section.id ? styles.chevronOpen : ''].join(' ')}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {expanded === section.id && (
              <div className={styles.sectionBody}>
                {section.custom
                  ? section.custom
                  : section.items.map((item, i) => (
                      <div key={i} className={styles.ruleItem}>
                        <span className={styles.ruleDot} />
                        <span>{item}</span>
                      </div>
                    ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {acceptMode && (
        <div className={styles.acceptFooter}>
          <button className={styles.acceptBtn} onClick={onAccept}>
            {t('rules_accept_btn')}
          </button>
        </div>
      )}
    </div>
  );
}
