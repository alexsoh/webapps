import { useState } from 'react';
import type { SeverityConfig, SeverityColorRule } from '../types';
import { SEVERITY_COLORS } from '../types';

interface Props {
  columns: string[];
  config: SeverityConfig;
  onChange: (config: SeverityConfig) => void;
}

const COLOR_OPTIONS = Object.keys(SEVERITY_COLORS);

export default function SeveritySettings({ columns, config, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  const updateField = (field: string) => onChange({ ...config, field });
  const toggleEnabled = () => onChange({ ...config, enabled: !config.enabled });

  const updateRule = (idx: number, patch: Partial<SeverityColorRule>) => {
    const rules = config.rules.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChange({ ...config, rules });
  };

  const removeRule = (idx: number) => {
    onChange({ ...config, rules: config.rules.filter((_, i) => i !== idx) });
  };

  const addRule = () => {
    onChange({ ...config, rules: [...config.rules, { keyword: '', color: 'red' }] });
  };

  return (
    <div className="border border-[--color-border] rounded-lg bg-[--color-bg-secondary] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[--color-bg-hover] transition-colors"
      >
        <span className="text-sm font-medium text-[--color-text-secondary] uppercase tracking-wide">
          Severity Colors
          {config.enabled && (
            <span className="ml-2 text-xs normal-case tracking-normal text-[--color-text-muted]">
              ({config.field})
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <span
            onClick={(e) => { e.stopPropagation(); toggleEnabled(); }}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
              config.enabled ? 'bg-[--color-accent]' : 'bg-[--color-bg-tertiary]'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                config.enabled ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </span>
          <svg
            className={`w-4 h-4 text-[--color-text-muted] transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div>
            <label className="block text-xs text-[--color-text-muted] mb-1">Severity Field</label>
            <select
              value={config.field}
              onChange={(e) => updateField(e.target.value)}
              className="w-full max-w-xs px-3 py-1.5 text-sm bg-[--color-bg-tertiary] border border-[--color-border] rounded text-[--color-text-primary] focus:outline-none focus:border-[--color-border-focus]"
            >
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[--color-text-muted] mb-2">Color Rules</label>
            <div className="flex flex-col gap-2">
              {config.rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rule.keyword}
                    onChange={(e) => updateRule(idx, { keyword: e.target.value })}
                    placeholder="Keyword"
                    className="flex-1 max-w-40 px-2 py-1 text-sm font-mono bg-[--color-bg-tertiary] border border-[--color-border] rounded text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-border-focus]"
                  />
                  <select
                    value={rule.color}
                    onChange={(e) => updateRule(idx, { color: e.target.value })}
                    className="px-2 py-1 text-sm bg-[--color-bg-tertiary] border border-[--color-border] rounded text-[--color-text-primary] focus:outline-none focus:border-[--color-border-focus]"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className={`w-4 h-4 rounded ${SEVERITY_COLORS[rule.color]}`} />
                  <button
                    onClick={() => removeRule(idx)}
                    className="text-[--color-text-muted] hover:text-[--color-error] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addRule}
              className="mt-2 px-3 py-1 text-xs font-medium bg-[--color-bg-tertiary] border border-[--color-border] rounded text-[--color-text-secondary] hover:bg-[--color-bg-hover] transition-colors"
            >
              + Add Rule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
