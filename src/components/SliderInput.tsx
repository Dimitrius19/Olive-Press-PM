interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  compact?: boolean;
}

export function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix = "",
  compact = false,
}: SliderInputProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const handleInputChange = (raw: string) => {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed));
    }
  };

  return (
    <div className={compact ? "space-y-0.5" : "space-y-1"}>
      <label className="flex items-center justify-between text-xs text-stone-500">
        <span className="truncate">{label}</span>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            min={min}
            max={max}
            step={step}
            className="w-[4.5rem] px-1.5 py-0.5 text-right font-mono text-xs text-stone-700 bg-white border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
          {suffix && (
            <span className="text-[10px] text-stone-400 w-3">{suffix}</span>
          )}
        </div>
      </label>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(clamp(parseFloat(e.target.value)))}
        min={min}
        max={max}
        step={step}
        className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
      />
    </div>
  );
}
