type Props = {
  steps: string[];
  current: number; // 1-based
};

export function StepBar({ steps, current }: Props) {
  return (
    <div className="flex items-start justify-center">
      {steps.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;

        return (
          <div key={step} className="flex items-start">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done
                    ? "bg-primary/30 text-primary"
                    : active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground/50"
                }`}
              >
                {done ? "✓" : step}
              </div>
              <span
                className={`text-xs whitespace-nowrap transition-colors ${
                  active
                    ? "text-primary font-semibold"
                    : done
                    ? "text-primary/50"
                    : "text-muted-foreground/50"
                }`}
              >
                {label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={`w-16 h-px mt-3.5 mx-2 transition-colors ${
                  done ? "bg-primary/30" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
