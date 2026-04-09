import { useEffect, useState } from 'react'
import {
  BookOpen,
  ClipboardList,
  Download,
  Eye,
  FileDown,
  FileText,
  Plus,
  School,
  Trash2,
  Upload,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { Field, Input, Select } from '../components/FormField'
import DatePicker from '../components/DatePicker'
import LogoUpload from '../components/LogoUpload'
import { generateInnstillingPDF } from '../generators/innstilling.pdf'
import { generateInnstillingDOCX } from '../generators/innstilling.docx'
import { generateTilsettingsvedtakPDF } from '../generators/tilsettingsvedtak.pdf'
import { generateTilsettingsvedtakDOCX } from '../generators/tilsettingsvedtak.docx'

const STILLINGSTYPE_OPTIONS = [
  { value: 'vikariat', label: 'Vikariat' },
  { value: 'fast stilling', label: 'Fast stilling' },
  { value: 'tilkallingsvikar', label: 'Tilkallingsvikar' },
]

const KANDIDATTYPE_OPTIONS = [
  { value: 'vikariat', label: 'Vikariat' },
  { value: 'fast stilling', label: 'Fast stilling' },
  { value: 'tilkallingsvikar', label: 'Tilkallingsvikar' },
]

const PRONOMEN_OPTIONS = [
  { value: 'Han', label: 'Han' },
  { value: 'Hun', label: 'Hun' },
  { value: 'De', label: 'De' },
  { value: 'Hen', label: 'Hen' },
]

const TITLE_OPTIONS = [
  { value: 'Rektor', label: 'Rektor' },
  { value: 'Konstituert rektor', label: 'Konstituert rektor' },
  { value: 'Avdelingsleder', label: 'Avdelingsleder' },
  { value: 'andre', label: 'Andre...' },
]

const LS_KEY = 'ansettelse_form'

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    if (!value) return fallback

    const parsed = JSON.parse(value)
    return {
      ...fallback,
      ...parsed,
      team: Array.isArray(parsed.team) && parsed.team.length > 0 ? parsed.team : fallback.team,
    }
  } catch {
    return fallback
  }
}

function createDefaultTeam() {
  return [
    { navn: '', tittel: '' },
    { navn: '', tittel: '' },
  ]
}

function createDefaultState() {
  return {
    skolenavn: '',
    fagomrade: '',
    fagene: '',
    prosent: '',
    stillingstype: 'vikariat',
    stillingId: '',
    soeknadsfrist: '',
    antallSokere: '',
    antallIntervju: '',
    rektorNavn: '',
    kandidatnavn: '',
    kandidatprosent: '',
    vedtaksdato: '',
    vedtakstid: '',
    kandidattype: 'vikariat',
    syncKandidattype: true,
    pronomen: 'Han',
    fraDato: '',
    tilDato: '',
    syncFagene: true,
    syncKandidatprosent: true,
    utstedelsesdato: '',
    signaturnavn: '',
    signaturttittel: 'Rektor',
    customTitle: '',
    team: createDefaultTeam(),
  }
}

