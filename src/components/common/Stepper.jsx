export default function Stepper({ label, hint, value, min, max, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)}
          className="h-9 w-9 rounded-full border border-gray-200 bg-white text-lg font-bold disabled:opacity-40">−</button>
        <span className="w-5 text-center text-lg font-extrabold">{value}</span>
        <button type="button" disabled={value >= max} onClick={() => onChange(value + 1)}
          className="h-9 w-9 rounded-full border border-gray-200 bg-white text-lg font-bold disabled:opacity-40">+</button>
      </div>
    </div>
  );
}