interface ColumnSelectorProps {
  headers: string[];
  selected: boolean[];
  onChange: (selected: boolean[]) => void;
}

export default function ColumnSelector({
  headers,
  selected,
  onChange,
}: ColumnSelectorProps) {
  if (headers.length <= 1) return null;

  const toggle = (index: number) => {
    const next = [...selected];
    next[index] = !next[index];
    if (next.every((v) => !v)) return;
    onChange(next);
  };

  const allSelected = selected.every(Boolean);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-[--color-text-secondary]">Columns:</span>
        <button
          onClick={() =>
            onChange(selected.map(() => !allSelected))
          }
          className="text-xs text-[--color-accent] hover:text-[--color-accent-hover] transition-colors"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {headers.map((header, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`px-3 py-1 rounded-full text-sm transition-colors border ${
              selected[i]
                ? 'bg-[--color-accent] border-[--color-accent] text-white'
                : 'bg-[--color-bg-tertiary] border-[--color-border] text-[--color-text-secondary] hover:border-[--color-text-muted]'
            }`}
          >
            {header}
          </button>
        ))}
      </div>
    </div>
  );
}
