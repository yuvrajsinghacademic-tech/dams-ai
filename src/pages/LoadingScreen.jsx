export default function LoadingScreen() {
  return (
    <section className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="h-12 w-12 animate-spin rounded-full border border-white/10 border-t-white/80" />
        <p className="text-[12px] font-light uppercase tracking-[0.28em] text-white/45">
          DAMS CAN MAKE MISTAKES
        </p>
      </div>
    </section>
  );
}