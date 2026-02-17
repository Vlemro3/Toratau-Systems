/**
 * Индикатор риска (зелёный / жёлтый / красный).
 * Основан на отклонении от плана.
 */
interface Props {
  deviation: number;
  plannedCost: number;
}

export function RiskIndicator({ deviation, plannedCost }: Props) {
  if (plannedCost === 0) {
    return <span className="risk-indicator risk-indicator--gray" title="Нет плана">●</span>;
  }

  const ratio = deviation / plannedCost;

  let className = 'risk-indicator--green';
  let title = 'В рамках плана';

  if (ratio > 0.1) {
    className = 'risk-indicator--red';
    title = 'Превышение плана > 10%';
  } else if (ratio > 0.0) {
    className = 'risk-indicator--yellow';
    title = 'Есть отклонение от плана';
  }

  return (
    <span className={`risk-indicator ${className}`} title={title}>●</span>
  );
}
