type Props = {
  size?: number;
  className?: string;
};

export function GhostMark({ size = 36, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M32 8c-11.4 0-20.5 9.2-20.5 20.6V52l6.2-4.6 6.3 4.6 6-4.6 6 4.6 6.3-4.6 6.2 4.6V28.6C52.5 17.2 43.4 8 32 8z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <circle cx="24" cy="28" r="3.4" fill="currentColor" />
      <circle cx="40" cy="28" r="3.4" fill="currentColor" />
      <ellipse cx="32" cy="37.5" rx="4.4" ry="5.2" fill="currentColor" />
    </svg>
  );
}
