export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="7" fill="#0F172A" />
      <path d="M8 22V13l8-4 8 4v9" stroke="#155E95" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="2.4" fill="#0F766E" />
      <path d="M16 9v5M16 18v2M11 16h1.5M19.5 16H21" stroke="#D97706" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function LogoWithText({ size = 30 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2 font-semibold text-brand-dark">
      <Logo size={size} />
      <span className="text-lg">BuildScience</span>
    </span>
  );
}
