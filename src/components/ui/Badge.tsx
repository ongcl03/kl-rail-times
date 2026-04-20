export function Badge({
  label,
  color,
  textColor = "#FFFFFF",
}: {
  label: string;
  color: string;
  textColor?: string;
}) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
      style={{ backgroundColor: color, color: textColor }}
    >
      {label}
    </span>
  );
}
