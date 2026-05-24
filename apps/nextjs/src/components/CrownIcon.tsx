interface CrownIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CrownIcon({
  size = 20,
  color = "var(--gold)",
  className,
}: CrownIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
      aria-hidden="true"
    >
      {/* Band at the base */}
      <rect x="2" y="16" width="20" height="4" rx="0.5" />
      {/* 5-point crown: M=start, L=line, Z=close path */}
      <path d="M 2 16 L 6 6 L 9 12 L 12 3 L 15 12 L 18 6 L 22 16 Z" />
    </svg>
  );
}

export default CrownIcon;
