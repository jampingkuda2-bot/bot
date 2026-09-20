export function IconBtn({ children, onClick, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="p-2 rounded-lg transition hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
    >
      {children}
    </button>
  );
}

export function MiniBtn({ children, onClick, disabled, title, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition disabled:opacity-30 disabled:cursor-not-allowed ${
        danger
          ? 'hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600'
          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

export function ActionBtn({ icon: Icon, onClick, label, full }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition ${
        full ? 'w-full' : ''
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

export function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-2 bg-neutral-50/50 dark:bg-neutral-900/50">
      <div className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="font-medium truncate">{value}</div>
    </div>
  );
}

export function Group({ title, children }) {
  return (
    <section>
      <h3 className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 mb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
    />
  );
}

export function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`mt-0.5 relative w-9 h-5 rounded-full transition-colors shrink-0 ${
          checked ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="flex-1">
        <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {label}
        </span>
        {hint && (
          <span className="block text-[11px] text-neutral-500 mt-0.5">{hint}</span>
        )}
      </span>
    </label>
  );
}
