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

export function generateTilsettingsvedtakPDF(data) {
  const {
    skolenavn       = '',
    stillingstittel = '',
    stillingId      = '',
    fagomrade       = '',
    flereStillinger = false,
    stillingstype   = 'vikariat',
    soeknadsfrist   = '',
    antallSokere    = '',
    kandidatnavn    = '',
    kandidatprosent = '',
    kandidattype    = 'vikariat',
    pronomen        = 'Han',
    fraDato         = '',
    tilDato         = '',
    utstedelsesdato = '',
    signaturnavn    = '',
    signaturttittel = 'Rektor',
    team            = [],
    logo            = null,
  } = data

  const candidates = normalizeCandidates({ ...data })
  const candidateCount = candidates.length
  const stillingOrd = flereStillinger ? 'Stillinger' : 'Stilling'
  const stillingTarget = flereStillinger ? 'stillingene' : 'stillingen'
  const body1 = `${stillingOrd} innen ${fagomrade || '…'} har vært lyst ledig eksternt med søknadsfrist ${soeknadsfrist || '…'}. Det meldte seg ${antallSokere || '…'} søkere til ${stillingTarget}.`
  const body2 = 'Etter en samlet vurdering av søkernes utdanning, faglige kompetanse, erfaring og personlig egnethet tilsettes:'
  const tilsettingLine = candidateCount > 1
    ? `Kandidatene tilsettes i ${kandidattype} fra og med ${fraDato || '…'}${tilDato ? ` til og med ${tilDato}` : ''}`
    : `${pronomen} tilsettes i ${kandidattype} fra og med ${fraDato || '…'}${tilDato ? ` til og med ${tilDato}` : ''}`

  const dateStr = new Date().toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')
  const filename = kandidatnavn
    ? `Tilsettingsvedtak - ${dateStr} - ${kandidatnavn}.pdf`
    : `Tilsettingsvedtak - ${dateStr}.pdf`

  // Build team rows for PDF
  const teamRows = (team.length > 0 ? team : []).map(member => ({
    text: [
      { text: '- ' },
      { text: member.navn || '', bold: true },
      ...(member.tittel ? [{ text: ` (${member.tittel})`, color: C.silver }] : []),
    ],
    fontSize: 12,
    margin: [24, 0, 0, 2],
  }))

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
      // Single line break above the title
      { text: '', margin: [0, 0, 0, 12] },

      { text: 'TILSETTINGSVEDTAK', fontSize: 14, bold: true, margin: [0, 0, 0, 18] },

      { text: stillingstittel || '…', fontSize: 12, bold: true, margin: [0, 0, 0, 6] },

      ...(stillingId.trim() ? [{ text: `ID: ${stillingId}`, fontSize: 11, color: C.silver, margin: [0, 0, 0, 14] }] : [{ text: '', margin: [0, 0, 0, 10] }]),

      // Intervjuteam heading
      { text: 'Intervjuteamet har bestått av:', fontSize: 12, bold: true, margin: [0, 0, 0, 6] },

      // Team rows
      ...teamRows,

      // Gap
      { text: '', margin: [0, 18, 0, 0] },

      // Tilsetting heading
      {
        text: `Tilsetting i ${stillingstittel || '…'}`,
        fontSize: 12, bold: true, margin: [0, 0, 0, 10],
      },

      // Body 1
      { text: body1, fontSize: 12, lineHeight: 1.5, margin: [0, 0, 0, 10] },

      // Body 2
      { text: body2, fontSize: 12, lineHeight: 1.5, margin: [0, 0, 0, 6] },

      ...candidates.flatMap(candidate => ([
        {
          text: `- ${candidate.navn}`,
          fontSize: 12,
          bold: true,
          margin: [24, 2, 0, 0],
        },
        {
          text: `${candidate.prosent}% ${kandidattype}`,
          fontSize: 12,
          margin: [48, 0, 0, 4],
        },
      ])),

      // Tilsetting period
      { text: tilsettingLine, fontSize: 12, margin: [0, 0, 0, 16] },

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
