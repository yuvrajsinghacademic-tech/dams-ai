export default function TopBar({ showHomeButton, authLabel, onMenuClick, onHomeClick, onAuthClick, DamsWordmark }) {
    
  return (
    <header className="relative flex items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
      <button
        type="button"
        aria-label="Toggle sidebar"
        onClick={onMenuClick}
        className="flex h-12 w-12 items-center justify-center border border-white/10 text-white/70 transition hover:border-white/20 hover:text-white"
      >
        <span className="flex w-4 flex-col gap-1.5">
          <span className="h-px w-full bg-current" />
          <span className="h-px w-full bg-current opacity-80" />
          <span className="h-px w-full bg-current opacity-60" />
        </span>
      </button>

      {showHomeButton && (
        <button
          type="button"
          onClick={onHomeClick}
          aria-label="Go to home page"
          className="absolute left-1/2 top-4 -translate-x-1/2 transition hover:opacity-100"
        >
          <DamsWordmark className="h-auto w-[150px] opacity-90" />
        </button>
      )}

      <div className="ml-auto">
        <button
          type="button"
          onClick={onAuthClick}
          className="text-[13px] font-light uppercase tracking-[0.24em] text-white/65 transition hover:text-white"
        >
          {authLabel}
        </button>
      </div>
    </header>
  );
}
