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

function createDefaultTeam() {
  return [
    { navn: '', tittel: '' },
    { navn: '', tittel: '' },
  ]
}

function createDefaultCandidates() {
  return [
    { navn: '', prosent: '' },
  ]
}

function createDefaultState() {
  return {
    skolenavn: '',
    stillingstittel: '',
    fagomrade: '',
    flereStillinger: false,
    stillingstype: 'vikariat',
    stillingId: '',
    soeknadsfrist: '',
    antallSokere: '',
    antallIntervju: '',
    rektorNavn: '',
    kandidater: createDefaultCandidates(),
    innstillingsdato: '',
    tilsettingsdato: '',
    vedtakstid: '',
    kandidattype: 'vikariat',
    syncKandidattype: true,
    pronomen: 'Han',
    fraDato: '',
    tilDato: '',
    signaturnavn: '',
    signaturttittel: 'Rektor',
    customTitle: '',
    team: createDefaultTeam(),
  }
}

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    if (!value) return fallback

    const parsed = JSON.parse(value)
    const restoredCandidates = Array.isArray(parsed.kandidater) && parsed.kandidater.length > 0
      ? parsed.kandidater
      : (parsed.kandidatnavn || parsed.kandidatprosent
          ? [{ navn: parsed.kandidatnavn || '', prosent: parsed.kandidatprosent || '' }]
          : fallback.kandidater)

    return {
      ...fallback,
      ...parsed,
      innstillingsdato: parsed.innstillingsdato ?? parsed.utstedelsesdato ?? '',
      tilsettingsdato: parsed.tilsettingsdato ?? parsed.vedtaksdato ?? parsed.utstedelsesdato ?? '',
      kandidater: restoredCandidates,
      team: Array.isArray(parsed.team) && parsed.team.length > 0 ? parsed.team : fallback.team,
    }
  } catch {
    return fallback
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

function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural
}

function formatPercent(value, fallback = '…') {
  return value ? `${value}%` : fallback
}

