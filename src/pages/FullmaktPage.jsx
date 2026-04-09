import { useState, useEffect } from 'react'
import { FileSignature, User, School, Download, FileDown, Eye, Upload, Trash2, BookOpen } from 'lucide-react'
import { Field, Input, Select } from '../components/FormField'
import DatePicker from '../components/DatePicker'
import LogoUpload from '../components/LogoUpload'
import { generateFullmaktPDF } from '../generators/fullmakt.pdf'
import { generateFullmaktDOCX } from '../generators/fullmakt.docx'

const STILLINGSTYPE_OPTIONS = [
  { value: 'vikarstilling',    label: 'Vikarstilling' },
  { value: 'tilkallingsvikar', label: 'Tilkallingsvikar' },
]

const TITLE_OPTIONS = [
  { value: 'Rektor',             label: 'Rektor' },
  { value: 'Konstituert rektor', label: 'Konstituert rektor' },
  { value: 'andre',              label: 'Andre...' },
]

const LS_PERSON = 'fullmakt_person'
const LS_SCHOOL = 'fullmakt_school'
const LS_FAG = 'fullmakt_fag'

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}

const DEFAULT_PERSON = {
  name: '', dob: '', percent: '', stillingstype: 'vikarstilling', fromDate: '', toDate: '',
}
const DEFAULT_SCHOOL = {
  schoolName: '', signerName: '', signerTitle: 'Rektor', customTitle: '',
}

