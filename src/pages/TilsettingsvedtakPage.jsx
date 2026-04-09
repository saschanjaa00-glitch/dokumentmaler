import { useState, useEffect } from 'react'
import { FileText, School, Download, FileDown, Eye, Upload, Trash2, Users, UserCheck, Plus, X } from 'lucide-react'
import { Field, Input, Select } from '../components/FormField'
import DatePicker from '../components/DatePicker'
import LogoUpload from '../components/LogoUpload'
import { generateTilsettingsvedtakPDF } from '../generators/tilsettingsvedtak.pdf'
import { generateTilsettingsvedtakDOCX } from '../generators/tilsettingsvedtak.docx'

const STILLINGSTYPE_OPTIONS = [
  { value: 'vikariat',      label: 'Vikariat' },
  { value: 'fast stilling', label: 'Fast stilling' },
  { value: 'tilkallingsvikar', label: 'Tilkallingsvikar' },
]

const KANDIDATTYPE_OPTIONS = [
  { value: 'vikariat',      label: 'Vikariat' },
  { value: 'fast stilling', label: 'Fast stilling' },
]

const PRONOMEN_OPTIONS = [
  { value: 'Han',  label: 'Han' },
  { value: 'Hun',  label: 'Hun' },
  { value: 'De',   label: 'De' },
  { value: 'Hen',  label: 'Hen' },
]

const TITLE_OPTIONS = [
  { value: 'Rektor',             label: 'Rektor' },
  { value: 'Konstituert rektor', label: 'Konstituert rektor' },
  { value: 'Avdelingsleder',     label: 'Avdelingsleder' },
  { value: 'andre',              label: 'Andre...' },
]

const LS_KEY = 'tilsetting_form'

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}

const DEFAULT_TEAM = [
  { navn: '', tittel: '' },
  { navn: '', tittel: '' },
]

const DEFAULT_STATE = {
  skolenavn: '', fagomrade: '', stillingstype: 'vikariat', soeknadsfrist: '', antallSokere: '',
  kandidatnavn: '', kandidatprosent: '', kandidattype: 'vikariat', pronomen: 'Han',
  fraDato: '', tilDato: '',
  utstedelsesdato: '', signaturnavn: '', signaturttittel: 'Rektor', customTitle: '',
  team: DEFAULT_TEAM,
}

