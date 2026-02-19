/**
 * Индикатор риска (зелёный / жёлтый / красный) по балансу.
 * > 500 000 руб — зелёный, 50 000–500 000 — жёлтый, < 50 000 или отрицательный — красный.
 */
interface Props {
  balance: number;
}

const LIMIT_GREEN = 500_000;
const LIMIT_YELLOW = 50_000;

export function RiskIndicator({ balance }: Props) {
  let className = 'risk-indicator--green';
  let title = 'Баланс более 500 000 руб';

  if (balance < LIMIT_YELLOW || balance < 0) {
    className = 'risk-indicator--red';
    title = 'Баланс менее 50 000 руб или отрицательный';
  } else if (balance < LIMIT_GREEN) {
    className = 'risk-indicator--yellow';
    title = 'Баланс от 50 000 до 500 000 руб';
  }

  return (
    <span className={`risk-indicator ${className}`} title={title}>●</span>
  );
}
