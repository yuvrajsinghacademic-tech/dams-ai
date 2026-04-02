import damsLogo from "../assets/dams-logo.png";

export default function LandingScreen({
  query,
  setQuery,
  onSubmit,
  error,
  statusLine,
  onOpenLogin,
  onOpenUpgrade,
  Composer,
}) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-5 pb-16">
      <div className="-mt-40 flex w-full max-w-3xl flex-col items-center">
        <img
          src={damsLogo}
          alt="DAMS logo"
          className="mb-0 h-auto w-[280px] max-w-[72vw] object-contain sm:w-[340px] md:w-[390px]"
        />

        <div className="-mt-28 mb-6 rounded-full border border-white/10 bg-[#0a0a0a] px-5 py-3">
          <p className="text-center text-[10px] font-light tracking-[0.18em] text-white/55">
            {statusLine}
          </p>
        </div>

        <div style={{ width: "100%", maxWidth: "520px" }}>
          <Composer
            query={query}
            setQuery={setQuery}
            onSubmit={onSubmit}
            landing
            error={error}
            onOpenLogin={onOpenLogin}
            onOpenUpgrade={onOpenUpgrade}
          />
        </div>

        <p className="mt-6 text-center text-[10px] font-light tracking-[0.18em] text-white/38">
          DAMS can solve 99.7% of all math problems.
        </p>
      </div>
    </section>
  );
}