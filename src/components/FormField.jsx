export function Field({ label, hint, span, children }) {
  const cls = ['field', span === 2 ? 'span-2' : '', span === 'full' ? 'span-full' : '']
    .filter(Boolean)
    .join(' ')
  return (
    <div className={cls}>
      {label && <label>{label}</label>}
      {children}
      {hint && <span className="input-hint">{hint}</span>}
    </div>
  )
}

export function Input({ value, onChange, placeholder, type = 'text', min, step, disabled = false, inputMode, maxLength }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      step={step}
      disabled={disabled}
      inputMode={inputMode}
      maxLength={maxLength}
    />
  )
}

export function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  )
}

export function Select({ value, onChange, options, disabled = false }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