function sanitizePercentInput(value) {
  const cleaned = value.replace(/[^\d.,]/g, '')
  const firstSeparatorIndex = cleaned.search(/[.,]/)

  if (firstSeparatorIndex === -1) return cleaned

  const whole = cleaned.slice(0, firstSeparatorIndex)
  const separator = cleaned[firstSeparatorIndex]
  const decimals = cleaned.slice(firstSeparatorIndex + 1).replace(/[.,]/g, '')
  return `${whole}${separator}${decimals}`
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

  function setCandidate(index, field, value) {
    setForm(previous => {
      const kandidater = [...previous.kandidater]
      kandidater[index] = { ...kandidater[index], [field]: value }
      return { ...previous, kandidater }
    })
  }

  function addCandidate() {
    setForm(previous => ({
      ...previous,
      kandidater: [...previous.kandidater, { navn: '', prosent: '' }],
    }))
  }

  function removeCandidate(index) {
    setForm(previous => ({
      ...previous,
      kandidater: previous.kandidater.filter((_, currentIndex) => currentIndex !== index),
    }))
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
  const resolvedKandidattype = form.syncKandidattype ? form.stillingstype : form.kandidattype
  const activeCandidates = form.kandidater.filter(candidate => candidate.navn.trim() || candidate.prosent.trim())
  const candidatesForDocuments = activeCandidates.length > 0
    ? activeCandidates.map(candidate => ({
        navn: candidate.navn.trim(),
        prosent: candidate.prosent.trim(),
      }))
    : [{ navn: '', prosent: '' }]
  const activeTeam = form.team.filter(member => member.navn.trim() || member.tittel.trim())
  const hasMultipleCandidates = activeCandidates.length > 1
  const stillingOrd = form.flereStillinger ? 'Stillinger' : 'Stilling'
  const stillingTarget = form.flereStillinger ? 'stillingene' : 'stillingen'

  const innstillingData = {
    skolenavn: form.skolenavn,
    stillingstittel: form.stillingstittel,
    fagomrade: form.fagomrade,
    flereStillinger: form.flereStillinger,
    stillingstype: form.stillingstype,
    stillingId: form.stillingId,
    soeknadsfrist: form.soeknadsfrist,
    antallSokere: form.antallSokere,
    antallIntervju: form.antallIntervju,
    rektorNavn: form.rektorNavn,
    kandidater: candidatesForDocuments,
    vedtaksdato: form.tilsettingsdato,
    vedtakstid: form.vedtakstid,
    utstedelsesdato: form.innstillingsdato,
    signaturnavn: form.signaturnavn,
    signaturttittel: resolvedTitle,
    logo,
  }

  const tilsettingsvedtakData = {
    skolenavn: form.skolenavn,
    stillingstittel: form.stillingstittel,
    stillingId: form.stillingId,
    fagomrade: form.fagomrade,
    flereStillinger: form.flereStillinger,
    stillingstype: form.stillingstype,
    soeknadsfrist: form.soeknadsfrist,
    antallSokere: form.antallSokere,
    kandidater: candidatesForDocuments,
    kandidattype: resolvedKandidattype,
    pronomen: form.pronomen,
    fraDato: form.fraDato,
    tilDato: form.tilDato,
    utstedelsesdato: form.tilsettingsdato,
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

  const interviewCount = Number(form.antallIntervju)
  const innstillingBody1 = `${stillingOrd} innen ${form.fagomrade || '…'} har vært lyst ledig eksternt med søknadsfrist ${form.soeknadsfrist || '…'}. Det meldte seg ${form.antallSokere || '…'} søkere til ${stillingTarget}. ${form.antallIntervju || '…'} ${pluralize(interviewCount, 'søker har', 'søkere har')} vært på intervju.`
  const innstillingBody2 = `Etter en samlet vurdering av søkernes utdanning, faglige kompetanse, erfaring og personlige egnethet sett opp mot stillingsutlysningen, har fylkesrådmannen ved rektor ${form.rektorNavn || '…'} innstilt følgende til ${stillingTarget}:`
  const vedtakPreview = form.tilsettingsdato
    ? `Endelig tilsettingsvedtak gjøres av leder ${form.tilsettingsdato}${form.vedtakstid ? ` – klokka ${form.vedtakstid}` : ''}`
    : ''
  const tilsettingsBody1 = `${stillingOrd} innen ${form.fagomrade || '…'} har vært lyst ledig eksternt med søknadsfrist ${form.soeknadsfrist || '…'}. Det meldte seg ${form.antallSokere || '…'} søkere til ${stillingTarget}.`
  const tilsettingsBody2 = 'Etter en samlet vurdering av søkernes utdanning, faglige kompetanse, erfaring og personlige egnethet tilsettes:'
  const tilsettingPreview = hasMultipleCandidates
    ? `Kandidatene tilsettes i ${resolvedKandidattype} fra og med ${form.fraDato || '…'}${form.tilDato ? ` til og med ${form.tilDato}` : ''}`
    : `${form.pronomen} tilsettes i ${resolvedKandidattype} fra og med ${form.fraDato || '…'}${form.tilDato ? ` til og med ${form.tilDato}` : ''}`

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
            <Field label="Stillingstittel (fra Jobbnorge e.l.)" span="full">
              <Input value={form.stillingstittel} onChange={value => set('stillingstittel', value)} placeholder="Undervisningsstilling i realfag" />
            </Field>
            <Field label="Fag eller fagområde" span="full">
              <Input value={form.fagomrade} onChange={value => set('fagomrade', value)} placeholder="Realfag" />
            </Field>
            <Field span="full">
              <SyncToggle
                checked={form.flereStillinger}
                onChange={checked => set('flereStillinger', checked)}
                label="Flere stillinger"
              />
            </Field>
            <Field label="Stillingstype">
              <Select value={form.stillingstype} onChange={value => set('stillingstype', value)} options={STILLINGSTYPE_OPTIONS} />
            </Field>
            <Field label="Stillings-ID">
              <Input value={form.stillingId} onChange={value => set('stillingId', value)} placeholder="32131231" />
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
            <span className="form-card-title">Kandidater</span>
          </div>
          <div className="candidate-list">
            {form.kandidater.map((candidate, index) => (
              <div key={index} className="candidate-row">
                <div className="candidate-row-fields">
                  <Field label="Kandidatnavn">
                    <Input
                      value={candidate.navn}
                      onChange={value => setCandidate(index, 'navn', value)}
                      placeholder="Stine P"
                    />
                  </Field>
                  <Field label="Stillingsprosent">
                    <div className="input-with-suffix">
                      <Input
                        value={candidate.prosent}
                        onChange={value => setCandidate(index, 'prosent', sanitizePercentInput(value))}
                        placeholder="55"
                        inputMode="decimal"
                        maxLength={6}
                      />
                      <span className="input-suffix">%</span>
                    </div>
                  </Field>
                </div>
                {form.kandidater.length > 1 && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => removeCandidate(index)}
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
              <button className="btn btn-outline btn-sm" onClick={addCandidate} style={{ marginTop: 4 }} type="button">
                <Plus size={13} />
                Legg til kandidat
              </button>
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <UserCheck size={15} />
            <span className="form-card-title">Tilsettings- og innstillingsinfo</span>
          </div>
          <div className="form-grid">
            <Field label="Rektors navn (som innstiller)" hint="Brukes i innstilling.">
              <Input value={form.rektorNavn} onChange={value => set('rektorNavn', value)} placeholder="Sascha Njaa Tjelta" />
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
            {!hasMultipleCandidates && (
              <Field label="Pronomen" hint="Brukes når bare én kandidat tilsettes.">
                <Select value={form.pronomen} onChange={value => set('pronomen', value)} options={PRONOMEN_OPTIONS} />
              </Field>
            )}
            <Field label="Fra dato" hint="Brukes i tilsettingsvedtak.">
              <DatePicker value={form.fraDato} onChange={value => set('fraDato', value)} />
            </Field>
            <Field label="Til dato (valgfritt)" hint="Brukes i tilsettingsvedtak.">
              <DatePicker value={form.tilDato} onChange={value => set('tilDato', value)} clearable />
            </Field>
            <Field label="Dato for innstilling" hint="Brukes som signaturdato i innstilling.">
              <DatePicker value={form.innstillingsdato} onChange={value => set('innstillingsdato', value)} />
            </Field>
            <Field label="Dato for tilsetting" hint="Brukes som signaturdato i tilsettingsvedtak og vedtaksdato i innstilling.">
              <DatePicker value={form.tilsettingsdato} onChange={value => set('tilsettingsdato', value)} />
            </Field>
            <Field label="Klokkeslett">
              <Input value={form.vedtakstid} onChange={value => set('vedtakstid', value)} placeholder="15:00" />
            </Field>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <Users size={15} />
            <span className="form-card-title">Intervjuteam</span>
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
                    placeholder="Rolle"
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
            <Field label="Signaturnavn">
              <Input value={form.signaturnavn} onChange={value => set('signaturnavn', value)} placeholder="Sascha Njaa Tjelta" />
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
              <p>Bruker stillingstittel, ID, felles stillingsopplysninger og alle kandidater i en liste som matcher innstillingen bedre.</p>
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
              <p>Bruker samme stillingstittel og kandidatliste, og bytter automatisk til flertall når flere kandidater tilsettes.</p>
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
                <p className="fp-title">INNSTILLING</p>
                <p className="fp-signer" style={{ marginBottom: 6 }}>{form.stillingstittel || <span className="fp-placeholder">Stillingstittel</span>}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>ID: {form.stillingId || <span className="fp-placeholder">ID</span>}</p>
                <p className="fp-body" style={{ marginBottom: 18 }}>{innstillingBody1}</p>
                <p className="fp-body" style={{ marginBottom: 18 }}>{innstillingBody2}</p>
                {(activeCandidates.length > 0 ? activeCandidates : [{ navn: '', prosent: '' }]).map((candidate, index) => (
                  <p className="fp-signer" style={{ marginTop: index === 0 ? 0 : 8 }} key={index}>
                    {candidate.navn || <span className="fp-placeholder">Kandidatnavn</span>}: {formatPercent(candidate.prosent)}
                  </p>
                ))}
                <p className="fp-body" style={{ marginTop: 28, marginBottom: 18 }}>
                  Dersom {stillingTarget} ikke blir besatt med utgangspunkt i innstillingen, vurderes saken på ny.
                </p>
                {vedtakPreview && <p className="fp-body" style={{ marginBottom: 18 }}>{vedtakPreview}</p>}
                <p className="fp-school">{form.skolenavn || <span className="fp-placeholder">Skolens navn</span>}, {form.innstillingsdato || <span className="fp-placeholder">dato</span>}</p>
                <p className="fp-signer">{form.signaturnavn || <span className="fp-placeholder">Navn</span>}</p>
                <p className="fp-title-text">{resolvedTitle || <span className="fp-placeholder">Tittel</span>}</p>
                {logo && <div className="fp-logo"><img src={logo} alt="Logo" /></div>}
              </div>
            </div>

            <div>
              <div className="preview-panel-label">Tilsettingsvedtak</div>
              <div className="fullmakt-preview">
                <p className="fp-title">TILSETTINGSVEDTAK</p>
                <p className="fp-signer" style={{ marginBottom: 6 }}>{form.stillingstittel || <span className="fp-placeholder">Stillingstittel</span>}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>ID: {form.stillingId || <span className="fp-placeholder">ID</span>}</p>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Intervjuteamet har bestått av:</p>
                {activeTeam.length > 0 ? activeTeam.map((member, index) => (
                  <p key={index} style={{ fontSize: 12, margin: '0 0 2px 0' }}>
                    <strong>{member.navn || 'Navn'}</strong>{member.tittel ? `  ${member.tittel}` : ''}
                  </p>
                )) : (
                  <p style={{ fontSize: 12, margin: '0 0 16px 0', color: 'var(--text-faint)', fontStyle: 'italic' }}>
                    Legg til minst ett medlem i intervjuteamet.
                  </p>
                )}
                <p className="fp-signer" style={{ marginTop: 24, marginBottom: 8 }}>
                  Tilsetting i {form.stillingstittel || <span className="fp-placeholder">stillingstittel</span>}
                </p>
                <p className="fp-body" style={{ marginBottom: 12 }}>{tilsettingsBody1}</p>
                <p className="fp-body" style={{ marginBottom: 10 }}>{tilsettingsBody2}</p>
                {(activeCandidates.length > 0 ? activeCandidates : [{ navn: '', prosent: '' }]).map((candidate, index) => (
                  <p key={index} style={{ fontSize: 13.5, margin: '0 0 6px 24px' }}>
                    - {candidate.navn || <span className="fp-placeholder">Kandidatnavn</span>}: {formatPercent(candidate.prosent)} {resolvedKandidattype}
                  </p>
                ))}
                <p className="fp-body" style={{ marginTop: 22, marginBottom: 18 }}>{tilsettingPreview}</p>
                <p className="fp-school">{form.skolenavn || <span className="fp-placeholder">Skolens navn</span>}, {form.tilsettingsdato || <span className="fp-placeholder">dato</span>}</p>
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