import { useState } from 'react'
import { Receipt, Building2, User, FileText, StickyNote, Download, FileDown, Palette } from 'lucide-react'
import { Field, Input, Textarea, Select } from '../components/FormField'
import TableEditor from '../components/TableEditor'
import LogoUpload from '../components/LogoUpload'
import ColorScheme from '../components/ColorScheme'
import { generateInvoicePDF } from '../generators/invoice.pdf'
import { generateInvoiceDOCX } from '../generators/invoice.docx'

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
]

const today = new Date().toISOString().split('T')[0]
const due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

function makeItem() {
  return { id: Date.now(), description: '', quantity: 1, unitPrice: 0 }
}

export default function InvoicePage() {
  const [logo, setLogo] = useState(null)
  const [colors, setColors] = useState({ primary: '#0F172A', accent: '#F59E0B' })

  const [company, setCompany] = useState({
    name: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
  })

  const [client, setClient] = useState({
    name: '',
    address: '',
    email: '',
  })

  const [invoice, setInvoice] = useState({
    number: 'INV-001',
    issueDate: today,
    dueDate: due,
    currency: 'USD',
  })

  const [items, setItems] = useState([makeItem()])

  const [extra, setExtra] = useState({
    taxRate: '0',
    notes: '',
    paymentTerms: 'Payment is due within 30 days of invoice date.',
  })

  const data = { company, client, invoice, items, extra, logo, colors }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <h2>Invoice</h2>
          <p>Generate a professional invoice with itemized billing and tax calculations.</p>
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
              <ColorScheme defaultPresetId="ink" onChange={setColors} />
            </div>
          </div>
        </div>

        {/* Company */}
        <div className="form-card">
          <div className="form-card-header">
            <Building2 size={15} />
            <span className="form-card-title">Your Company</span>
          </div>
          <div className="form-grid">
            <Field label="Company Name">
              <Input
                value={company.name}
                onChange={v => setCompany(p => ({ ...p, name: v }))}
                placeholder="Acme Corporation"
              />
            </Field>
            <Field label="Tagline / Industry">
              <Input
                value={company.tagline}
                onChange={v => setCompany(p => ({ ...p, tagline: v }))}
                placeholder="Creative services & consulting"
              />
            </Field>
            <Field label="Address" span="full">
              <Textarea
                value={company.address}
                onChange={v => setCompany(p => ({ ...p, address: v }))}
                placeholder={'123 Main Street\nSuite 400\nNew York, NY 10001'}
                rows={3}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={company.phone}
                onChange={v => setCompany(p => ({ ...p, phone: v }))}
                placeholder="+1 (555) 000-0000"
              />
            </Field>
            <Field label="Email">
              <Input
                value={company.email}
                onChange={v => setCompany(p => ({ ...p, email: v }))}
                placeholder="hello@acme.com"
                type="email"
              />
            </Field>
          </div>
        </div>

        {/* Client */}
        <div className="form-card">
          <div className="form-card-header">
            <User size={15} />
            <span className="form-card-title">Bill To</span>
          </div>
          <div className="form-grid">
            <Field label="Client / Company Name">
              <Input
                value={client.name}
                onChange={v => setClient(p => ({ ...p, name: v }))}
                placeholder="Client Name"
              />
            </Field>
            <Field label="Client Email">
              <Input
                value={client.email}
                onChange={v => setClient(p => ({ ...p, email: v }))}
                placeholder="client@company.com"
                type="email"
              />
            </Field>
            <Field label="Billing Address" span="full">
              <Textarea
                value={client.address}
                onChange={v => setClient(p => ({ ...p, address: v }))}
                placeholder={'456 Client Ave\nLos Angeles, CA 90001'}
                rows={3}
              />
            </Field>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="form-card">
          <div className="form-card-header">
            <FileText size={15} />
            <span className="form-card-title">Invoice Details</span>
          </div>
          <div className="form-grid-3">
            <Field label="Invoice Number">
              <Input
                value={invoice.number}
                onChange={v => setInvoice(p => ({ ...p, number: v }))}
                placeholder="INV-001"
              />
            </Field>
            <Field label="Issue Date">
              <Input
                value={invoice.issueDate}
                onChange={v => setInvoice(p => ({ ...p, issueDate: v }))}
                type="date"
              />
            </Field>
            <Field label="Due Date">
              <Input
                value={invoice.dueDate}
                onChange={v => setInvoice(p => ({ ...p, dueDate: v }))}
                type="date"
              />
            </Field>
            <Field label="Currency">
              <Select
                value={invoice.currency}
                onChange={v => setInvoice(p => ({ ...p, currency: v }))}
                options={CURRENCIES}
              />
            </Field>
          </div>
        </div>

        {/* Line Items */}
        <div className="form-card">
          <div className="form-card-header">
            <Receipt size={15} />
            <span className="form-card-title">Line Items</span>
          </div>
          <TableEditor
            items={items}
            onChange={setItems}
            currency={invoice.currency}
          />
        </div>

        {/* Notes & Tax */}
        <div className="form-card">
          <div className="form-card-header">
            <StickyNote size={15} />
            <span className="form-card-title">Additional</span>
          </div>
          <div className="form-grid">
            <Field label="Tax Rate (%)" hint="Leave 0 for no tax">
              <Input
                value={extra.taxRate}
                onChange={v => setExtra(p => ({ ...p, taxRate: v }))}
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
              />
            </Field>
            <div />
            <Field label="Notes" span="full">
              <Textarea
                value={extra.notes}
                onChange={v => setExtra(p => ({ ...p, notes: v }))}
                placeholder="Thank you for your business!"
                rows={3}
              />
            </Field>
            <Field label="Payment Terms" span="full">
              <Textarea
                value={extra.paymentTerms}
                onChange={v => setExtra(p => ({ ...p, paymentTerms: v }))}
                placeholder="Payment is due within 30 days."
                rows={2}
              />
            </Field>
          </div>
        </div>

        {/* Generate */}
        <div className="generate-card">
          <div className="generate-card-text">
            <h3>Generate Invoice</h3>
            <p>Download your invoice as PDF or Word document</p>
          </div>
          <div className="generate-card-actions">
            <button
              className="btn btn-outline"
              onClick={() => generateInvoiceDOCX(data)}
              type="button"
            >
              <FileDown size={15} />
              Download DOCX
            </button>
            <button
              className="btn btn-primary"
              onClick={() => generateInvoicePDF(data)}
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
