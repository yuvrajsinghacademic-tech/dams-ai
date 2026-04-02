function NumberLineDisplay({ data }) {
  if (!data?.needed) {
    return (
      <p className="text-[18px] font-light leading-8 text-white/82">
        Number Line Not Needed For This Equation.
      </p>
    );
  }

  const values = Array.from({ length: data.max - data.min + 1 }, (_, i) => data.min + i);
  const direction = data.move >= 0 ? "right" : "left";

  return (
    <div className="space-y-5">
      <p className="text-[18px] font-light leading-8 text-white/82">
        Start at {data.start}, move {Math.abs(data.move)} step
        {Math.abs(data.move) === 1 ? "" : "s"} to the {direction}, and land on {data.end}.
      </p>

      <div className="overflow-x-auto">
        <div className="min-w-max rounded-2xl border border-white/10 bg-[#0a0a0a] px-5 py-6">
          <div className="flex items-end gap-5">
            {values.map((value) => {
              const isStart = value === data.start;
              const isEnd = value === data.end;
              const between =
                data.move >= 0
                  ? value > data.start && value < data.end
                  : value < data.start && value > data.end;

              return (
                <div key={value} className="flex flex-col items-center gap-2">
                  <div
                    className={`h-4 w-4 rounded-full border ${
                      isStart || isEnd
                        ? "border-white bg-white"
                        : between
                        ? "border-white/70 bg-white/30"
                        : "border-white/25 bg-transparent"
                    }`}
                  />
                  <div className="h-10 w-px bg-white/18" />
                  <div className="text-[13px] font-light text-white/65">{value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsScreen({ solution }) {
  const sections = [
    { title: "RESULTS", value: null, headingOnly: true },
    { title: "ANSWER", value: solution.finalAnswer, large: true },
    { title: "GIVEN", value: solution.problem },
    { title: "STEP BY STEP", value: solution.stepByStep },
    { title: "WHY?", value: solution.explanation },
    { title: "QUICK CHECK", value: solution.quickCheck },
    { title: "NUMBER LINE", value: solution.numberLine, isNumberLine: true },
    {
      title: "AI EXPLANATION VIDEO",
      value: "DAMS AI cannot generate videos just yet.",
    },
  ];

  return (
    <section className="mx-auto flex w-full max-w-[980px] flex-1 flex-col px-5 pt-6 sm:px-8 sm:pt-8">
      <div className="border border-white/10 bg-[#050505] px-5 py-5 sm:px-8 sm:py-8">
        <div className="space-y-0">
          {sections.map((section, index) => {
            if (section.headingOnly) {
              return (
                <div key={section.title} className="border-b border-white/10 pb-5">
                  <h1 className="text-[12px] font-light uppercase tracking-[0.28em] text-white/42">
                    {section.title}
                  </h1>
                </div>
              );
            }

            return (
              <article
                key={section.title}
                className={`${index === 1 ? "pt-6" : "border-t border-white/10 pt-6"} pb-6`}
              >
                <h2 className="mb-4 text-[12px] font-light uppercase tracking-[0.28em] text-white/42">
                  {section.title}
                </h2>

                {section.isNumberLine ? (
                  <NumberLineDisplay data={section.value} />
                ) : Array.isArray(section.value) ? (
                  <ol className="space-y-3 text-[18px] font-light leading-8 text-white/82">
                    {section.value.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p
                    className={
                      section.large
                        ? "text-[42px] font-medium leading-tight text-white sm:text-[52px]"
                        : "text-[18px] font-light leading-8 text-white/82"
                    }
                  >
                    {section.value}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}