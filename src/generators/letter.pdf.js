import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs ?? pdfFonts

// ─── Color Palette ────────────────────────────────────────────
const C = {
  ink: '#1C2B3A',
  inkMid: '#374151',
  inkLight: '#4B5563',
  silver: '#6B7280',
  mist: '#9CA3AF',
  faint: '#D1D5DB',
  border: '#E5E7EB',
  snow: '#F9FAFB',
  white: '#FFFFFF',
  accent: '#2563EB',
  accentLight: '#BFDBFE',
  accentFaint: '#EFF6FF',
}

export function generateLetterPDF(data) {
  const { sender, recipient, details, paragraphs, closing, logo = null, colors = {} } = data
  const primary = colors.primary || C.ink
  const accent  = colors.accent  || C.accent  // C.accent = '#2563EB'

  const senderLines = (sender.address || '').split('\n').filter(Boolean)
  const recipientLines = (recipient.address || '').split('\n').filter(Boolean)
  const bodyParagraphs = paragraphs.filter(p => p.text.trim())
  const salutation = details.salutation || 'Dear'
  const recipientGreeting = recipient.name
    ? `${salutation} ${recipient.name},`
    : `${salutation} Sir or Madam,`

  const filename = (recipient.name || 'letter').toLowerCase().replace(/\s+/g, '-')

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [60, 0, 60, 60],

    content: [
      // ═══ LETTERHEAD ══════════════════════════════════════════════
      {
        margin: [-60, 0, -60, 0],
        table: {
          widths: ['*'],
          body: [[{
            border: [false, false, false, false],
            fillColor: primary,
            columns: [
              {
                width: '*',
                stack: [
                  ...(logo ? [{ image: 'companyLogo', fit: [70, 36], margin: [0, 0, 0, 8] }] : []),
                  {
                    text: sender.company || 'Your Company',
                    fontSize: 18,
                    bold: true,
                    color: C.white,
                  },
                  ...(senderLines.length > 0
                    ? [{ text: senderLines.join('  ·  '), fontSize: 8.5, color: '#93A3B8', margin: [0, 5, 0, 0] }]
                    : []),
                ],
              },
              {
                width: 'auto',
                alignment: 'right',
                margin: [24, 0, 0, 0],
                stack: [
                  ...(sender.phone ? [{ text: sender.phone, fontSize: 8.5, color: '#93A3B8', alignment: 'right' }] : []),
                  ...(sender.email ? [{ text: sender.email, fontSize: 8.5, color: '#93A3B8', alignment: 'right', margin: [0, 3, 0, 0] }] : []),
                  ...(sender.website ? [{ text: sender.website, fontSize: 8.5, color: '#93A3B8', alignment: 'right', margin: [0, 3, 0, 0] }] : []),
                ],
              },
            ],
          }]],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 60,
          paddingRight: () => 60,
          paddingTop: () => 32,
          paddingBottom: () => 28,
        },
      },

      // Accent line under header
      {
        margin: [-60, 0, -60, 0],
        table: {
          widths: ['*'],
          body: [[{ text: '', border: [false, false, false, false], fillColor: accent }]],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingTop: () => 3,
          paddingBottom: () => 3,
          paddingLeft: () => 0,
          paddingRight: () => 0,
        },
      },

      // ═══ DATE ════════════════════════════════════════════════════
      {
        text: details.date || '',
        fontSize: 10,
        color: C.inkMid,
        margin: [0, 32, 0, 0],
      },

      // ═══ RECIPIENT ADDRESS ═══════════════════════════════════════
      {
        margin: [0, 20, 0, 0],
        stack: [
          ...(recipient.name ? [{ text: recipient.name, fontSize: 10.5, bold: true, color: C.ink }] : []),
          ...(recipient.title ? [{ text: recipient.title, fontSize: 10, color: C.inkLight }] : []),
          ...(recipient.company ? [{ text: recipient.company, fontSize: 10, color: C.inkLight }] : []),
          ...recipientLines.map(l => ({ text: l, fontSize: 10, color: C.inkLight, lineHeight: 1.6 })),
        ],
      },

      // ═══ SUBJECT LINE ════════════════════════════════════════════
      ...(details.subject
        ? [
            {
              margin: [0, 24, 0, 0],
              stack: [
                {
                  columns: [
                    { text: details.subject, fontSize: 11, bold: true, color: C.ink, width: '*' },
                  ],
                },
                {
                  canvas: [{ type: 'line', x1: 0, y1: 6, x2: 435, y2: 6, lineWidth: 0.5, lineColor: C.faint }],
                },
              ],
            },
          ]
        : []),

      // ═══ SALUTATION ══════════════════════════════════════════════
      {
        text: recipientGreeting,
        fontSize: 10.5,
        color: C.inkMid,
        margin: [0, 22, 0, 0],
      },

      // ═══ BODY PARAGRAPHS ═════════════════════════════════════════
      ...bodyParagraphs.map(p => ({
        text: p.text,
        fontSize: 10.5,
        color: C.inkMid,
        lineHeight: 1.75,
        margin: [0, 14, 0, 0],
      })),

      // ═══ CLOSING ═════════════════════════════════════════════════
      {
        margin: [0, 32, 0, 0],
        stack: [
          { text: `${closing.phrase || 'Sincerely'},`, fontSize: 10.5, color: C.inkMid },
          { text: ' ', fontSize: 22 }, // signature space
          ...(closing.name ? [{ text: closing.name, fontSize: 10.5, bold: true, color: C.ink }] : []),
          ...(closing.title ? [{ text: closing.title, fontSize: 10, color: C.inkLight }] : []),
          ...(sender.company ? [{ text: sender.company, fontSize: 10, color: C.inkLight }] : []),
        ],
      },
    ],

    footer: (currentPage, pageCount) => {
      if (pageCount <= 1) return null
      return {
        margin: [60, 0, 60, 0],
        columns: [
          { text: sender.company || '', fontSize: 8, color: C.mist },
          { text: `${currentPage} / ${pageCount}`, fontSize: 8, color: C.mist, alignment: 'right' },
        ],
      }
    },

    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      lineHeight: 1.4,
    },

    images: logo ? { companyLogo: logo } : {},
  }

  pdfMake.createPdf(docDefinition).download(`${filename}-letter.pdf`)
}
