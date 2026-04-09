import { useState, useEffect } from 'react'
import { FileText, User, School, Download, FileDown, Eye, Upload, Trash2, ClipboardList, BookOpen } from 'lucide-react'
import { Field, Input, Select } from '../components/FormField'
import DatePicker from '../components/DatePicker'
import LogoUpload from '../components/LogoUpload'
import { generateInnstillingPDF } from '../generators/innstilling.pdf'
import { generateInnstillingDOCX } from '../generators/innstilling.docx'

const STILLINGSTYPE_OPTIONS = [
  { value: 'vikariat',     label: 'Vikariat' },
  { value: 'fast stilling', label: 'Fast stilling' },
  { value: 'tilkallingsvikar', label: 'Tilkallingsvikar' },
]

const TITLE_OPTIONS = [
  { value: 'Rektor',             label: 'Rektor' },
  { value: 'Konstituert rektor', label: 'Konstituert rektor' },
  { value: 'andre',              label: 'Andre...' },
]

const LS_KEY = 'innstilling_form'

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}

const DEFAULT_STATE = {
  // Stilling
  skolenavn: '', fagomrade: '', fagene: '', prosent: '', stillingstype: 'vikariat', stillingId: '',
  // Søknad
  soeknadsfrist: '', antallSokere: '', antallIntervju: '',
  // Innstilling
  rektorNavn: '', kandidatnavn: '', kandidatprosent: '',
  // Vedtak
  vedtaksdato: '', vedtakstid: '',
  // Signering
  utstedelsesdato: '', signaturnavn: '', signaturttittel: 'Rektor', customTitle: '',
}

export default function InnstillingPage() {
  const [form, setForm] = useState(() => load(LS_KEY, DEFAULT_STATE))
  const [logo, setLogo] = useState(null)

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(form)) }, [form])

  function set(field, value) { setForm(p => ({ ...p, [field]: value })) }

  function clearAll() {
    setForm(DEFAULT_STATE)
    setLogo(null)
    localStorage.removeItem(LS_KEY)
  }

  const resolvedTitle = form.signaturttittel === 'andre' ? form.customTitle : form.signaturttittel
  const data = { ...form, signaturttittel: resolvedTitle, logo }

  const handlePDF = () => generateInnstillingPDF(data)
  const handleDOCX = async () => { await generateInnstillingDOCX(data) }

  const todayLabel = new Date().toLocaleDateString('nb-NO', { day: '2-digit', month: 'long', year: 'numeric' })

  // Preview body
  const body1 = `Stilling innen fagene ${form.fagene || '…'} har vært lyst ledig eksternt med søknadsfrist ${form.soeknadsfrist || '…'}. Det meldte seg ${form.antallSokere || '…'} søkere til stillingen. ${form.antallIntervju || '…'} søkere har vært på intervju.`
  const body2 = `Etter en samlet vurdering ... har fylkesrådmannen ved rektor ${form.rektorNavn || '…'} innstilt følgende til stillingen(e):`

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <h2>Innstilling</h2>
          <p>Generer en innstilling for undervisningsstilling.</p>
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
            <ClipboardList size={15} />
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
            <Field label="Fagområde (etter «Undervisningsstilling i»)" span="full">
              <Input value={form.fagomrade} onChange={v => set('fagomrade', v)} placeholder="realfag" />
            </Field>
            <Field label="Fagene i stillingen" span="full">
              <Input value={form.fagene} onChange={v => set('fagene', v)} placeholder="matematikk, naturfag, kjemi og/eller geofag" />
            </Field>
            <Field label="Stillingsandel (%)">
              <Input value={form.prosent} onChange={v => set('prosent', v)} placeholder="75" />
            </Field>
            <Field label="Stillingstype">
              <Select value={form.stillingstype} onChange={v => set('stillingstype', v)} options={STILLINGSTYPE_OPTIONS} />
            </Field>
            <Field label="Stilling-ID (valgfritt)">
              <Input value={form.stillingId} onChange={v => set('stillingId', v)} placeholder="4734414890" />
            </Field>
          </div>
        </div>

        {/* Søknad */}
        <div className="form-card">
          <div className="form-card-header">
            <BookOpen size={15} />
            <span className="form-card-title">Søknad og intervju</span>
          </div>
          <div className="form-grid">
            <Field label="Søknadsfrist">
              <DatePicker value={form.soeknadsfrist} onChange={v => set('soeknadsfrist', v)} />
            </Field>
            <Field label="Antall søkere">
              <Input value={form.antallSokere} onChange={v => set('antallSokere', v)} placeholder="9" />
            </Field>
            <Field label="Antall på intervju">
              <Input value={form.antallIntervju} onChange={v => set('antallIntervju', v)} placeholder="2" />
            </Field>
          </div>
        </div>

        {/* Innstilling */}
        <div className="form-card">
          <div className="form-card-header">
            <User size={15} />
            <span className="form-card-title">Innstilling</span>
          </div>
          <div className="form-grid">
            <Field label="Rektors navn (som innstiller)">
              <Input value={form.rektorNavn} onChange={v => set('rektorNavn', v)} placeholder="Åsmund Glende Jakobsen" />
            </Field>
            <Field label="Kandidatens navn">
              <Input value={form.kandidatnavn} onChange={v => set('kandidatnavn', v)} placeholder="Stine Rugland Nordlid" />
            </Field>
            <Field label="Kandidatens prosent (%)">
              <Input value={form.kandidatprosent} onChange={v => set('kandidatprosent', v)} placeholder="75" />
            </Field>
          </div>
        </div>

        {/* Vedtak */}
        <div className="form-card">
          <div className="form-card-header">
            <FileText size={15} />
            <span className="form-card-title">Endelig vedtak (valgfritt)</span>
          </div>
          <div className="form-grid">
            <Field label="Vedtaksdato">
              <DatePicker value={form.vedtaksdato} onChange={v => set('vedtaksdato', v)} clearable />
            </Field>
            <Field label="Klokkeslett">
              <Input value={form.vedtakstid} onChange={v => set('vedtakstid', v)} placeholder="15:00" />
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
            <p className="fp-title" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {form.skolenavn || <span className="fp-placeholder">Skolens navn</span>}
            </p>
            <p className="fp-title" style={{ marginTop: 8 }}>INNSTILLING:</p>
            <p className="fp-body" style={{ marginBottom: 4 }}>
              Undervisningsstilling i {form.fagomrade || <span className="fp-placeholder">fagområde</span>} – inntil {form.prosent || <span className="fp-placeholder">%</span>}% {form.stillingstype}
            </p>
            {form.stillingId && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>ID: {form.stillingId}</p>}
            <p className="fp-body">{body1}</p>
            <p className="fp-body" style={{ marginTop: 8 }}>{body2}</p>
            <p className="fp-signer" style={{ marginTop: 8 }}>{form.kandidatnavn || <span className="fp-placeholder">Kandidatnavn</span>}: {form.kandidatprosent || form.prosent || <span className="fp-placeholder">%</span>}%</p>
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
