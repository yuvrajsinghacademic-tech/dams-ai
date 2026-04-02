export function AuthShell({ title, subtitle, children }) {
  return (
    <section className="mx-auto flex w-full max-w-[620px] flex-1 flex-col justify-center px-5 py-8 sm:px-8">
      <div className="border border-white/10 bg-[#050505] px-5 py-6 sm:px-8 sm:py-8">
        <div className="mb-8 flex flex-col items-center">
          <h1 className="text-center text-[13px] font-light uppercase tracking-[0.28em] text-white/72">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-3 text-center text-[13px] font-light leading-7 text-white/48">
              {subtitle}
            </p>
          ) : null}
        </div>

        {children}
      </div>
    </section>
  );
}

export function AuthInput({ type = "text", value, onChange, placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="h-14 w-full border border-white/12 bg-[#0b0b0b] px-5 text-[16px] font-light text-white/90 outline-none placeholder:text-white/34 focus:border-white/24"
    />
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  fullWidth = true,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`h-14 border border-white/12 bg-[#0b0b0b] px-8 text-[12px] font-light uppercase tracking-[0.24em] text-white/78 transition hover:border-white/20 hover:text-white ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {children}
    </button>
  );
}

export function TextButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[12px] font-light uppercase tracking-[0.18em] text-white/42 transition hover:text-white"
    >
      {children}
    </button>
  );
}

export function FeedbackText({ error, message }) {
  if (!error && !message) {
    return <div className="min-h-[20px]" />;
  }

  return (
    <div className="min-h-[20px] text-center text-[12px] font-light tracking-[0.06em] text-white/55">
      {error || message}
    </div>
  );
}