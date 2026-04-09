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

export async function generateTilsettingsvedtakDOCX(data) {
  const {
    skolenavn       = '',
    stillingstittel = '',
    stillingId      = '',
    fagomrade       = '',
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

  const body1 = `Stilling innen ${fagomrade || '…'} har vært lyst ledig eksternt med søknadsfrist ${soeknadsfrist || '…'}. Det meldte seg ${antallSokere || '…'} søkere til ${candidateCount > 1 ? 'stillingene' : 'stillingen'}.`
  const body2 = 'Etter en samlet vurdering av søkernes utdanning, faglige kompetanse, erfaring og personlig egnethet tilsettes:'
  const tilsettingLine = candidateCount > 1
    ? `Kandidatene tilsettes i ${kandidattype} fra og med ${fraDato || '…'}${tilDato ? ` til og med ${tilDato}` : ''}`
    : `${pronomen} tilsettes i ${kandidattype} fra og med ${fraDato || '…'}${tilDato ? ` til og med ${tilDato}` : ''}`

  // Build team paragraphs
  const teamParas = (team.length > 0 ? team : []).flatMap(member => [
    para([
      run(member.navn || '', { bold: true }),
      run(member.tittel ? `  ${member.tittel}` : '', { color: '6B7280' }),
    ], { after: 40 }),
  ])

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
        // Top spacer
        para([], { before: 4320, after: 0 }),

        para([run('TILSETTINGSVEDTAK', { size: 28, bold: true })], { after: 220 }),

        para([run(stillingstittel || '…', { size: 24, bold: true })], { after: 100 }),

        ...(stillingId.trim()
          ? [para([run(`ID: ${stillingId}`, { size: 22, color: '6B7280' })], { after: 180 })]
          : [para([], { after: 120 })]),

        // Intervjuteam heading
        para([run('Intervjuteamet har bestått av:', { bold: true })], { after: 80 }),

        // Team members
        ...teamParas,

        // Blank line after team
        para([], { before: 100, after: 120 }),

        // Tilsetting heading
        para([run(`Tilsetting i ${stillingstittel || '…'}`, { bold: true })], { after: 160 }),

        // Body 1
        para([run(body1)], { after: 160, line: 360 }),

        // Body 2
        para([run(body2)], { after: 120, line: 360 }),

        ...candidates.map(candidate => (
          para([run(`- ${candidate.navn}: ${candidate.prosent}% ${kandidattype}`)], { before: 40, after: 20 })
        )),

        // Tilsetting period
        para([run(tilsettingLine)], { after: 160 }),

        // Two blank lines before sign-off
        para([], { after: 0 }),
        para([], { after: 0 }),

        // Sign-off: Skolenavn, dato
        para([run(`${skolenavn || '…'}, ${utstedelsesdato || '…'}`)], { after: 0 }),

        // Two blank lines before signature
        para([], { after: 0 }),
        para([], { after: 0 }),

        // Signer name
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
    ? `Tilsettingsvedtak - ${dateStr} - ${kandidatnavn}.docx`
    : `Tilsettingsvedtak - ${dateStr}.docx`
  a.href     = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
