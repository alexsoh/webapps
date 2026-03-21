import { useState, useMemo } from 'react';

interface Props {
  columns: string[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
}

export default function ColumnSelector({ columns, selected, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(true);

  const filtered = useMemo(() => {
    if (!search) return columns;
    const lower = search.toLowerCase();
    return columns.filter((c) => c.toLowerCase().includes(lower));
  }, [columns, search]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selected.has(c));

  const toggleAll = () => {
    const next = new Set(selected);
    if (allFilteredSelected) {
      for (const c of filtered) next.delete(c);
    } else {
      for (const c of filtered) next.add(c);
    }
    onChange(next);
  };

  const toggle = (col: string) => {
    const next = new Set(selected);
    if (next.has(col)) {
      next.delete(col);
    } else {
      next.add(col);
    }
    onChange(next);
  };

  return (
    <div className="border border-[--color-border] rounded-lg bg-[--color-bg-secondary] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[--color-bg-hover] transition-colors"
      >
        <span className="text-sm font-medium text-[--color-text-secondary] uppercase tracking-wide">
          Columns ({selected.size} of {columns.length})
        </span>
        <svg
          className={`w-4 h-4 text-[--color-text-muted] transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search columns..."
              className="flex-1 px-3 py-1.5 text-sm bg-[--color-bg-tertiary] border border-[--color-border] rounded text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-border-focus]"
            />
            <button
              onClick={toggleAll}
              className="px-3 py-1.5 text-xs font-medium bg-[--color-bg-tertiary] border border-[--color-border] rounded text-[--color-text-secondary] hover:bg-[--color-bg-hover] transition-colors whitespace-nowrap"
            >
              {allFilteredSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 max-h-60 overflow-y-auto">
            {filtered.map((col) => (
              <label
                key={col}
                className="flex items-center gap-2 px-2 py-1 rounded text-sm hover:bg-[--color-bg-hover] cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(col)}
                  onChange={() => toggle(col)}
                  className="accent-[--color-accent]"
                />
                <span className="truncate text-[--color-text-secondary] font-mono text-xs" title={col}>
                  {col}
                </span>
              </label>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-sm text-[--color-text-muted] py-2">No columns match "{search}"</p>
          )}
        </div>
      )}
    </div>
  );
}