export default function TilsettingsvedtakPage() {
  const [form, setForm] = useState(() => load(LS_KEY, DEFAULT_STATE))
  const [logo, setLogo] = useState(null)

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(form)) }, [form])

  function set(field, value) { setForm(p => ({ ...p, [field]: value })) }

  function setTeamMember(index, field, value) {
    setForm(p => {
      const team = [...p.team]
      team[index] = { ...team[index], [field]: value }
      return { ...p, team }
    })
  }

  function addTeamMember() {
    setForm(p => ({ ...p, team: [...p.team, { navn: '', tittel: '' }] }))
  }

  function removeTeamMember(index) {
    setForm(p => ({ ...p, team: p.team.filter((_, i) => i !== index) }))
  }

  function clearAll() {
    setForm(DEFAULT_STATE)
    setLogo(null)
    localStorage.removeItem(LS_KEY)
  }

  const resolvedTitle = form.signaturttittel === 'andre' ? form.customTitle : form.signaturttittel
  const data = { ...form, signaturttittel: resolvedTitle, logo }

  const handlePDF = () => generateTilsettingsvedtakPDF(data)
  const handleDOCX = async () => { await generateTilsettingsvedtakDOCX(data) }

  const todayLabel = new Date().toLocaleDateString('nb-NO', { day: '2-digit', month: 'long', year: 'numeric' })

  const tilsettingPreview = form.tilDato
    ? `${form.pronomen} tilsettes i ${form.kandidattype} fra og med ${form.fraDato || '…'} til og med ${form.tilDato}`
    : `${form.pronomen} tilsettes i ${form.kandidattype} fra og med ${form.fraDato || '…'}`

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <h2>Tilsettingsvedtak</h2>
          <p>Generer et tilsettingsvedtak for undervisningsstilling.</p>
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

        {/* Stilling */}
        <div className="form-card">
          <div className="form-card-header">
            <FileText size={15} />
            <span className="form-card-title">Stilling</span>
            <button className="btn btn-outline btn-sm" onClick={clearAll} style={{ marginLeft: 'auto' }}>
              <Trash2 size={13} />
              Tøm skjema
            </button>
          </div>
          <div className="form-grid">
            <Field label="Skolens navn" span="full">
              <Input value={form.skolenavn} onChange={v => set('skolenavn', v)} placeholder="St. Svithun videregående skole" />
            </Field>
            <Field label="Fagområde" span="full">
              <Input value={form.fagomrade} onChange={v => set('fagomrade', v)} placeholder="kroppsøving og idrettsfag" />
            </Field>
            <Field label="Stillingstype">
              <Select value={form.stillingstype} onChange={v => set('stillingstype', v)} options={STILLINGSTYPE_OPTIONS} />
            </Field>
            <Field label="Søknadsfrist">
              <DatePicker value={form.soeknadsfrist} onChange={v => set('soeknadsfrist', v)} />
            </Field>
            <Field label="Antall søkere">
              <Input value={form.antallSokere} onChange={v => set('antallSokere', v)} placeholder="53" />
            </Field>
          </div>
        </div>

        {/* Intervjuteam */}
        <div className="form-card">
          <div className="form-card-header">
            <Users size={15} />
            <span className="form-card-title">Intervjuteam</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.team.map((member, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <Input
                    value={member.navn}
                    onChange={v => setTeamMember(i, 'navn', v)}
                    placeholder="Navn"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    value={member.tittel}
                    onChange={v => setTeamMember(i, 'tittel', v)}
                    placeholder="Tittel / rolle"
                  />
                </div>
                {form.team.length > 1 && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => removeTeamMember(i)}
                    style={{ flexShrink: 0, padding: '6px 8px' }}
                    title="Fjern"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
            <div>
              <button className="btn btn-outline btn-sm" onClick={addTeamMember} style={{ marginTop: 4 }}>
                <Plus size={13} />
                Legg til person
              </button>
            </div>
          </div>
        </div>

        {/* Kandidat */}
        <div className="form-card">
          <div className="form-card-header">
            <UserCheck size={15} />
            <span className="form-card-title">Kandidat og tilsetting</span>
          </div>
          <div className="form-grid">
            <Field label="Kandidatens navn" span="full">
              <Input value={form.kandidatnavn} onChange={v => set('kandidatnavn', v)} placeholder="Håvard Tjørhom" />
            </Field>
            <Field label="Stillingsandel (%)">
              <Input value={form.kandidatprosent} onChange={v => set('kandidatprosent', v)} placeholder="80" />
            </Field>
            <Field label="Tilsettingstype">
              <Select value={form.kandidattype} onChange={v => set('kandidattype', v)} options={KANDIDATTYPE_OPTIONS} />
            </Field>
            <Field label="Pronomen">
              <Select value={form.pronomen} onChange={v => set('pronomen', v)} options={PRONOMEN_OPTIONS} />
            </Field>
            <Field label="Fra dato">
              <DatePicker value={form.fraDato} onChange={v => set('fraDato', v)} />
            </Field>
            <Field label="Til dato (valgfritt)">
              <DatePicker value={form.tilDato} onChange={v => set('tilDato', v)} clearable />
            </Field>
          </div>
        </div>

        {/* Signering */}
        <div className="form-card">
          <div className="form-card-header">
            <School size={15} />
            <span className="form-card-title">Signering</span>
          </div>
          <div className="form-grid">
            <Field label="Dato (nederst i dokumentet)">
              <DatePicker value={form.utstedelsesdato} onChange={v => set('utstedelsesdato', v)} />
            </Field>
            <Field label="Signaturnavn">
              <Input value={form.signaturnavn} onChange={v => set('signaturnavn', v)} placeholder="Navn" />
            </Field>
            <Field label="Tittel">
              <Select value={form.signaturttittel} onChange={v => set('signaturttittel', v)} options={TITLE_OPTIONS} />
            </Field>
            {form.signaturttittel === 'andre' && (
              <Field label="Skriv inn tittel" span="full">
                <Input value={form.customTitle} onChange={v => set('customTitle', v)} placeholder="Tittel" autoFocus />
              </Field>
            )}
          </div>
        </div>

        {/* Generate */}
        <div className="form-card">
          <div className="form-card-header">
            <FileText size={15} />
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
            <p className="fp-title">Tilsettingsvedtak</p>
            <p className="fp-body" style={{ marginBottom: 10 }}>
              Undervisningsstilling{form.team.length > 1 ? 'er' : ''} ved {form.skolenavn || <span className="fp-placeholder">skolens navn</span>}
            </p>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Intervjuteamet har bestått av:</p>
            {form.team.filter(m => m.navn).map((m, i) => (
              <p key={i} style={{ fontSize: 12, margin: '0 0 2px 0' }}>
                <strong>{m.navn}</strong>{m.tittel ? `  ${m.tittel}` : ''}
              </p>
            ))}
            <p className="fp-body" style={{ marginTop: 12, fontWeight: 600 }}>
              Tilsetting i stilling{form.team.length > 1 ? 'er' : ''} som {form.stillingstype} ved {form.skolenavn || <span className="fp-placeholder">skolens navn</span>}
            </p>
            <p className="fp-body">
              Stilling innen {form.fagomrade || <span className="fp-placeholder">fagområde</span>} har vært lyst ledig … søknadsfrist {form.soeknadsfrist || <span className="fp-placeholder">dato</span>}. Det meldte seg {form.antallSokere || <span className="fp-placeholder">n</span>} søkere.
            </p>
            <p className="fp-signer" style={{ marginTop: 8 }}>
              {form.kandidatnavn || <span className="fp-placeholder">Kandidatnavn</span>}: {form.kandidatprosent || <span className="fp-placeholder">%</span>}% {form.kandidattype}
            </p>
            <p className="fp-body">{tilsettingPreview}</p>
            <hr className="fp-rule" />
            <p className="fp-school">{form.skolenavn || <span className="fp-placeholder">Skolens navn</span>}, {form.utstedelsesdato || <span className="fp-placeholder">dato</span>}</p>
            <p className="fp-signer">{form.signaturnavn || <span className="fp-placeholder">Navn</span>}</p>
            <p className="fp-title-text">{resolvedTitle || <span className="fp-placeholder">Tittel</span>}</p>
            {logo && <div className="fp-logo"><img src={logo} alt="Logo" /></div>}
          </div>
        </div>

      </div>
    </div>
  )
}
