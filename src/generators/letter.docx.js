import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  BorderStyle,
  AlignmentType,
  convertInchesToTwip,
} from 'docx'

async function prepareLogoForDocx(dataUrl, maxWidthPt = 110) {
  const dims = await new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve({ w: 110, h: 55 })
    img.src = dataUrl
  })
  const scale = Math.min(maxWidthPt / dims.w, 1)
  const w = Math.round(dims.w * scale)
  const h = Math.round(dims.h * scale)
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const type = dataUrl.includes('png') ? 'png' : dataUrl.includes('gif') ? 'gif' : 'jpg'
  return { data: bytes, transformation: { width: w, height: h }, type }
}

function twip(inches) {
  return convertInchesToTwip(inches)
}

function run(text, opts = {}) {
  return new TextRun({
    text,
    font: 'Calibri',
    size: opts.size || 22,
    bold: opts.bold || false,
    color: opts.color || '1C2B3A',
    italics: opts.italic || false,
    break: opts.break || undefined,
  })
}

function para(children, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: {
      before: opts.before ?? 0,
      after: opts.after ?? 0,
      line: opts.line ?? 360, // 1.5 line spacing
    },
    border: opts.border || undefined,
    children: Array.isArray(children) ? children : [children],
  })
}

function accentLine(color = '2563EB') {
  return new Paragraph({
    spacing: { before: 0, after: 0 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 12, color, space: 4 },
    },
    children: [],
  })
}

function divider() {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB', space: 4 },
    },
    children: [],
  })
}

export async function generateLetterDOCX(data) {
  const { sender, recipient, details, paragraphs, closing, logo = null, colors = {} } = data
  const primaryHex = (colors.primary || '#1E3A5F').replace('#', '')
  const accentHex  = (colors.accent  || '#2563EB').replace('#', '')

  let logoImageProps = null
  if (logo) {
    logoImageProps = await prepareLogoForDocx(logo, 110)
  }

  const senderLines = (sender.address || '').split('\n').filter(Boolean)
  const recipientLines = (recipient.address || '').split('\n').filter(Boolean)
  const bodyParagraphs = paragraphs.filter(p => p.text.trim())
  const salutation = details.salutation || 'Dear'
  const greeting = recipient.name
    ? `${salutation} ${recipient.name},`
    : `${salutation} Sir or Madam,`

  const filename = (recipient.name || 'letter').toLowerCase().replace(/\s+/g, '-')

  const contactParts = [sender.phone, sender.email, sender.website].filter(Boolean)

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: twip(1),
            bottom: twip(1),
            left: twip(1.25),
            right: twip(1.25),
          },
        },
      },
      children: [
        // ─── Logo ─────────────────────────────────────────────────
        ...(logoImageProps
          ? [new Paragraph({ spacing: { before: 0, after: 120 }, children: [new ImageRun({ ...logoImageProps })] })]
          : []),
        // ─── Company name ──────────────────────────────────────────
        para(
          run(sender.company || 'Your Company', { bold: true, size: 36, color: primaryHex }),
          { after: 60 }
        ),
        // Contact info
        ...(contactParts.length > 0
          ? [para(run(contactParts.join('  ·  '), { size: 18, color: '64748B' }), { after: 0 })]
          : []),
        // Address below company name
        ...(senderLines.length > 0
          ? [para(run(senderLines.join('  ·  '), { size: 18, color: '64748B' }), { after: 0 })]
          : []),
        // Blue accent underline
        accentLine(accentHex),

        // ─── Date ─────────────────────────────────────────────────
        para(run(details.date || '', { size: 20, color: '374151' }), { before: 400, after: 0 }),

        // ─── Recipient ────────────────────────────────────────────
        ...(recipient.name
          ? [para(run(recipient.name, { bold: true, size: 22, color: primaryHex }), { before: 300, after: 0 })]
          : []),
        ...(recipient.title
          ? [para(run(recipient.title, { size: 20, color: '4B5563' }), { before: 0, after: 0 })]
          : []),
        ...(recipient.company
          ? [para(run(recipient.company, { size: 20, color: '4B5563' }), { before: 0, after: 0 })]
          : []),
        ...recipientLines.map(l => para(run(l, { size: 20, color: '4B5563' }), { before: 0, after: 0 })),

        // ─── Subject ──────────────────────────────────────────────
        ...(details.subject
          ? [
              para(run(details.subject, { bold: true, size: 22, color: primaryHex }), { before: 360, after: 0 }),
              divider(),
            ]
          : []),

        // ─── Salutation ───────────────────────────────────────────
        para(run(greeting, { size: 22, color: '374151' }), { before: 300, after: 0 }),

        // ─── Body paragraphs ──────────────────────────────────────
        ...bodyParagraphs.map(p =>
          para(run(p.text, { size: 22, color: '374151' }), { before: 240, after: 0, line: 368 })
        ),

        // ─── Closing ──────────────────────────────────────────────
        para(run(`${closing.phrase || 'Sincerely'},`, { size: 22, color: '374151' }), { before: 480, after: 0 }),
        // Signature space
        para(run('', { size: 22 }), { before: 600, after: 0 }),
        ...(closing.name
          ? [para(run(closing.name, { bold: true, size: 22, color: primaryHex }), { before: 0, after: 0 })]
          : []),
        ...(closing.title
          ? [para(run(closing.title, { size: 20, color: '4B5563' }), { before: 0, after: 0 })]
          : []),
        ...(sender.company
          ? [para(run(sender.company, { size: 20, color: '4B5563' }), { before: 0, after: 0 })]
          : []),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-letter.docx`
  a.click()
  URL.revokeObjectURL(url)
}
