import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  HeadingLevel,
  convertInchesToTwip,
} from 'docx'

async function prepareLogoForDocx(dataUrl, maxWidthPt = 120) {
  const dims = await new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve({ w: 120, h: 60 })
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

function noBorder() {
  return {
    top: { style: BorderStyle.NONE, size: 0 },
    bottom: { style: BorderStyle.NONE, size: 0 },
    left: { style: BorderStyle.NONE, size: 0 },
    right: { style: BorderStyle.NONE, size: 0 },
  }
}

function thinBottomBorder() {
  return {
    top: { style: BorderStyle.NONE, size: 0 },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
    left: { style: BorderStyle.NONE, size: 0 },
    right: { style: BorderStyle.NONE, size: 0 },
  }
}

function darkShade(fill = '0F172A') {
  return { fill, type: ShadingType.CLEAR, color: 'auto' }
}

function altShade() {
  return { fill: 'F8FAFC', type: ShadingType.CLEAR, color: 'auto' }
}

function fmt(amount, currency = 'USD') {
  if (currency === 'JPY') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function makeCell(text, opts = {}) {
  const {
    bold = false,
    color = '1E293B',
    size = 20, // half-points (10pt)
    align = AlignmentType.LEFT,
    shade = null,
    borders = noBorder(),
    width = null,
    italic = false,
  } = opts

  const cellProps = {
    borders,
    shading: shade || undefined,
    ...(width ? { width: { size: width, type: WidthType.DXA } } : {}),
  }

  return new TableCell({
    ...cellProps,
    children: [
      new Paragraph({
        alignment: align,
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({
            text: String(text),
            bold,
            color,
            size,
            italics: italic,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  })
}

export async function generateInvoiceDOCX(data) {
  const { company, client, invoice, items, extra, logo = null, colors = {} } = data
  const primaryHex = (colors.primary || '#0F172A').replace('#', '')
  const accentHex  = (colors.accent  || '#F59E0B').replace('#', '')

  let logoImageProps = null
  if (logo) {
    logoImageProps = await prepareLogoForDocx(logo, 110)
  }

  const currency = invoice.currency || 'USD'
  const taxRate = parseFloat(extra.taxRate) || 0
  const subtotal = items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0), 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax

  const companyLines = (company.address || '').split('\n').filter(Boolean)
  const clientLines = (client.address || '').split('\n').filter(Boolean)

  // Helper to make a label-value row in the meta table
  const metaRow = (label, value) =>
    new TableRow({
      children: [
        makeCell(label, { color: '64748B', size: 18, borders: thinBottomBorder() }),
        makeCell(value, { bold: true, color: '0F172A', size: 18, align: AlignmentType.RIGHT, borders: thinBottomBorder() }),
      ],
    })

  // Invoice meta table (dates / currency)
  const metaTable = new Table({
    width: { size: 2800, type: WidthType.DXA },
    borders: { insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE }, ...noBorder() },
    rows: [
      metaRow('Issue Date', fmtDate(invoice.issueDate)),
      metaRow('Due Date', fmtDate(invoice.dueDate)),
      metaRow('Currency', currency),
    ],
  })

  // Items table
  const itemTableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        makeCell('DESCRIPTION', { bold: true, color: 'FFFFFF', size: 18, shade: darkShade(primaryHex) }),
        makeCell('QTY', { bold: true, color: 'FFFFFF', size: 18, align: AlignmentType.CENTER, shade: darkShade(primaryHex), width: 700 }),
        makeCell('UNIT PRICE', { bold: true, color: 'FFFFFF', size: 18, align: AlignmentType.RIGHT, shade: darkShade(primaryHex), width: 1400 }),
        makeCell('AMOUNT', { bold: true, color: 'FFFFFF', size: 18, align: AlignmentType.RIGHT, shade: darkShade(primaryHex), width: 1400 }),
      ],
    }),
    ...(items.length > 0
      ? items.map((item, i) => {
          const qty = parseFloat(item.quantity) || 0
          const price = parseFloat(item.unitPrice) || 0
          const shade = i % 2 !== 0 ? altShade() : null
          return new TableRow({
            children: [
              makeCell(item.description || '—', { color: '1E293B', shade, borders: thinBottomBorder() }),
              makeCell(String(qty), { color: '1E293B', align: AlignmentType.CENTER, shade, borders: thinBottomBorder(), width: 700 }),
              makeCell(fmt(price, currency), { color: '1E293B', align: AlignmentType.RIGHT, shade, borders: thinBottomBorder(), width: 1400 }),
              makeCell(fmt(qty * price, currency), { color: '1E293B', align: AlignmentType.RIGHT, shade, borders: thinBottomBorder(), width: 1400 }),
            ],
          })
        })
      : [new TableRow({
          children: [
            new TableCell({
              columnSpan: 4,
              borders: noBorder(),
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No items added', color: '94A3B8', size: 20, font: 'Calibri' })] })],
            }),
          ],
        })]),
  ]

  // Totals
  const totalRows = [
    new TableRow({
      children: [
        makeCell('Subtotal', { color: '64748B', size: 18, borders: thinBottomBorder() }),
        makeCell(fmt(subtotal, currency), { color: '1E293B', size: 18, align: AlignmentType.RIGHT, borders: thinBottomBorder() }),
      ],
    }),
    ...(taxRate > 0
      ? [new TableRow({
          children: [
            makeCell(`Tax (${taxRate}%)`, { color: '64748B', size: 18, borders: thinBottomBorder() }),
            makeCell(fmt(tax, currency), { color: '1E293B', size: 18, align: AlignmentType.RIGHT, borders: thinBottomBorder() }),
          ],
        })]
      : []),
    new TableRow({
      children: [
        makeCell('TOTAL DUE', { bold: true, color: 'FFFFFF', shade: darkShade(primaryHex) }),
        makeCell(fmt(total, currency), { bold: true, color: accentHex, shade: darkShade(primaryHex), align: AlignmentType.RIGHT }),
      ],
    }),
  ]

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: twip(0.75),
            bottom: twip(0.75),
            left: twip(0.9),
            right: twip(0.9),
          },
        },
      },
      children: [
        // Logo
        ...(logoImageProps
          ? [new Paragraph({ spacing: { before: 0, after: 160 }, children: [new ImageRun({ ...logoImageProps })] })]
          : []),
        // Company name
        new Paragraph({
          spacing: { before: 0, after: 80 },
          children: [
            new TextRun({ text: company.name || 'Your Company', bold: true, size: 40, color: primaryHex, font: 'Calibri' }),
          ],
        }),
        // Tagline
        ...(company.tagline
          ? [new Paragraph({ spacing: { before: 0, after: 200 }, children: [new TextRun({ text: company.tagline, size: 18, color: '64748B', font: 'Calibri' })] })]
          : [new Paragraph({ spacing: { before: 0, after: 200 }, children: [] })]),
        // "INVOICE" heading + number
        new Paragraph({
          spacing: { before: 0, after: 60 },
          children: [
            new TextRun({ text: 'INVOICE', bold: true, size: 52, color: accentHex, font: 'Calibri' }),
          ],
        }),
        new Paragraph({
          spacing: { before: 0, after: 400 },
          children: [
            new TextRun({ text: invoice.number || 'INV-001', size: 24, color: '64748B', font: 'Calibri' }),
          ],
        }),
        // Bill To + Meta table side by side (using a 2-col table)
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE }, ...noBorder() },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorder(),
                  children: [
                    new Paragraph({ spacing: { before: 0, after: 100 }, children: [new TextRun({ text: 'BILL TO', bold: true, size: 16, color: '94A3B8', font: 'Calibri' })] }),
                    new Paragraph({ spacing: { before: 0, after: 60 }, children: [new TextRun({ text: client.name || '—', bold: true, size: 26, color: '0F172A', font: 'Calibri' })] }),
                    ...clientLines.map(l => new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: l, size: 19, color: '475569', font: 'Calibri' })] })),
                    ...(client.email ? [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: client.email, size: 19, color: '475569', font: 'Calibri' })] })] : []),
                  ],
                }),
                new TableCell({
                  borders: noBorder(),
                  width: { size: 3200, type: WidthType.DXA },
                  children: [metaTable],
                }),
              ],
            }),
          ],
        }),
        new Paragraph({ spacing: { before: 300, after: 0 }, children: [] }),
        // Items table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE }, ...noBorder() },
          rows: itemTableRows,
        }),
        new Paragraph({ spacing: { before: 120, after: 0 }, children: [] }),
        // Totals table (right-aligned via wrapper)
        new Table({
          width: { size: 3600, type: WidthType.DXA },
          float: { horizontalAnchor: 'margin', absoluteHorizontalPosition: 5450, verticalAnchor: 'text', relativeVerticalPosition: 'line' },
          borders: { insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE }, ...noBorder() },
          rows: totalRows,
        }),
        new Paragraph({ spacing: { before: 1600, after: 0 }, children: [] }),
        // Notes
        ...(extra.notes
          ? [
              new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun({ text: 'NOTES', bold: true, size: 16, color: '94A3B8', font: 'Calibri' })] }),
              new Paragraph({ spacing: { before: 0, after: 200 }, children: [new TextRun({ text: extra.notes, size: 19, color: '475569', font: 'Calibri' })] }),
            ]
          : []),
        // Payment terms
        ...(extra.paymentTerms
          ? [
              new Paragraph({ spacing: { before: 100, after: 80 }, children: [new TextRun({ text: 'PAYMENT TERMS', bold: true, size: 16, color: '94A3B8', font: 'Calibri' })] }),
              new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: extra.paymentTerms, size: 19, color: '475569', font: 'Calibri' })] }),
            ]
          : []),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${invoice.number || 'invoice'}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
