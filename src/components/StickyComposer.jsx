import Composer from "./Composer";

export default function StickyComposer({
  query,
  setQuery,
  onSubmit,
  sidebarOpen,
  error,
  onOpenLogin,
  onOpenUpgrade,
}) {
  return (
    <div
      className={`fixed bottom-0 right-0 z-[60] border-t border-white/10 bg-[#040404] transition-all duration-300 ${
        sidebarOpen ? "left-[280px]" : "left-0"
      }`}
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 py-4 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-[980px]">
          <Composer
            query={query}
            setQuery={setQuery}
            onSubmit={onSubmit}
            error={error}
            onOpenLogin={onOpenLogin}
            onOpenUpgrade={onOpenUpgrade}
          />
        </div>
      </div>
    </div>
  );
}