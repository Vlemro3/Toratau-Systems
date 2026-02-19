/**
 * Guard-компонент подписки.
 *
 * Если подписка expired или blocked — показывает overlay,
 * блокирующий доступ к порталу. Разрешает только страницу
 * оплаты (/billing) и выход из системы.
 */
import { useSubscription } from './SubscriptionContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { BILLING_CONFIG, formatPrice } from './billingConfig';

const ALLOWED_PATHS = ['/billing', '/login'];

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { subscription, accessAllowed, loading } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading || !subscription) return <>{children}</>;

  const isAllowedPath = ALLOWED_PATHS.some((p) => location.pathname.startsWith(p));

  if (!accessAllowed && !isAllowedPath) {
    const statusLabels: Record<string, string> = {
      expired: 'Срок подписки истёк',
      blocked: 'Подписка заблокирована',
    };

    return (
      <div className="subscription-overlay">
        <div className="subscription-overlay__card">
          <div className="subscription-overlay__icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h2 className="subscription-overlay__title">
            {statusLabels[subscription.status] || 'Доступ ограничен'}
          </h2>

          {subscription.status === 'blocked' && subscription.blockedReason && (
            <p className="subscription-overlay__reason">
              Причина: {subscription.blockedReason}
            </p>
          )}

          <p className="subscription-overlay__text">
            Для продолжения работы с порталом необходимо оформить подписку.
          </p>

          <div className="subscription-overlay__plans">
            <div className="subscription-overlay__plan">
              <span className="subscription-overlay__plan-name">Месяц</span>
              <span className="subscription-overlay__plan-price">
                {formatPrice(BILLING_CONFIG.plans.monthly.price)}
              </span>
            </div>
            <div className="subscription-overlay__plan subscription-overlay__plan--accent">
              <span className="subscription-overlay__plan-name">
                Год <span className="subscription-overlay__plan-badge">−{BILLING_CONFIG.plans.yearly.discountPercent}%</span>
              </span>
              <span className="subscription-overlay__plan-price">
                {formatPrice(BILLING_CONFIG.plans.yearly.price)}
              </span>
            </div>
          </div>

          <button
            className="btn btn--primary btn--lg subscription-overlay__btn"
            onClick={() => navigate('/billing')}
          >
            Перейти к оплате
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
