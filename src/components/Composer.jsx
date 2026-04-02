function ComposerError({ error, onOpenLogin, onOpenUpgrade }) {
  if (!error) return null;

  if (typeof error === "string") {
    return <>{error}</>;
  }

  if (error.type === "guest-limit") {
    return (
      <>
        Limit reached,{" "}
        <button
          type="button"
          onClick={onOpenLogin}
          className="underline underline-offset-4 transition hover:text-white"
        >
          login/sign up
        </button>{" "}
        to continue.
      </>
    );
  }

  if (error.type === "free-limit") {
    return (
      <>
        Limit reached,{" "}
        <button
          type="button"
          onClick={onOpenUpgrade}
          className="underline underline-offset-4 transition hover:text-white"
        >
          upgrade
        </button>{" "}
        to continue.
      </>
    );
  }

  return <>{error.message || ""}</>;
}

export default function Composer({
  query,
  setQuery,
  onSubmit,
  landing = false,
  error = { type: "", message: "" },
  onOpenLogin,
  onOpenUpgrade,
}) {
  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Enter Math Problem Here"
          className={`h-16 flex-1 border border-white/12 bg-[#0b0b0b] px-6 text-[18px] font-light tracking-[0.02em] text-white/90 outline-none placeholder:text-white/34 focus:border-white/24 ${
            landing ? "text-center sm:text-center" : ""
          }`}
        />

        {!landing ? (
          <button
            type="submit"
            className="h-16 border border-white/12 bg-[#0b0b0b] px-10 text-[13px] font-light uppercase tracking-[0.24em] text-white/78 transition hover:border-white/20 hover:text-white sm:min-w-36"
          >
            Solve
          </button>
        ) : null}
      </div>

      <div
        className={`mt-3 min-h-[20px] text-[12px] font-light tracking-[0.06em] text-white/55 ${
          landing ? "text-center" : "pl-1"
        }`}
      >
        <ComposerError
          error={error}
          onOpenLogin={onOpenLogin}
          onOpenUpgrade={onOpenUpgrade}
        />
      </div>
    </form>
  );
}