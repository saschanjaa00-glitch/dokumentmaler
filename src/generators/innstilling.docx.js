import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Footer,
  AlignmentType,
  convertInchesToTwip,
} from 'docx'

function twip(val) {
  return convertInchesToTwip(val)
}

async function prepareLogoForDocx(dataUrl, maxWidthPt = 200) {
  if (!dataUrl) return null
  const dims = await new Promise(resolve => {
    const img = new Image()
    img.onload  = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve({ w: 120, h: 60 })
    img.src = dataUrl
  })
  const scale  = Math.min(maxWidthPt / dims.w, 1)
  const w = Math.round(dims.w * scale)
  const h = Math.round(dims.h * scale)
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes  = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const type = dataUrl.includes('png') ? 'png' : dataUrl.includes('gif') ? 'gif' : 'jpg'
  return { data: bytes, transformation: { width: w, height: h }, type }
}

function run(text, opts = {}) {
  return new TextRun({
    text,
    font: 'Calibri',
    size: opts.size || 24,
    bold: opts.bold || false,
    color: opts.color || '1C2B3A',
    allCaps: opts.allCaps || false,
  })
}

function para(children, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: {
      before: opts.before ?? 0,
      after:  opts.after  ?? 0,
      line:   opts.line   ?? 276,
    },
    children: Array.isArray(children) ? children : [children],
  })
}

function normalizeCandidates({ kandidater = [], kandidatnavn = '', kandidatprosent = '', prosent = '' }) {
  const fromArray = kandidater
    .filter(candidate => candidate?.navn || candidate?.prosent)
    .map(candidate => ({
      navn: candidate.navn || '…',
      prosent: candidate.prosent || prosent || '…',
    }))

  if (fromArray.length > 0) return fromArray

  return [{
    navn: kandidatnavn || '…',
    prosent: kandidatprosent || prosent || '…',
  }]
}

function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural
}

export async function generateInnstillingDOCX(data) {
  const {
    skolenavn       = '',
    stillingstittel = '',
    fagomrade       = '',
    fagene          = '',
    prosent         = '',
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

  const candidates = normalizeCandidates({ ...data, prosent })
  const candidateCount = candidates.length
  const interviewCount = Number(antallIntervju)

  const logoData = logo ? await prepareLogoForDocx(logo, 200) : null

  const footerChildren = logoData
    ? [new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [new ImageRun({
          data: logoData.data,
          transformation: logoData.transformation,
          type: logoData.type,
        })],
      })]
    : [new Paragraph({ children: [] })]

  const soeknadsFristText = soeknadsfrist ? soeknadsfrist : '…'
  const sokereText = antallSokere ? antallSokere : '…'
  const intervjuText = antallIntervju ? antallIntervju : '…'

  const body1 = `Stilling innen fagene ${fagene || fagomrade || '…'} har vært lyst ledig eksternt med søknadsfrist ${soeknadsFristText}. Det meldte seg ${sokereText} søkere til ${candidateCount > 1 ? 'stillingene' : 'stillingen'}. ${intervjuText} ${pluralize(interviewCount, 'søker har', 'søkere har')} vært på intervju.`
  const body2 = `Etter en samlet vurdering av søkernes utdanning, faglige kompetanse, erfaring og personlige egnethet sett opp mot stillingsutlysningen, har fylkesrådmannen ved rektor ${rektorNavn || '…'} innstilt følgende til ${candidateCount > 1 ? 'stillingene' : 'stillingen'}:`
  const vedtakLine = vedtaksdato
    ? `Endelig tilsettingsvedtak gjøres av leder ${vedtaksdato}${vedtakstid ? ` – klokka ${vedtakstid}` : ''}`
    : ''

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top:    twip(1.0),
            bottom: twip(logoData ? 1.6 : 1.0),
            left:   twip(1.4),
            right:  twip(1.4),
          },
        },
      },
      footers: {
        default: new Footer({ children: footerChildren }),
      },
      children: [
        // Top spacer — ~3" from top
        para([], { before: 4320, after: 0 }),

        para([run('INNSTILLING', { bold: true, size: 26 })], { after: 220 }),

        para([run(stillingstittel || '…', { bold: true, size: 24 })], { after: 100 }),

        // ID (optional)
        ...(stillingId.trim() ? [
          para([run(`ID: ${stillingId}`, { size: 22, color: '6B7280' })], { after: 200 }),
        ] : [para([], { after: 120 })]),

        // Body 1
        para([run(body1)], { after: 200, line: 360 }),

        // Body 2
        para([run(body2)], { after: 160, line: 360 }),

        ...candidates.map(candidate => (
          para([run(`${candidate.navn}: ${candidate.prosent}%`, { bold: true })], { before: 80, after: 40 })
        )),

        // Boilerplate
        para([], { after: 120 }),
        para([run(`Dersom ${candidateCount > 1 ? 'stillingene' : 'stillingen'} ikke blir besatt med utgangspunkt i innstillingen, vurderes saken på ny.`)], { after: 120, line: 360 }),

        // Vedtak line (optional)
        ...(vedtakLine ? [para([run(vedtakLine)], { after: 200 })] : []),

        // Two blank lines before sign-off
        para([], { after: 0 }),
        para([], { after: 0 }),

        // Sign-off: Skolenavn, dato
        para([run(`${skolenavn || '…'}, ${utstedelsesdato || '…'}`)], { after: 0 }),

        // Two blank lines before signature
        para([], { after: 0 }),
        para([], { after: 0 }),

        // Signer name (bold)
        para([run(signaturnavn, { bold: true })], { after: 0, line: 240 }),

        // Signer title
        para([run(signaturttittel, { color: '6B7280' })], { after: 0, line: 240 }),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  const dateStr = new Date().toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')
  const filename = kandidatnavn
    ? `Innstilling - ${dateStr} - ${kandidatnavn}.docx`
    : `Innstilling - ${dateStr}.docx`
  a.href     = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