function SyncToggle({ checked, onChange, label }) {
  return (
    <label className="sync-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export default function HiringPage() {
  const [form, setForm] = useState(() => load(LS_KEY, createDefaultState()))
  const [logo, setLogo] = useState(null)

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(form))
  }, [form])

  function set(field, value) {
    setForm(previous => ({ ...previous, [field]: value }))
  }

  function setTeamMember(index, field, value) {
    setForm(previous => {
      const team = [...previous.team]
      team[index] = { ...team[index], [field]: value }
      return { ...previous, team }
    })
  }

  function addTeamMember() {
    setForm(previous => ({
      ...previous,
      team: [...previous.team, { navn: '', tittel: '' }],
    }))
  }

  function removeTeamMember(index) {
    setForm(previous => ({
      ...previous,
      team: previous.team.filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  function clearAll() {
    setForm(createDefaultState())
    setLogo(null)
    localStorage.removeItem(LS_KEY)
  }

  const resolvedTitle = form.signaturttittel === 'andre' ? form.customTitle : form.signaturttittel
  const resolvedFagene = form.syncFagene ? form.fagomrade : form.fagene
  const candidatePercent = form.syncKandidatprosent ? form.prosent : (form.kandidatprosent || form.prosent)
  const resolvedKandidattype = form.syncKandidattype ? form.stillingstype : form.kandidattype
  const activeTeam = form.team.filter(member => member.navn.trim() || member.tittel.trim())
  const teamCount = activeTeam.length > 0 ? activeTeam.length : 1

  const innstillingData = {
    skolenavn: form.skolenavn,
    fagomrade: form.fagomrade,
    fagene: resolvedFagene,
    prosent: form.prosent,
    stillingstype: form.stillingstype,
    stillingId: form.stillingId,
    soeknadsfrist: form.soeknadsfrist,
    antallSokere: form.antallSokere,
    antallIntervju: form.antallIntervju,
    rektorNavn: form.rektorNavn,
    kandidatnavn: form.kandidatnavn,
    kandidatprosent: candidatePercent,
    vedtaksdato: form.vedtaksdato,
    vedtakstid: form.vedtakstid,
    utstedelsesdato: form.utstedelsesdato,
    signaturnavn: form.signaturnavn,
    signaturttittel: resolvedTitle,
    logo,
  }

  const tilsettingsvedtakData = {
    skolenavn: form.skolenavn,
    fagomrade: form.fagomrade,
    stillingstype: form.stillingstype,
    soeknadsfrist: form.soeknadsfrist,
    antallSokere: form.antallSokere,
    kandidatnavn: form.kandidatnavn,
    kandidatprosent: candidatePercent,
    kandidattype: resolvedKandidattype,
    pronomen: form.pronomen,
    fraDato: form.fraDato,
    tilDato: form.tilDato,
    utstedelsesdato: form.utstedelsesdato,
    signaturnavn: form.signaturnavn,
    signaturttittel: resolvedTitle,
    team: activeTeam,
    logo,
  }

  const todayLabel = new Date().toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const innstillingBody1 = `Stilling innen fagene ${resolvedFagene || '…'} har vært lyst ledig eksternt med søknadsfrist ${form.soeknadsfrist || '…'}. Det meldte seg ${form.antallSokere || '…'} søkere til stillingen. ${form.antallIntervju || '…'} søkere har vært på intervju.`
  const innstillingBody2 = `Etter en samlet vurdering av søkernes utdanning, faglige kompetanse, erfaring og personlige egnethet sett opp mot stillingsutlysningen, har fylkesrådmannen ved rektor ${form.rektorNavn || '…'} innstilt følgende til stillingen(e):`
  const tilsettingPreview = form.tilDato
    ? `${form.pronomen} tilsettes i ${resolvedKandidattype} fra og med ${form.fraDato || '…'} til og med ${form.tilDato}`
    : `${form.pronomen} tilsettes i ${resolvedKandidattype} fra og med ${form.fraDato || '…'}`

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <h2>Ansettelse</h2>
          <p>Fyll ut ett skjema og generer både innstilling og tilsettingsvedtak som separate filer.</p>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0, marginTop: 6, whiteSpace: 'nowrap' }}>{todayLabel}</span>
      </div>

      <div className="page-body page-body-wide">
        <div className="form-card">
          <div className="form-card-header">
            <Upload size={15} />
            <span className="form-card-title">Logo (valgfri)</span>
          </div>
          <LogoUpload value={logo} onChange={setLogo} />
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <ClipboardList size={15} />
            <span className="form-card-title">Felles opplysninger</span>
            <button className="btn btn-outline btn-sm" onClick={clearAll} style={{ marginLeft: 'auto' }} type="button">
              <Trash2 size={13} />
              Tøm skjema
            </button>
          </div>
          <div className="form-grid">
            <Field label="Skolens navn" span="full">
              <Input value={form.skolenavn} onChange={value => set('skolenavn', value)} placeholder="St. Svithun videregående skole" />
            </Field>
            <Field label="Fagområde" span="full">
              <Input value={form.fagomrade} onChange={value => set('fagomrade', value)} placeholder="realfag" />
            </Field>
            <Field label="Fagene i stillingen" span="full" hint="Brukes i innstilling.">
              <Input
                value={form.syncFagene ? form.fagomrade : form.fagene}
                onChange={value => set('fagene', value)}
                placeholder="matematikk, naturfag, kjemi og/eller geofag"
                disabled={form.syncFagene}
              />
            </Field>
            <Field span="full">
              <SyncToggle
                checked={form.syncFagene}
                onChange={checked => set('syncFagene', checked)}
                label="Bruk fagområde også som fagliste i innstillingen"
              />
            </Field>
            <Field label="Stillingsandel (%)">
              <Input value={form.prosent} onChange={value => set('prosent', value)} placeholder="75" />
            </Field>
            <Field label="Stillingstype">
              <Select value={form.stillingstype} onChange={value => set('stillingstype', value)} options={STILLINGSTYPE_OPTIONS} />
            </Field>
            <Field label="Stilling-ID (valgfritt)" hint="Brukes i innstilling.">
              <Input value={form.stillingId} onChange={value => set('stillingId', value)} placeholder="4734414890" />
            </Field>
            <Field label="Søknadsfrist">
              <DatePicker value={form.soeknadsfrist} onChange={value => set('soeknadsfrist', value)} />
            </Field>
            <Field label="Antall søkere">
              <Input value={form.antallSokere} onChange={value => set('antallSokere', value)} placeholder="9" />
            </Field>
            <Field label="Antall på intervju" hint="Brukes i innstilling.">
              <Input value={form.antallIntervju} onChange={value => set('antallIntervju', value)} placeholder="2" />
            </Field>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <User size={15} />
            <span className="form-card-title">Kandidat og tilsetting</span>
          </div>
          <div className="form-grid">
            <Field label="Rektors navn (som innstiller)" hint="Brukes i innstilling.">
              <Input value={form.rektorNavn} onChange={value => set('rektorNavn', value)} placeholder="Åsmund Glende Jakobsen" />
            </Field>
            <Field label="Kandidatens navn">
              <Input value={form.kandidatnavn} onChange={value => set('kandidatnavn', value)} placeholder="Stine Rugland Nordlid" />
            </Field>
            <Field label="Kandidatens prosent (%)">
              <Input
                value={form.syncKandidatprosent ? form.prosent : form.kandidatprosent}
                onChange={value => set('kandidatprosent', value)}
                placeholder="75"
                disabled={form.syncKandidatprosent}
              />
            </Field>
            <Field span="full">
              <SyncToggle
                checked={form.syncKandidatprosent}
                onChange={checked => set('syncKandidatprosent', checked)}
                label="Bruk stillingsandel også som kandidatens prosent"
              />
            </Field>
            <Field label="Tilsettingstype" hint="Brukes i tilsettingsvedtak.">
              <Select
                value={resolvedKandidattype}
                onChange={value => set('kandidattype', value)}
                options={KANDIDATTYPE_OPTIONS}
                disabled={form.syncKandidattype}
              />
            </Field>
            <Field span="full">
              <SyncToggle
                checked={form.syncKandidattype}
                onChange={checked => set('syncKandidattype', checked)}
                label="Bruk stillingstype også som tilsettingstype"
              />
            </Field>
            <Field label="Pronomen" hint="Brukes i tilsettingsvedtak.">
              <Select value={form.pronomen} onChange={value => set('pronomen', value)} options={PRONOMEN_OPTIONS} />
            </Field>
            <Field label="Fra dato" hint="Brukes i tilsettingsvedtak.">
              <DatePicker value={form.fraDato} onChange={value => set('fraDato', value)} />
            </Field>
            <Field label="Til dato (valgfritt)" hint="Brukes i tilsettingsvedtak.">
              <DatePicker value={form.tilDato} onChange={value => set('tilDato', value)} clearable />
            </Field>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <FileText size={15} />
            <span className="form-card-title">Innstilling-spesifikt</span>
          </div>
          <div className="form-grid">
            <Field label="Vedtaksdato">
              <DatePicker value={form.vedtaksdato} onChange={value => set('vedtaksdato', value)} clearable />
            </Field>
            <Field label="Klokkeslett">
              <Input value={form.vedtakstid} onChange={value => set('vedtakstid', value)} placeholder="15:00" />
            </Field>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <Users size={15} />
            <span className="form-card-title">Tilsettingsvedtak-spesifikt</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.team.map((member, index) => (
              <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <Input
                    value={member.navn}
                    onChange={value => setTeamMember(index, 'navn', value)}
                    placeholder="Navn"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    value={member.tittel}
                    onChange={value => setTeamMember(index, 'tittel', value)}
                    placeholder="Tittel / rolle"
                  />
                </div>
                {form.team.length > 1 && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => removeTeamMember(index)}
                    style={{ flexShrink: 0, padding: '6px 8px' }}
                    title="Fjern"
                    type="button"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
            <div>
              <button className="btn btn-outline btn-sm" onClick={addTeamMember} style={{ marginTop: 4 }} type="button">
                <Plus size={13} />
                Legg til person
              </button>
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <School size={15} />
            <span className="form-card-title">Signering</span>
          </div>
          <div className="form-grid">
            <Field label="Dato (nederst i dokumentet)">
              <DatePicker value={form.utstedelsesdato} onChange={value => set('utstedelsesdato', value)} />
            </Field>
            <Field label="Signaturnavn">
              <Input value={form.signaturnavn} onChange={value => set('signaturnavn', value)} placeholder="Navn" />
            </Field>
            <Field label="Tittel">
              <Select value={form.signaturttittel} onChange={value => set('signaturttittel', value)} options={TITLE_OPTIONS} />
            </Field>
            {form.signaturttittel === 'andre' && (
              <Field label="Skriv inn tittel" span="full">
                <Input value={form.customTitle} onChange={value => set('customTitle', value)} placeholder="Tittel" autoFocus />
              </Field>
            )}
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <Download size={15} />
            <span className="form-card-title">Generer dokumenter</span>
          </div>
          <div className="doc-output-grid">
            <div className="doc-output-card">
              <div className="doc-output-title-row">
                <BookOpen size={15} />
                <h3>Innstilling</h3>
              </div>
              <p>Bruker de felles feltene over samt rektornavn, intervjuantall, stilling-ID og vedtaksinformasjon. Faglisten kan følge fagområdet automatisk.</p>
              <div className="doc-output-actions">
                <button className="btn btn-primary" onClick={() => generateInnstillingPDF(innstillingData)} type="button">
                  <Download size={16} />
                  Last ned PDF
                </button>
                <button className="btn btn-outline" onClick={() => generateInnstillingDOCX(innstillingData)} type="button">
                  <FileDown size={16} />
                  Last ned Word
                </button>
              </div>
            </div>

            <div className="doc-output-card">
              <div className="doc-output-title-row">
                <UserCheck size={15} />
                <h3>Tilsettingsvedtak</h3>
              </div>
              <p>Bruker de samme hovedopplysningene, men legger til intervjuteam, pronomen og tilsettingsperiode. Prosent og type kan følge stillingen automatisk.</p>
              <div className="doc-output-actions">
                <button className="btn btn-primary" onClick={() => generateTilsettingsvedtakPDF(tilsettingsvedtakData)} type="button">
                  <Download size={16} />
                  Last ned PDF
                </button>
                <button className="btn btn-outline" onClick={() => generateTilsettingsvedtakDOCX(tilsettingsvedtakData)} type="button">
                  <FileDown size={16} />
                  Last ned Word
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <Eye size={15} />
            <span className="form-card-title">Forhåndsvisning</span>
          </div>
          <div className="dual-preview-grid">
            <div>
              <div className="preview-panel-label">Innstilling</div>
              <div className="fullmakt-preview">
                <p className="fp-title" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {form.skolenavn || <span className="fp-placeholder">Skolens navn</span>}
                </p>
                <p className="fp-title" style={{ marginTop: 8 }}>INNSTILLING:</p>
                <p className="fp-body" style={{ marginBottom: 4 }}>
                  Undervisningsstilling i {form.fagomrade || <span className="fp-placeholder">fagområde</span>} – inntil {form.prosent || <span className="fp-placeholder">%</span>}% {form.stillingstype}
                </p>
                {form.stillingId && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>ID: {form.stillingId}</p>}
                <p className="fp-body">{innstillingBody1}</p>
                <p className="fp-body" style={{ marginTop: 8 }}>{innstillingBody2}</p>
                <p className="fp-signer" style={{ marginTop: 8 }}>
                  {form.kandidatnavn || <span className="fp-placeholder">Kandidatnavn</span>}: {candidatePercent || <span className="fp-placeholder">%</span>}%
                </p>
                <hr className="fp-rule" />
                <p className="fp-school">{form.skolenavn || <span className="fp-placeholder">Skolens navn</span>}, {form.utstedelsesdato || <span className="fp-placeholder">dato</span>}</p>
                <p className="fp-signer">{form.signaturnavn || <span className="fp-placeholder">Navn</span>}</p>
                <p className="fp-title-text">{resolvedTitle || <span className="fp-placeholder">Tittel</span>}</p>
                {logo && <div className="fp-logo"><img src={logo} alt="Logo" /></div>}
              </div>
            </div>

            <div>
              <div className="preview-panel-label">Tilsettingsvedtak</div>
              <div className="fullmakt-preview">
                <p className="fp-title">Tilsettingsvedtak</p>
                <p className="fp-body" style={{ marginBottom: 10 }}>
                  Undervisningsstilling{teamCount > 1 ? 'er' : ''} ved {form.skolenavn || <span className="fp-placeholder">skolens navn</span>}
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Intervjuteamet har bestått av:</p>
                {activeTeam.length > 0 ? activeTeam.map((member, index) => (
                  <p key={index} style={{ fontSize: 12, margin: '0 0 2px 0' }}>
                    <strong>{member.navn || 'Navn'}</strong>{member.tittel ? `  ${member.tittel}` : ''}
                  </p>
                )) : (
                  <p style={{ fontSize: 12, margin: '0 0 2px 0', color: 'var(--text-faint)', fontStyle: 'italic' }}>
                    Legg til minst ett medlem i intervjuteamet.
                  </p>
                )}
                <p className="fp-body" style={{ marginTop: 12, fontWeight: 600 }}>
                  Tilsetting i stilling{teamCount > 1 ? 'er' : ''} som {form.stillingstype} ved {form.skolenavn || <span className="fp-placeholder">skolens navn</span>}
                </p>
                <p className="fp-body">
                  Stilling innen {form.fagomrade || <span className="fp-placeholder">fagområde</span>} har vært lyst ledig … søknadsfrist {form.soeknadsfrist || <span className="fp-placeholder">dato</span>}. Det meldte seg {form.antallSokere || <span className="fp-placeholder">n</span>} søkere.
                </p>
                <p className="fp-signer" style={{ marginTop: 8 }}>
                  {form.kandidatnavn || <span className="fp-placeholder">Kandidatnavn</span>}: {candidatePercent || <span className="fp-placeholder">%</span>}% {resolvedKandidattype}
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
      </div>
    </div>
  )
}