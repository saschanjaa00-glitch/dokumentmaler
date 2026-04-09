import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const MONTHS = [
  'Januar','Februar','Mars','April','Mai','Juni',
  'Juli','August','September','Oktober','November','Desember',
]
const WEEKDAYS = ['Ma','Ti','On','To','Fr','Lø','Sø']

function parseNO(str) {
  if (!str || str.length !== 10) return null
  const [d, m, y] = str.split('.')
  const dd = +d, mm = +m, yy = +y
  if (isNaN(dd) || isNaN(mm) || isNaN(yy)) return null
  const date = new Date(yy, mm - 1, dd)
  // Strict check: reject overflow (e.g. 32.02.2024 rolls to March)
  if (date.getFullYear() !== yy || date.getMonth() !== mm - 1 || date.getDate() !== dd) return null
  return date
}

function formatNO(date) {
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('.')
}

// Insert dots automatically: DDMMYYYY → DD.MM.YYYY
function autoFormat(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  let out = digits.slice(0, 2)
  if (digits.length > 2) out += '.' + digits.slice(2, 4)
  if (digits.length > 4) out += '.' + digits.slice(4, 8)
  return out
}

export default function DatePicker({ value, onChange, placeholder = 'DD.MM.YYYY', clearable = false }) {
  const today = new Date()

  // Internal text state — what the <input> shows
  const [text, setText] = useState(value || '')

  const parsed = parseNO(value)
  const [open, setOpen] = useState(false)
  const [viewYear,  setViewYear]  = useState(() => parsed ? parsed.getFullYear()  : today.getFullYear())
  const [viewMonth, setViewMonth] = useState(() => parsed ? parsed.getMonth()     : today.getMonth())
  const wrapRef  = useRef(null)
  const inputRef = useRef(null)

  // Sync text when value changes externally (e.g. calendar pick)
  useEffect(() => {
    setText(value || '')
    const p = parseNO(value)
    if (p) { setViewYear(p.getFullYear()); setViewMonth(p.getMonth()) }
  }, [value])

  // Close popup on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function handleTextChange(e) {
    const formatted = autoFormat(e.target.value)
    setText(formatted)
    const p = parseNO(formatted)
    if (p) {
      onChange(formatted)
      setViewYear(p.getFullYear())
      setViewMonth(p.getMonth())
    } else if (formatted === '') {
      onChange('')
    }
  }

  function handleBlur() {
    // If what's typed isn't a valid complete date, reset to the last valid value
    if (!parseNO(text)) {
      setText(value || '')
    }
  }

  function handleClear(e) {
    e.stopPropagation()
    onChange('')
    setText('')
    setOpen(false)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }
  function selectDay(day) {
    const d = formatNO(new Date(viewYear, viewMonth, day))
    onChange(d)
    setText(d)
    setOpen(false)
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDow    = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7
  const parsedForCal = parseNO(value)

  return (
    <div className={`dp-wrap${open ? ' dp-open' : ''}`} ref={wrapRef}>
      <div className="dp-input-row">
        <input
          ref={inputRef}
          type="text"
          className="dp-text-input"
          value={text}
          onChange={handleTextChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={10}
        />
        <span className="dp-right">
          {clearable && value
            ? <button type="button" className="dp-clr" onClick={handleClear}>×</button>
            : (
              <button
                type="button"
                className="dp-cal-btn"
                tabIndex={-1}
                onClick={() => setOpen(o => !o)}
              >
                <Calendar size={14} />
              </button>
            )
          }
        </span>
      </div>

      {open && (
        <div className="dp-popup">
          <div className="dp-nav">
            <button type="button" className="dp-nav-btn" onClick={prevMonth}>
              <ChevronLeft size={13} />
            </button>
            <span className="dp-ml">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" className="dp-nav-btn" onClick={nextMonth}>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="dp-grid">
            {WEEKDAYS.map(w => <span key={w} className="dp-wd">{w}</span>)}
            {Array.from({ length: firstDow }, (_, i) => <span key={`g${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const isSel = parsedForCal &&
                parsedForCal.getDate()     === day &&
                parsedForCal.getMonth()    === viewMonth &&
                parsedForCal.getFullYear() === viewYear
              const isToday = !isSel &&
                today.getDate()     === day &&
                today.getMonth()    === viewMonth &&
                today.getFullYear() === viewYear
              return (
                <button
                  key={day}
                  type="button"
                  className={['dp-day', isSel && 'dp-sel', isToday && 'dp-today'].filter(Boolean).join(' ')}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