export default function FullmaktPage() {
  const [person, setPerson] = useState(() => load(LS_PERSON, DEFAULT_PERSON))
  const [school, setSchool] = useState(() => load(LS_SCHOOL, DEFAULT_SCHOOL))
  const [fag, setFag] = useState(() => localStorage.getItem(LS_FAG) || '')

  const [logo, setLogo] = useState(null)

  // Persist to localStorage whenever form data changes (logo excluded — too large)
  useEffect(() => { localStorage.setItem(LS_PERSON, JSON.stringify(person)) }, [person])
  useEffect(() => { localStorage.setItem(LS_SCHOOL, JSON.stringify(school)) }, [school])
  useEffect(() => { localStorage.setItem(LS_FAG, fag) }, [fag])

  function clearAll() {
    setPerson(DEFAULT_PERSON)
    setSchool(DEFAULT_SCHOOL)
    setFag('')
    setLogo(null)
    localStorage.removeItem(LS_PERSON)
    localStorage.removeItem(LS_SCHOOL)
    localStorage.removeItem(LS_FAG)
  }

  const resolvedTitle = school.signerTitle === 'andre' ? school.customTitle : school.signerTitle
  const data = { ...person, ...school, signerTitle: resolvedTitle, fag, logo }

  const fagPart = fag.trim() ? ` i ${fag.trim()}` : ''
  const dobPart = person.dob ? ` (født ${person.dob})` : ''
  const previewBody = `${person.name || '…'}${dobPart} ansettes på rektors fullmakt i en ${person.percent || '…'}% ${person.stillingstype} i perioden ${person.fromDate || '…'} – ${person.toDate || '…'}, på bakgrunn av oppstått undervisningsbehov${fagPart}.`

  const handlePDF = () => {
    if (!person.name.trim()) { alert('Skriv inn navn.'); return }
    generateFullmaktPDF(data)
  }

  const handleDOCX = async () => {
    if (!person.name.trim()) { alert('Skriv inn navn.'); return }
    await generateFullmaktDOCX(data)
  }

  const todayLabel = new Date().toLocaleDateString('nb-NO', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <h2>Rektorfullmakt</h2>
          <p>Generer en rektorfullmakt for midlertidig ansettelse i vikarstilling.</p>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0, marginTop: 6, whiteSpace: 'nowrap' }}>{todayLabel}</span>
      </div>

      <div className="page-body">

        {/* Logo */}
        <div className="form-card">
          <div className="form-card-header">
            <Upload size={15} />
            <span className="form-card-title">Logo (valgfri)</span>
          </div>
          <LogoUpload value={logo} onChange={setLogo} />
        </div>

        {/* Person */}
        <div className="form-card">
          <div className="form-card-header">
            <User size={15} />
            <span className="form-card-title">Ansatt</span>
            <button className="btn btn-outline btn-sm" onClick={clearAll} style={{ marginLeft: 'auto' }}>
              <Trash2 size={13} />
              Tøm skjema
            </button>
          </div>
          <div className="form-grid">
            <Field label="Fullt navn" span="full">
              <Input
                value={person.name}
                onChange={v => setPerson(p => ({ ...p, name: v }))}
                placeholder="Navn"
              />
            </Field>
            <Field label="Fødselsdato (valgfri)">
              <DatePicker
                value={person.dob}
                onChange={v => setPerson(p => ({ ...p, dob: v }))}
                clearable
              />
            </Field>
            <Field label="Stillingsandel (%)">
              <Input
                value={person.percent}
                onChange={v => setPerson(p => ({ ...p, percent: v }))}
                placeholder="55,64"
              />
            </Field>
            <Field label="Stillingstype">
              <Select
                value={person.stillingstype}
                onChange={v => setPerson(p => ({ ...p, stillingstype: v }))}
                options={STILLINGSTYPE_OPTIONS}
              />
            </Field>
            <Field label="Fra dato">
              <DatePicker
                value={person.fromDate}
                onChange={v => setPerson(p => ({ ...p, fromDate: v }))}
              />
            </Field>
            <Field label="Til dato">
              <DatePicker
                value={person.toDate}
                onChange={v => setPerson(p => ({ ...p, toDate: v }))}
              />
            </Field>
          </div>
        </div>

        {/* Fag */}
        <div className="form-card">
          <div className="form-card-header">
            <BookOpen size={15} />
            <span className="form-card-title">Behov</span>
          </div>
          <div className="form-grid">
            <Field label="Behov oppstått i hvilke fag? (valgfritt)" span="full">
              <Input
                value={fag}
                onChange={setFag}
                placeholder="f.eks. spansk"
              />
            </Field>
          </div>
        </div>

        {/* School / Signing */}
        <div className="form-card">
          <div className="form-card-header">
            <School size={15} />
            <span className="form-card-title">Skole og signering</span>
          </div>
          <div className="form-grid">
            <Field label="Skolens navn (valgfritt)" span="full">
              <Input
                value={school.schoolName}
                onChange={v => setSchool(p => ({ ...p, schoolName: v }))}
                placeholder="St. Svithun videregående skole"
              />
            </Field>
            <Field label="Signaturnavn">
              <Input
                value={school.signerName}
                onChange={v => setSchool(p => ({ ...p, signerName: v }))}
                placeholder="Navn"
              />
            </Field>
            <Field label="Tittel">
              <Select
                value={school.signerTitle}
                onChange={v => setSchool(p => ({ ...p, signerTitle: v }))}
                options={TITLE_OPTIONS}
              />
            </Field>
            {school.signerTitle === 'andre' && (
              <Field label="Skriv inn tittel" span="full">
                <Input
                  value={school.customTitle}
                  onChange={v => setSchool(p => ({ ...p, customTitle: v }))}
                  placeholder="Tittel"
                  autoFocus
                />
              </Field>
            )}
          </div>
        </div>

        {/* Generate */}
        <div className="form-card">
          <div className="form-card-header">
            <FileSignature size={15} />
            <span className="form-card-title">Generer dokument</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={handlePDF}>
              <Download size={16} />
              Last ned PDF
            </button>
            <button className="btn btn-outline" onClick={handleDOCX}>
              <FileDown size={16} />
              Last ned Word
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="form-card">
          <div className="form-card-header">
            <Eye size={15} />
            <span className="form-card-title">Forhåndsvisning</span>
          </div>
          <div className="fullmakt-preview">
            <p className="fp-title">Rektorfullmakt – {person.name || <span className="fp-placeholder">Navn</span>}</p>
            <p className="fp-body">{previewBody}</p>
            <hr className="fp-rule" />
            <p className="fp-school">{school.schoolName || <span className="fp-placeholder">Skolens navn</span>}</p>
            <p className="fp-signer">{school.signerName || <span className="fp-placeholder">Navn</span>}</p>
            <p className="fp-title-text">{resolvedTitle || <span className="fp-placeholder">Tittel</span>}</p>
            {logo && <div className="fp-logo"><img src={logo} alt="Logo" /></div>}
          </div>
        </div>

      </div>
    </div>
  )
}
