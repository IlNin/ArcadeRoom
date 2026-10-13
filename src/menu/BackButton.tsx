interface BackButtonProps {
  label: string;
  onClick(): void;
  showEscHint?: boolean;
}

export function BackButton({ label, onClick, showEscHint }: BackButtonProps) {
  return (
    <button className="back-button" onClick={onClick}>
      <span className="back-button__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 5 8 12l7 7" />
        </svg>
      </span>
      <span className="back-button__label">{label}</span>
      {showEscHint && (
        <kbd className="back-button__key" aria-hidden="true">
          Esc
        </kbd>
      )}
    </button>
  );
}
