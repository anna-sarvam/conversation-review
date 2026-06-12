'use client';

import { useState, useEffect, useMemo } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

interface LangSwitch {
  lang: string;
  is_switch_back: boolean;
}

interface Conversation {
  conv_type: string;
  language: string;
  dialect: string;
  mode: string;
  education: string;
  life_sphere: string;
  intent: string;
  has_language_switch: boolean;
  language_switches: Record<string, LangSwitch>;
  turns_used: number;
  age: string | number;
  sex: string;
  occupation: string;
  state: string;
  identity_subtype?: string;
  identity_category?: string;
  orientation?: string;
  conversation: Turn[];
}

interface IndexData {
  languages: string[];
  dialects_by_lang: Record<string, string[]>;
  conv_types: string[];
  modes: string[];
  education_levels: string[];
  total: number;
}

interface LangData {
  language: string;
  dialects: string[];
  conversations: Conversation[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  grounded: 'bg-emerald-900/60 text-emerald-300',
  ungrounded: 'bg-blue-900/60 text-blue-300',
  identity: 'bg-purple-900/60 text-purple-300',
};
const MODE_COLORS: Record<string, string> = {
  chat: 'bg-sky-900/60 text-sky-300',
  voice: 'bg-red-900/60 text-red-300',
};

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${color}`}>
      {label}
    </span>
  );
}

// ── Select ───────────────────────────────────────────────────────────────────

interface SelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

function Select({ label, value, options, onChange, disabled, placeholder = `All ${label}s` }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          bg-[#1a1d26] border border-[#2e3148] rounded-md px-3 py-2 text-sm
          focus:outline-none focus:border-indigo-500
          disabled:opacity-40 disabled:cursor-not-allowed
          min-w-[140px]
          ${value ? 'text-slate-200' : 'text-slate-500'}
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── ConvCard ─────────────────────────────────────────────────────────────────

function ConvCard({
  conv,
  active,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 border-b border-[#1e2130]
        transition-colors hover:bg-[#1e2233]
        ${active ? 'bg-[#1e2233] border-l-2 border-l-indigo-500' : ''}
      `}
    >
      <div className="flex gap-1.5 flex-wrap mb-1.5">
        <Tag label={conv.conv_type} color={TYPE_COLORS[conv.conv_type] ?? 'bg-slate-700 text-slate-300'} />
        <Tag label={conv.mode} color={MODE_COLORS[conv.mode] ?? 'bg-slate-700 text-slate-300'} />
        {conv.has_language_switch && (
          <Tag label="L-switch" color="bg-amber-900/60 text-amber-300" />
        )}
      </div>
      <div className="text-sm font-semibold text-slate-200 truncate">{conv.dialect || conv.language}</div>
      <div className="text-xs text-slate-500 mt-0.5 flex gap-3">
        <span>{conv.education || '—'}</span>
        <span>{conv.turns_used} turns</span>
        {conv.life_sphere && <span className="truncate max-w-[100px]">{conv.life_sphere}</span>}
      </div>
    </button>
  );
}

// ── Viewer ───────────────────────────────────────────────────────────────────

