import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs ?? pdfFonts

// ─── Color Palette ────────────────────────────────────────────
const C = {
  navy: '#1E3A5F',
  navyMid: '#2563EB',
  navyLight: '#3B82F6',
  skyLight: '#DBEAFE',
  skyFaint: '#EFF6FF',
  ink: '#111827',
  inkMid: '#374151',
  silver: '#6B7280',
  mist: '#9CA3AF',
  snow: '#F9FAFB',
  border: '#E5E7EB',
  white: '#FFFFFF',
  green: '#059669',
  red: '#DC2626',
  greenFaint: '#ECFDF5',
  redFaint: '#FEF2F2',
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function detectChange(val) {
  if (!val) return null
  if (val.startsWith('+')) return 'positive'
  if (val.startsWith('-')) return 'negative'
  return null
}

export function generateReportPDF(data) {
  const { meta, summary, metrics, sections, conclusion, logo = null, colors = {} } = data
  const primary = colors.primary || C.navy
  const accent  = colors.accent  || C.navyMid

  const reportDate = fmtDate(meta.date) || meta.date || ''
  const filename = (meta.reportTitle || 'report').toLowerCase().replace(/\s+/g, '-')

  // Build metrics table body
  const metricRows = metrics.filter(m => m.metric || m.value).map(m => {
    const sentiment = detectChange(m.change)
    const changeColor = sentiment === 'positive' ? C.green : sentiment === 'negative' ? C.red : C.silver
    return [
      { text: m.metric || '—', fontSize: 9.5, color: C.inkMid, border: [false, false, false, true], borderColor: ['', '', '', C.border] },
      { text: m.value || '—', fontSize: 9.5, bold: true, color: C.ink, border: [false, false, false, true], borderColor: ['', '', '', C.border] },
      { text: m.change || '—', fontSize: 9, bold: true, color: changeColor, alignment: 'right', border: [false, false, false, true], borderColor: ['', '', '', C.border] },
    ]
  })

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [0, 0, 0, 52],

    content: [
      // ═══ COVER HEADER ═══════════════════════════════════════════
      {
        table: {
          widths: ['*'],
          body: [[{
            border: [false, false, false, false],
            fillColor: primary,
            stack: [
              // Top bar with company name
              {
                columns: [
                  {
                    text: meta.companyName || 'Company Name',
                    fontSize: 10,
                    bold: true,
                    color: '#93C5FD',
                    width: '*',
                  },
                  {
                    text: 'BUSINESS REPORT',
                    fontSize: 8,
                    bold: true,
                    color: 'rgba(255,255,255,0.55)',
                    alignment: 'right',
                    width: 'auto',
                    characterSpacing: 1.5,
                  },
                ],
              },
              { text: ' ', fontSize: 12 },
              ...(logo ? [{ image: 'companyLogo', fit: [80, 44], margin: [0, 0, 0, 8] }] : []),
              {
                text: meta.reportTitle || 'Report Title',
                fontSize: 26,
                bold: true,
                color: C.white,
                lineHeight: 1.2,
              },
              {
                columns: [
                  {
                    text: meta.author ? `Prepared by ${meta.author}` : '',
                    fontSize: 9.5,
                    color: '#93C5FD',
                    width: '*',
                    margin: [0, 10, 0, 0],
                  },
                  {
                    text: reportDate,
                    fontSize: 9.5,
                    color: '#93C5FD',
                    alignment: 'right',
                    width: 'auto',
                    margin: [0, 10, 0, 0],
                  },
                ],
              },
            ],
          }]],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 44,
          paddingRight: () => 44,
          paddingTop: () => 36,
          paddingBottom: () => 32,
        },
      },

      // ═══ ACCENT LINE ════════════════════════════════════════════
      {
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

      // ═══ EXECUTIVE SUMMARY ═══════════════════════════════════════
      ...(summary
        ? [
            {
              margin: [44, 32, 44, 0],
              stack: [
                {
                  columns: [
                    {
                      width: 4,
                      table: {
                        widths: [4],
                        body: [[{ text: '', border: [false, false, false, false], fillColor: accent }]],
                      },
                      layout: {
                        hLineWidth: () => 0,
                        vLineWidth: () => 0,
                        paddingTop: () => 0,
                        paddingBottom: () => 0,
                        paddingLeft: () => 0,
                        paddingRight: () => 0,
                      },
                    },
                    {
                      width: '*',
                      margin: [14, 0, 0, 0],
                      stack: [
                        { text: 'EXECUTIVE SUMMARY', fontSize: 8, bold: true, color: accent, characterSpacing: 1.4 },
                        { text: summary, fontSize: 10.5, color: C.inkMid, margin: [0, 8, 0, 0], lineHeight: 1.75 },
                      ],
                    },
                  ],
                },
              ],
            },
          ]
        : []),

      // ═══ KEY METRICS ═════════════════════════════════════════════
      ...(metricRows.length > 0
        ? [
            {
              margin: [44, 32, 44, 0],
              stack: [
                { text: 'KEY METRICS', fontSize: 8, bold: true, color: accent, characterSpacing: 1.4 },
                {
                  margin: [0, 12, 0, 0],
                  table: {
                    widths: ['*', 130, 90],
                    headerRows: 1,
                    body: [
                      [
                        { text: 'Metric', fontSize: 8, bold: true, color: C.white, fillColor: primary, border: [false, false, false, false] },
                        { text: 'Value', fontSize: 8, bold: true, color: C.white, fillColor: primary, border: [false, false, false, false] },
                        { text: 'Change', fontSize: 8, bold: true, color: C.white, fillColor: primary, alignment: 'right', border: [false, false, false, false] },
                      ],
                      ...metricRows,
                    ],
                  },
                  layout: {
                    hLineWidth: () => 0,
                    vLineWidth: () => 0,
                    paddingLeft: () => 13,
                    paddingRight: () => 13,
                    paddingTop: () => 10,
                    paddingBottom: () => 10,
                  },
                },
              ],
            },
          ]
        : []),

      // ═══ REPORT SECTIONS ═════════════════════════════════════════
      ...sections
        .filter(s => s.title || s.content)
        .map(s => ({
          margin: [44, 28, 44, 0],
          stack: [
            {
              columns: [
                {
                  text: s.title || 'Untitled Section',
                  fontSize: 13,
                  bold: true,
                  color: primary,
                  width: '*',
                },
              ],
            },
            {
              canvas: [{ type: 'line', x1: 0, y1: 6, x2: 507, y2: 6, lineWidth: 0.5, lineColor: C.skyLight }],
              margin: [0, 2, 0, 0],
            },
            ...(s.content
              ? [{ text: s.content, fontSize: 10.5, color: C.inkMid, lineHeight: 1.75, margin: [0, 10, 0, 0] }]
              : []),
          ],
        })),

      // ═══ CONCLUSION ══════════════════════════════════════════════
      ...(conclusion
        ? [
            {
              margin: [44, 28, 44, 0],
              stack: [
                { text: 'CONCLUSION', fontSize: 8, bold: true, color: accent, characterSpacing: 1.4 },
                { text: conclusion, fontSize: 10.5, color: C.inkMid, lineHeight: 1.75, margin: [0, 10, 0, 0] },
              ],
            },
          ]
        : []),
    ],

    footer: (currentPage, pageCount) => ({
      margin: [44, 0, 44, 0],
      columns: [
        { text: meta.companyName || '', fontSize: 8, color: C.mist },
        { text: meta.reportTitle || '', fontSize: 8, color: C.mist, alignment: 'center' },
        { text: `${currentPage} / ${pageCount}`, fontSize: 8, color: C.mist, alignment: 'right' },
      ],
    }),

    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      lineHeight: 1.4,
    },

    images: logo ? { companyLogo: logo } : {},
  }

  pdfMake.createPdf(docDefinition).download(`${filename}.pdf`)
}
