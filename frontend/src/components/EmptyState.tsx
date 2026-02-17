/**
 * Заглушка для пустых списков
 */
interface Props {
  message?: string;
  icon?: string;
}

export function EmptyState({ message = 'Нет данных', icon = '📋' }: Props) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icon}</span>
      <p>{message}</p>
    </div>
  );
}
