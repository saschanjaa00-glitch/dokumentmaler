import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs ?? pdfFonts

// ─── Color Palette ────────────────────────────────────────────
const C = {
  ink: '#0F172A',
  inkMid: '#1E293B',
  inkLight: '#475569',
  silver: '#64748B',
  mist: '#94A3B8',
  snow: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
  amber: '#F59E0B',
  amberDeep: '#D97706',
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

// Creates a full-width colored block using a borderless table
function colorBlock(content, fillColor, paddingH = 40, paddingV = 28) {
  return {
    table: {
      widths: ['*'],
      body: [[{ ...content, border: [false, false, false, false], fillColor }]],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => paddingH,
      paddingRight: () => paddingH,
      paddingTop: () => paddingV,
      paddingBottom: () => paddingV,
    },
  }
}

export function generateInvoicePDF(data) {
  const { company, client, invoice, items, extra, logo = null, colors = {} } = data
  const primary = colors.primary || C.ink
  const accent  = colors.accent  || C.amber

  const currency = invoice.currency || 'USD'
  const taxRate = parseFloat(extra.taxRate) || 0
  const subtotal = items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0), 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax

  const companyLines = (company.address || '').split('\n').filter(Boolean)
  const clientLines = (client.address || '').split('\n').filter(Boolean)

  // Build totals rows
  const totalRows = [
    [
      { text: 'Subtotal', fontSize: 9.5, color: C.silver, border: [false, false, false, true], borderColor: ['', '', '', C.border] },
      { text: fmt(subtotal, currency), fontSize: 9.5, color: C.inkMid, alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', C.border] },
    ],
  ]

  if (taxRate > 0) {
    totalRows.push([
      { text: `Tax (${taxRate}%)`, fontSize: 9.5, color: C.silver, border: [false, false, false, true], borderColor: ['', '', '', C.border] },
      { text: fmt(tax, currency), fontSize: 9.5, color: C.inkMid, alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', C.border] },
    ])
  }

  totalRows.push([
    { text: 'TOTAL DUE', fontSize: 10, bold: true, color: C.white, fillColor: primary, border: [false, false, false, false] },
    { text: fmt(total, currency), fontSize: 10, bold: true, color: accent, fillColor: primary, alignment: 'right', border: [false, false, false, false] },
  ])

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [0, 0, 0, 48],

    content: [
      // ═══ HEADER ════════════════════════════════════════════════
      colorBlock(
        {
          columns: [
            {
              width: '*',
              stack: [
                ...(logo ? [{ image: 'companyLogo', fit: [80, 44], margin: [0, 0, 0, 10] }] : []),
                {
                  text: company.name || 'Your Company',
                  fontSize: 22,
                  bold: true,
                  color: C.white,
                  lineHeight: 1.2,
                },
                ...(company.tagline
                  ? [{ text: company.tagline, fontSize: 9, color: C.mist, margin: [0, 3, 0, 0] }]
                  : []),
                { text: ' ', fontSize: 6 },
                ...companyLines.map(l => ({ text: l, fontSize: 8.5, color: '#93A3B8', lineHeight: 1.6 })),
                ...(company.phone ? [{ text: company.phone, fontSize: 8.5, color: '#93A3B8' }] : []),
                ...(company.email ? [{ text: company.email, fontSize: 8.5, color: '#93A3B8' }] : []),
              ],
            },
            {
              width: 'auto',
              alignment: 'right',
              margin: [24, 0, 0, 0],
              stack: [
                { text: 'INVOICE', fontSize: 30, bold: true, color: accent, alignment: 'right' },
                {
                  text: invoice.number || 'INV-001',
                  fontSize: 12,
                  color: C.mist,
                  alignment: 'right',
                  margin: [0, 4, 0, 0],
                },
              ],
            },
          ],
        },
        primary
      ),

      // ═══ BILLING + DATES ═══════════════════════════════════════
      {
        margin: [40, 32, 40, 0],
        columns: [
          {
            width: '*',
            stack: [
              { text: 'BILL TO', fontSize: 7.5, bold: true, color: C.mist, characterSpacing: 1.2 },
              {
                text: client.name || '—',
                fontSize: 13,
                bold: true,
                color: C.ink,
                margin: [0, 6, 0, 2],
              },
              ...clientLines.map(l => ({ text: l, fontSize: 9.5, color: C.inkLight, lineHeight: 1.65 })),
              ...(client.email ? [{ text: client.email, fontSize: 9.5, color: C.inkLight }] : []),
            ],
          },
          {
            width: 190,
            table: {
              widths: ['*', 'auto'],
              body: [
                [
                  { text: 'Issue Date', fontSize: 8.5, color: C.silver, border: [false, false, false, true], borderColor: ['', '', '', C.border] },
                  { text: fmtDate(invoice.issueDate), fontSize: 8.5, bold: true, color: C.ink, alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', C.border] },
                ],
                [
                  { text: 'Due Date', fontSize: 8.5, color: C.silver, border: [false, false, false, true], borderColor: ['', '', '', C.border] },
                  { text: fmtDate(invoice.dueDate), fontSize: 8.5, bold: true, color: C.ink, alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', C.border] },
                ],
                [
                  { text: 'Currency', fontSize: 8.5, color: C.silver, border: [false, false, false, false] },
                  { text: currency, fontSize: 8.5, bold: true, color: C.ink, alignment: 'right', border: [false, false, false, false] },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingLeft: () => 12,
              paddingRight: () => 12,
              paddingTop: () => 8,
              paddingBottom: () => 8,
            },
          },
        ],
      },

      // ═══ DIVIDER ═══════════════════════════════════════════════
      {
        margin: [40, 28, 40, 0],
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: C.border }],
      },

      // ═══ LINE ITEMS TABLE ═══════════════════════════════════════
      {
        margin: [40, 20, 40, 0],
        table: {
          widths: ['*', 50, 90, 90],
          headerRows: 1,
          body: [
            // Header
            [
              { text: 'DESCRIPTION', fontSize: 7.5, bold: true, color: C.white, fillColor: primary, border: [false, false, false, false] },
              { text: 'QTY', fontSize: 7.5, bold: true, color: C.white, fillColor: primary, alignment: 'center', border: [false, false, false, false] },
              { text: 'UNIT PRICE', fontSize: 7.5, bold: true, color: C.white, fillColor: primary, alignment: 'right', border: [false, false, false, false] },
              { text: 'AMOUNT', fontSize: 7.5, bold: true, color: C.white, fillColor: primary, alignment: 'right', border: [false, false, false, false] },
            ],
            // Items
            ...(items.length > 0
              ? items.map((item, i) => {
                  const bg = i % 2 !== 0 ? C.snow : null
                  const qty = parseFloat(item.quantity) || 0
                  const price = parseFloat(item.unitPrice) || 0
                  return [
                    { text: item.description || '—', fontSize: 10, color: C.inkMid, fillColor: bg, border: [false, false, false, false] },
                    { text: String(qty), fontSize: 10, color: C.inkMid, fillColor: bg, alignment: 'center', border: [false, false, false, false] },
                    { text: fmt(price, currency), fontSize: 10, color: C.inkMid, fillColor: bg, alignment: 'right', border: [false, false, false, false] },
                    { text: fmt(qty * price, currency), fontSize: 10, color: C.inkMid, fillColor: bg, alignment: 'right', border: [false, false, false, false] },
                  ]
                })
              : [[
                  { text: 'No items added', fontSize: 10, color: C.mist, colSpan: 4, alignment: 'center', border: [false, false, false, false] },
                  {}, {}, {},
                ]]
            ),
            // Bottom border
            [
              { text: '', colSpan: 4, border: [false, true, false, false], borderColor: ['', C.border, '', ''] },
              {}, {}, {},
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 13,
          paddingRight: () => 13,
          paddingTop: () => 11,
          paddingBottom: () => 11,
        },
      },

      // ═══ TOTALS ═════════════════════════════════════════════════
      {
        margin: [40, 4, 40, 0],
        columns: [
          { width: '*', text: '' },
          {
            width: 210,
            table: {
              widths: ['*', 'auto'],
              body: totalRows,
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingLeft: () => 13,
              paddingRight: () => 13,
              paddingTop: () => 9,
              paddingBottom: () => 9,
            },
          },
        ],
      },

      // ═══ NOTES / TERMS ══════════════════════════════════════════
      ...((extra.notes || extra.paymentTerms)
        ? [
            {
              margin: [40, 32, 40, 0],
              canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: C.border }],
            },
            {
              margin: [40, 20, 40, 0],
              columns: [
                ...(extra.notes
                  ? [{
                      width: '*',
                      stack: [
                        { text: 'NOTES', fontSize: 7.5, bold: true, color: C.mist, characterSpacing: 1.2 },
                        { text: extra.notes, fontSize: 9.5, color: C.inkLight, margin: [0, 6, 0, 0], lineHeight: 1.65 },
                      ],
                    }]
                  : []),
                ...(extra.paymentTerms
                  ? [{
                      width: '*',
                      stack: [
                        { text: 'PAYMENT TERMS', fontSize: 7.5, bold: true, color: C.mist, characterSpacing: 1.2 },
                        { text: extra.paymentTerms, fontSize: 9.5, color: C.inkLight, margin: [0, 6, 0, 0], lineHeight: 1.65 },
                      ],
                    }]
                  : []),
              ],
            },
          ]
        : []),
    ],

    footer: (currentPage, pageCount) => ({
      margin: [40, 0, 40, 0],
      columns: [
        { text: company.name || '', fontSize: 8, color: C.mist },
        { text: `Page ${currentPage} / ${pageCount}`, fontSize: 8, color: C.mist, alignment: 'right' },
      ],
    }),

    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      lineHeight: 1.4,
    },

    images: logo ? { companyLogo: logo } : {},
  }

  pdfMake.createPdf(docDefinition).download(`${invoice.number || 'invoice'}.pdf`)
}
