import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs ?? pdfFonts

const C = {
  ink:    '#1C2B3A',
  silver: '#6B7280',
}

function normalizeCandidates({ kandidater = [], kandidatnavn = '', kandidatprosent = '' }) {
  const fromArray = kandidater
    .filter(candidate => candidate?.navn || candidate?.prosent)
    .map(candidate => ({
      navn: candidate.navn || '…',
      prosent: candidate.prosent || '…',
    }))

  if (fromArray.length > 0) return fromArray

  return [{
    navn: kandidatnavn || '…',
    prosent: kandidatprosent || '…',
  }]
}

function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural
}

export function generateInnstillingPDF(data) {
  const {
    skolenavn       = '',
    stillingstittel = '',
    fagomrade       = '',
    flereStillinger = false,
    stillingstype   = 'vikariat',
    stillingId      = '',
    soeknadsfrist   = '',
    antallSokere    = '',
    antallIntervju  = '',
    rektorNavn      = '',
    kandidatnavn    = '',
    kandidatprosent = '',
    vedtaksdato     = '',
    vedtakstid      = '',
    utstedelsesdato = '',
    signaturnavn    = '',
    signaturttittel = 'Rektor',
    logo            = null,
  } = data

  const candidates = normalizeCandidates(data)
  const candidateCount = candidates.length
  const interviewCount = Number(antallIntervju)
  const stillingOrd = flereStillinger ? 'Stillinger' : 'Stilling'
  const stillingTarget = flereStillinger ? 'stillingene' : 'stillingen'
  const body1 = `${stillingOrd} innen ${fagomrade || '…'} har vært lyst ledig eksternt med søknadsfrist ${soeknadsfrist || '…'}. Det meldte seg ${antallSokere || '…'} søkere til ${stillingTarget}. ${antallIntervju || '…'} ${pluralize(interviewCount, 'søker har', 'søkere har')} vært på intervju.`
  const body2 = `Etter en samlet vurdering av søkernes utdanning, faglige kompetanse, erfaring og personlige egnethet sett opp mot stillingsutlysningen, har fylkesrådmannen ved rektor ${rektorNavn || '…'} innstilt følgende til ${stillingTarget}:`
  const vedtakLine = vedtaksdato
    ? `Endelig tilsettingsvedtak gjøres av leder ${vedtaksdato}${vedtakstid ? ` – klokka ${vedtakstid}` : ''}`
    : null

  const dateStr = new Date().toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')
  const filename = kandidatnavn
    ? `Innstilling - ${dateStr} - ${kandidatnavn}.pdf`
    : `Innstilling - ${dateStr}.pdf`

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [101, 72, 101, logo ? 116 : 72],

    footer: logo
      ? { image: 'companyLogo', fit: [180, 100], alignment: 'center', margin: [0, 10, 0, 0] }
      : undefined,

    images: logo ? { companyLogo: logo } : {},

    defaultStyle: {
      font: 'Roboto',
      fontSize: 12,
      color: C.ink,
      lineHeight: 1.15,
    },

    content: [
      // Top spacer ~3"
      { text: '', margin: [0, 216, 0, 0] },

      { text: 'INNSTILLING', fontSize: 14, bold: true, margin: [0, 0, 0, 18] },

      { text: stillingstittel || '…', fontSize: 12, bold: true, margin: [0, 0, 0, 6] },

      // ID (optional)
      ...(stillingId.trim() ? [{ text: `ID: ${stillingId}`, fontSize: 11, color: C.silver, margin: [0, 0, 0, 14] }] : [{ text: '', margin: [0, 0, 0, 10] }]),

      // Body 1
      { text: body1, fontSize: 12, lineHeight: 1.5, margin: [0, 0, 0, 12] },

      // Body 2
      { text: body2, fontSize: 12, lineHeight: 1.5, margin: [0, 0, 0, 8] },

      ...candidates.map(candidate => ({
        text: `${candidate.navn}: ${candidate.prosent}%`,
        fontSize: 12,
        bold: true,
        margin: [0, 4, 0, 4],
      })),

      // Boilerplate blank + text
      { text: '', margin: [0, 12, 0, 0] },
      { text: `Dersom ${stillingTarget} ikke blir besatt med utgangspunkt i innstillingen, vurderes saken på ny.`, fontSize: 12, lineHeight: 1.5, margin: [0, 0, 0, 8] },

      // Vedtak line (optional)
      ...(vedtakLine ? [{ text: vedtakLine, fontSize: 12, margin: [0, 0, 0, 16] }] : []),

      // Sign-off gap + location/date
      { text: '', margin: [0, 14, 0, 0] },
      { text: `${skolenavn || '…'}, ${utstedelsesdato || '…'}`, fontSize: 12, margin: [0, 0, 0, 2] },

      // Gap before signer
      { text: '', margin: [0, 28, 0, 0] },

      // Signer name
      { text: signaturnavn, fontSize: 12, bold: true, margin: [0, 0, 0, 2] },

      // Signer title
      { text: signaturttittel, fontSize: 12, color: C.silver },
    ],
  }

  pdfMake.createPdf(docDefinition).download(filename)
}
