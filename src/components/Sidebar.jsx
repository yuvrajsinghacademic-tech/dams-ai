export default function Sidebar({ history, onSelect, isOpen, onClose, userName, userPlan, isGuest }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/55 transition-opacity duration-300 lg:hidden ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed left-0 top-0 z-[70] flex h-screen w-[280px] flex-col border-r border-white/10 bg-[#0b0b0b] px-5 py-5 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center gap-4">
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center border border-white/10 text-white/70 transition hover:border-white/20 hover:text-white"
          >
            <span className="flex w-4 flex-col gap-1.5">
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current opacity-80" />
              <span className="h-px w-full bg-current opacity-60" />
            </span>
          </button>

          <span className="text-[14px] font-light tracking-[0.18em] text-white/85">
            Recents
          </span>
        </div>

        <div className="space-y-2 overflow-y-auto pr-1">
          {history.map((item, index) => (
            <button
              key={`${item}-${index}`}
              type="button"
              onClick={() => onSelect(item)}
              className="w-full rounded-xl border border-white/12 bg-[#0f0f0f] px-4 py-3 text-left text-[14px] font-light text-white/75 transition hover:border-white/20 hover:bg-[#151515] hover:text-white"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-auto border-t border-white/10 pt-5">
          {!isGuest ? (
            <div className="text-[15px] font-medium text-white/92">{userName}</div>
          ) : null}

          <div
            className={`text-[12px] font-light uppercase tracking-[0.16em] text-white/45 ${
              !isGuest ? "mt-1" : ""
            }`}
          >
            {userPlan}
          </div>
        </div>
      </aside>
    </>
  );
}