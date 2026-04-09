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

async function prepareLogoForDocx(dataUrl, maxWidthPt = 120) {
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

export async function generateFullmaktDOCX(data) {
  const {
    name          = '',
    dob           = '',
    percent       = '',
    stillingstype = 'vikarstilling',
    fromDate      = '',
    toDate        = '',
    fag           = '',
    schoolName    = '',
    signerName    = '',
    signerTitle   = 'Konstituert rektor',
    logo          = null,
  } = data

  const dobPart = dob.trim() ? ` (født ${dob.trim()})` : ''
  const fagPart = fag.trim() ? ` i ${fag.trim()}` : ''
  const bodyText =
    `${name}${dobPart} ansettes på rektors fullmakt i en ${percent}% ${stillingstype} i perioden ${fromDate} – ${toDate}, på bakgrunn av oppstått undervisningsbehov${fagPart}.`

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
        // Title — before: 4320 twips = 3.0" → content starts at ~34% from top
        para(
          [run('Rektorfullmakt – ', { size: 28, bold: true }), run(name, { size: 28, bold: true })],
          { before: 4320, after: 280 }
        ),

        // Empty line
        para([], { after: 160 }),

        // Body paragraph
        para([run(bodyText)], { after: 480, line: 360 }),

        // School name (optional)
        ...(schoolName.trim() ? [para([run(schoolName)], { before: 0, after: 160 })] : []),

        // Two blank lines before signer
        para([], { after: 0 }),
        para([], { after: 0 }),

        // Signer name (bold)
        para([run(signerName, { bold: true })], { after: 0, line: 240 }),

        // Signer title
        para([run(signerTitle, { color: '6B7280' })], { after: 0, line: 240 }),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  const dateStr = new Date().toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')
  const filename = name
    ? `Rektorfullmakt - ${dateStr} - ${name}.docx`
    : `Rektorfullmakt - ${dateStr}.docx`
  a.href     = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
