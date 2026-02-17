/**
 * Цветной бейдж статуса (универсальный)
 */
interface Props {
  label: string;
  color: string;
}

export function StatusBadge({ label, color }: Props) {
  return (
    <span
      className="status-badge"
      style={{
        backgroundColor: color + '18',
        color: color,
        borderColor: color + '40',
      }}
    >
      {label}
    </span>
  );
}