function Viewer({ conv }: { conv: Conversation | null }) {
  if (!conv) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M8 9h8M8 13h5M3 6a2 2 0 012-2h14a2 2 0 012 2v9a2 2 0 01-2 2H7l-4 4V6z" />
        </svg>
        <p className="text-sm">Select a conversation</p>
      </div>
    );
  }

  const lswMap: Record<number, LangSwitch> = {};
  Object.entries(conv.language_switches ?? {}).forEach(([k, v]) => {
    lswMap[parseInt(k)] = v;
  });

  const persona = [conv.age && `Age ${conv.age}`, conv.sex, conv.occupation, conv.state]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#1e2130] bg-[#13151f] flex-shrink-0">
        <div className="flex gap-2 flex-wrap items-center mb-2">
          <Tag label={conv.conv_type} color={TYPE_COLORS[conv.conv_type] ?? 'bg-slate-700 text-slate-300'} />
          <Tag label={conv.mode} color={MODE_COLORS[conv.mode] ?? 'bg-slate-700 text-slate-300'} />
          {conv.has_language_switch && <Tag label="Language Switch" color="bg-amber-900/60 text-amber-300" />}
          <span className="text-base font-semibold text-slate-100 ml-1">
            {conv.language} · {conv.dialect}
          </span>
        </div>
        <div className="flex gap-4 flex-wrap text-xs text-slate-500">
          {persona && <span>{persona}</span>}
          {conv.education && <span><b className="text-slate-400">Education:</b> {conv.education}</span>}
          {(conv.life_sphere || conv.intent) && (
            <span><b className="text-slate-400">Topic:</b> {conv.life_sphere || conv.intent}</span>
          )}
          <span><b className="text-slate-400">Turns:</b> {conv.turns_used}</span>
          {conv.identity_subtype && (
            <span><b className="text-slate-400">Subtype:</b> {conv.identity_subtype}</span>
          )}
          {conv.orientation && (
            <span><b className="text-slate-400">Orientation:</b> {conv.orientation}</span>
          )}
        </div>
      </div>

      {/* Turns */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {conv.conversation.map((turn, i) => {
          const lsw = lswMap[i];
          const isUser = turn.role === 'user';
          return (
            <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              {lsw && (
                <div className="text-[10px] bg-amber-900/40 text-amber-300 px-3 py-1 rounded-full mb-1">
                  ↳ Language switch → {lsw.lang}
                  {lsw.is_switch_back ? ' (switch back)' : ''}
                </div>
              )}
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                {isUser ? 'User' : 'Sarvam AI'}
              </div>
              <div
                className={`
                  max-w-[600px] px-4 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap
                  ${isUser
                    ? 'bg-[#1e3a5f] text-slate-200 rounded-br-sm'
                    : 'bg-[#1a2e1a] text-slate-200 rounded-bl-sm'}
                `}
              >
                {turn.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const [index, setIndex] = useState<IndexData | null>(null);
  const [langData, setLangData] = useState<LangData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Conversation | null>(null);

  // Filters — all empty = "all"
  const [filterLang, setFilterLang] = useState('');
  const [filterDialect, setFilterDialect] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterEdu, setFilterEdu] = useState('');
  const [filterLsw, setFilterLsw] = useState('');

  // Load index on mount
  useEffect(() => {
    fetch('/data/index.json')
      .then((r) => r.json())
      .then(setIndex)
      .catch(console.error);
  }, []);

  // Load per-language data when language is selected
  useEffect(() => {
    if (!filterLang) {
      setLangData(null);
      setFilterDialect('');
      setSelected(null);
      return;
    }
    setLoading(true);
    setFilterDialect('');
    setSelected(null);
    const slug = filterLang.toLowerCase().replace(/\s+/g, '_');
    fetch(`/data/${slug}.json`)
      .then((r) => r.json())
      .then((d) => { setLangData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filterLang]);

  // Reset selected conversation when filters change
  useEffect(() => {
    setSelected(null);
  }, [filterDialect, filterType, filterMode, filterEdu, filterLsw]);

  const filtered = useMemo(() => {
    if (!langData) return [];
    return langData.conversations.filter((c) => {
      if (filterDialect && c.dialect !== filterDialect) return false;
      if (filterType && c.conv_type !== filterType) return false;
      if (filterMode && c.mode !== filterMode) return false;
      if (filterEdu && c.education !== filterEdu) return false;
      if (filterLsw === 'yes' && !c.has_language_switch) return false;
      if (filterLsw === 'no' && c.has_language_switch) return false;
      return true;
    });
  }, [langData, filterDialect, filterType, filterMode, filterEdu, filterLsw]);

  const dialectOptions = (langData?.dialects ?? []).map((d) => ({ value: d, label: d }));
  const typeOptions = ['grounded', 'ungrounded', 'identity'].map((v) => ({ value: v, label: v }));
  const modeOptions = ['chat', 'voice'].map((v) => ({ value: v, label: v }));
  const eduOptions = (index?.education_levels ?? []).map((v) => ({ value: v, label: v }));
  const lswOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ];
  const langOptions = (index?.languages ?? []).map((l) => ({ value: l, label: l }));

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <header className="flex items-end gap-4 px-6 py-4 border-b border-[#1e2130] bg-[#13151f] flex-shrink-0 flex-wrap">
        <div className="mr-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
            Conversation Review
          </div>
          <div className="text-[11px] text-slate-600">
            {index ? `${index.total.toLocaleString()} total` : 'Loading…'}
          </div>
        </div>

        <Select
          label="Language"
          value={filterLang}
          options={langOptions}
          onChange={(v) => setFilterLang(v)}
          placeholder="Pick a language"
        />
        <Select
          label="Dialect"
          value={filterDialect}
          options={dialectOptions}
          onChange={(v) => setFilterDialect(v)}
          disabled={!langData}
          placeholder="All dialects"
        />
        <Select
          label="Type"
          value={filterType}
          options={typeOptions}
          onChange={(v) => setFilterType(v)}
          placeholder="All types"
        />
        <Select
          label="Mode"
          value={filterMode}
          options={modeOptions}
          onChange={(v) => setFilterMode(v)}
          placeholder="All modes"
        />
        <Select
          label="Education"
          value={filterEdu}
          options={eduOptions}
          onChange={(v) => setFilterEdu(v)}
          placeholder="All levels"
        />
        <Select
          label="Lang Switch"
          value={filterLsw}
          options={lswOptions}
          onChange={(v) => setFilterLsw(v)}
          placeholder="Any"
        />

        {filterLang && (
          <div className="ml-auto text-sm text-slate-400 self-end pb-2">
            {loading ? 'Loading…' : `${filtered.length} conversation${filtered.length !== 1 ? 's' : ''}`}
          </div>
        )}
      </header>

      {/* Body: list + viewer */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list */}
        <div className="w-[300px] flex-shrink-0 border-r border-[#1e2130] overflow-y-auto">
          {!filterLang ? (
            <div className="p-6 text-sm text-slate-600 text-center mt-8">
              Select a language to start
            </div>
          ) : loading ? (
            <div className="p-6 text-sm text-slate-600 text-center mt-8">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-slate-600 text-center mt-8">No conversations match</div>
          ) : (
            filtered.map((c, i) => (
              <ConvCard
                key={i}
                conv={c}
                active={c === selected}
                onClick={() => setSelected(c)}
              />
            ))
          )}
        </div>

        {/* Viewer */}
        <div className="flex-1 overflow-hidden">
          <Viewer conv={selected} />
        </div>
      </div>
    </div>
  );
}
