import { useState } from 'react'
import { Building2, User, Mail, AlignLeft, Plus, X, Download, FileDown, Palette } from 'lucide-react'
import { Field, Input, Textarea, Select } from '../components/FormField'
import LogoUpload from '../components/LogoUpload'
import ColorScheme from '../components/ColorScheme'
import { generateLetterPDF } from '../generators/letter.pdf'
import { generateLetterDOCX } from '../generators/letter.docx'

const CLOSINGS = [
  { value: 'Sincerely', label: 'Sincerely' },
  { value: 'Best regards', label: 'Best regards' },
  { value: 'Kind regards', label: 'Kind regards' },
  { value: 'Yours faithfully', label: 'Yours faithfully' },
  { value: 'Respectfully', label: 'Respectfully' },
  { value: 'With appreciation', label: 'With appreciation' },
]

function defaultParagraphs() {
  return [{ id: 1, text: '' }, { id: 2, text: '' }]
}

export default function LetterPage() {
  const [logo, setLogo] = useState(null)
  const [colors, setColors] = useState({ primary: '#1E3A5F', accent: '#2563EB' })

  const [sender, setSender] = useState({
    company: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  })

  const [recipient, setRecipient] = useState({
    name: '',
    title: '',
    company: '',
    address: '',
  })

  const [details, setDetails] = useState({
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    subject: '',
    salutation: 'Dear',
  })

  const [paragraphs, setParagraphs] = useState(defaultParagraphs())

  const [closing, setClosing] = useState({
    phrase: 'Sincerely',
    name: '',
    title: '',
  })

  const addParagraph = () =>
    setParagraphs(p => [...p, { id: Date.now(), text: '' }])

  const removeParagraph = id => {
    if (paragraphs.length <= 1) return
    setParagraphs(p => p.filter(para => para.id !== id))
  }

  const updateParagraph = (id, value) =>
    setParagraphs(p => p.map(para => para.id === id ? { ...para, text: value } : para))

  const data = { sender, recipient, details, paragraphs, closing, logo, colors }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <h2>Professional Letter</h2>
          <p>Create a formal letter with a polished letterhead and clean, elegant layout.</p>
        </div>
      </div>

      <div className="page-body">
        {/* Design */}
        <div className="form-card">
          <div className="form-card-header">
            <Palette size={15} />
            <span className="form-card-title">Document Design</span>
          </div>
          <div className="design-grid">
            <div>
              <div className="design-grid-label">Logo</div>
              <LogoUpload value={logo} onChange={setLogo} />
            </div>
            <div>
              <div className="design-grid-label">Color Scheme</div>
              <ColorScheme defaultPresetId="navy" onChange={setColors} />
            </div>
          </div>
        </div>

        {/* Sender */}
        <div className="form-card">
          <div className="form-card-header">
            <Building2 size={15} />
            <span className="form-card-title">Sender / Letterhead</span>
          </div>
          <div className="form-grid">
            <Field label="Company / Your Name">
              <Input
                value={sender.company}
                onChange={v => setSender(p => ({ ...p, company: v }))}
                placeholder="Acme Corporation"
              />
            </Field>
            <Field label="Website">
              <Input
                value={sender.website}
                onChange={v => setSender(p => ({ ...p, website: v }))}
                placeholder="www.acme.com"
              />
            </Field>
            <Field label="Address" span="full">
              <Textarea
                value={sender.address}
                onChange={v => setSender(p => ({ ...p, address: v }))}
                placeholder={'123 Main Street, Suite 400\nNew York, NY 10001'}
                rows={2}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={sender.phone}
                onChange={v => setSender(p => ({ ...p, phone: v }))}
                placeholder="+1 (555) 000-0000"
              />
            </Field>
            <Field label="Email">
              <Input
                value={sender.email}
                onChange={v => setSender(p => ({ ...p, email: v }))}
                placeholder="hello@acme.com"
                type="email"
              />
            </Field>
          </div>
        </div>

        {/* Recipient */}
        <div className="form-card">
          <div className="form-card-header">
            <User size={15} />
            <span className="form-card-title">Recipient</span>
          </div>
          <div className="form-grid">
            <Field label="Full Name">
              <Input
                value={recipient.name}
                onChange={v => setRecipient(p => ({ ...p, name: v }))}
                placeholder="John Smith"
              />
            </Field>
            <Field label="Title / Position">
              <Input
                value={recipient.title}
                onChange={v => setRecipient(p => ({ ...p, title: v }))}
                placeholder="Director of Partnerships"
              />
            </Field>
            <Field label="Company">
              <Input
                value={recipient.company}
                onChange={v => setRecipient(p => ({ ...p, company: v }))}
                placeholder="Partner Corp"
              />
            </Field>
            <div />
            <Field label="Address" span="full">
              <Textarea
                value={recipient.address}
                onChange={v => setRecipient(p => ({ ...p, address: v }))}
                placeholder={'456 Partner Blvd\nLos Angeles, CA 90001'}
                rows={2}
              />
            </Field>
          </div>
        </div>

        {/* Letter Details */}
        <div className="form-card">
          <div className="form-card-header">
            <Mail size={15} />
            <span className="form-card-title">Letter Details</span>
          </div>
          <div className="form-grid">
            <Field label="Date">
              <Input
                value={details.date}
                onChange={v => setDetails(p => ({ ...p, date: v }))}
                placeholder="April 6, 2026"
              />
            </Field>
            <Field label="Salutation">
              <Input
                value={details.salutation}
                onChange={v => setDetails(p => ({ ...p, salutation: v }))}
                placeholder="Dear"
              />
            </Field>
            <Field label="Subject Line" span="full">
              <Input
                value={details.subject}
                onChange={v => setDetails(p => ({ ...p, subject: v }))}
                placeholder="Re: Partnership Proposal — Q2 2026"
              />
            </Field>
          </div>
        </div>

        {/* Body */}
        <div className="form-card">
          <div className="form-card-header">
            <AlignLeft size={15} />
            <span className="form-card-title">Letter Body</span>
          </div>

          {paragraphs.map((para, i) => (
            <div className="dyn-section" key={para.id} style={{ marginBottom: 10 }}>
              <div className="dyn-section-header">
                <span className="dyn-section-num">{i + 1}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                  Paragraph {i + 1}
                </span>
                <button
                  className="btn-icon"
                  onClick={() => removeParagraph(para.id)}
                  type="button"
                  title="Remove paragraph"
                  style={{ marginLeft: 'auto' }}
                >
                  <X size={13} />
                </button>
              </div>
              <div className="dyn-section-body">
                <textarea
                  value={para.text}
                  onChange={e => updateParagraph(para.id, e.target.value)}
                  placeholder="Write this paragraph..."
                  rows={4}
                />
              </div>
            </div>
          ))}

          <button className="add-section-btn" onClick={addParagraph} type="button">
            <Plus size={14} />
            Add paragraph
          </button>
        </div>

        {/* Closing */}
        <div className="form-card">
          <div className="form-card-header">
            <AlignLeft size={15} />
            <span className="form-card-title">Closing</span>
          </div>
          <div className="form-grid">
            <Field label="Closing Phrase">
              <Select
                value={closing.phrase}
                onChange={v => setClosing(p => ({ ...p, phrase: v }))}
                options={CLOSINGS}
              />
            </Field>
            <div />
            <Field label="Signature Name">
              <Input
                value={closing.name}
                onChange={v => setClosing(p => ({ ...p, name: v }))}
                placeholder="Jane Smith"
              />
            </Field>
            <Field label="Title">
              <Input
                value={closing.title}
                onChange={v => setClosing(p => ({ ...p, title: v }))}
                placeholder="Chief Executive Officer"
              />
            </Field>
          </div>
        </div>

        {/* Generate */}
        <div className="generate-card">
          <div className="generate-card-text">
            <h3>Generate Letter</h3>
            <p>Download your letter as PDF or Word document</p>
          </div>
          <div className="generate-card-actions">
            <button
              className="btn btn-outline"
              onClick={() => generateLetterDOCX(data)}
              type="button"
            >
              <FileDown size={15} />
              Download DOCX
            </button>
            <button
              className="btn btn-primary"
              onClick={() => generateLetterPDF(data)}
              type="button"
            >
              <Download size={15} />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
