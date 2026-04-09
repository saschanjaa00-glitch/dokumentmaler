import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs ?? pdfFonts

const C = {
  ink:    '#1C2B3A',
  mid:    '#374151',
  silver: '#6B7280',
  border: '#E5E7EB',
  white:  '#FFFFFF',
}

export function generateFullmaktPDF(data) {
  const {
    name        = '',
    dob         = '',
    percent     = '',
    stillingstype = 'vikarstilling',
    fromDate    = '',
    toDate      = '',
    fag         = '',
    schoolName  = '',
    signerName  = '',
    signerTitle = 'Konstituert rektor',
    logo        = null,
  } = data

  const dobPart = dob.trim() ? ` (født ${dob.trim()})` : ''
  const fagPart = fag.trim() ? ` i ${fag.trim()}` : ''
  const bodyText =
    `${name}${dobPart} ansettes på rektors fullmakt i en ${percent}% ${stillingstype} i perioden ${fromDate} – ${toDate}, på bakgrunn av oppstått undervisningsbehov${fagPart}.`

  const dateStr = new Date().toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')
  const filename = name
    ? `Rektorfullmakt - ${dateStr} - ${name}.pdf`
    : `Rektorfullmakt - ${dateStr}.pdf`

  const docDefinition = {
    pageSize: 'A4',
    // Margins match DOCX: left/right 1.4" = 101pt, top/bottom 1.0" = 72pt
    pageMargins: [101, 72, 101, logo ? 116 : 72],

    footer: logo
      ? {
          image: 'companyLogo',
          fit: [180, 100],
          alignment: 'center',
          margin: [0, 10, 0, 0],
        }
      : undefined,

    images: logo ? { companyLogo: logo } : {},

    defaultStyle: {
      font: 'Roboto',
      fontSize: 12,
      color: C.ink,
      lineHeight: 1.15,
    },

    content: [
      // Title — 216pt top margin (= 3.0") places content at ~34% from top, matching DOCX
      {
        text: `Rektorfullmakt – ${name}`,
        fontSize: 14,
        bold: true,
        margin: [0, 216, 0, 20],
      },

      // Empty gap after title (matches DOCX para after:160 ≈ 8pt)
      { text: '', margin: [0, 0, 0, 8] },

      // Body paragraph (lineHeight 1.5 matches DOCX line:360, after:480≈24pt)
      {
        text: bodyText,
        fontSize: 12,
        lineHeight: 1.5,
        margin: [0, 0, 0, 24],
      },

      // School name (optional, matches DOCX)
      ...(schoolName.trim() ? [{
        text: schoolName,
        fontSize: 12,
        margin: [0, 0, 0, 8],
      }] : []),

      // Two blank lines before signer (~28pt, matches two DOCX blank paras)
      { text: '', margin: [0, 28, 0, 0] },

      // Signer name (bold)
      {
        text: signerName,
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 2],
      },

      // Signer title
      {
        text: signerTitle,
        fontSize: 12,
        color: C.silver,
      },
    ],
  }

  pdfMake.createPdf(docDefinition).download(filename)
}
