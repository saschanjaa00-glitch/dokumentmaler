import { useState } from 'react'
import { Building2, FileText, BarChart2, AlignLeft, Plus, X, Download, Palette } from 'lucide-react'
import { Field, Input, Textarea } from '../components/FormField'
import TableEditor from '../components/TableEditor'
import LogoUpload from '../components/LogoUpload'
import ColorScheme from '../components/ColorScheme'
import { generateReportPDF } from '../generators/report.pdf'

function makeSection(n) {
  return { id: Date.now() + n, title: '', content: '' }
}

function makeMetric() {
  return { id: Date.now(), metric: '', value: '', change: '' }
}

const metricCols = [
  { key: 'metric', label: 'Metric', type: 'text', flex: true, placeholder: 'Revenue' },
  { key: 'value', label: 'Value', type: 'text', width: 120, placeholder: '$84,200' },
  { key: 'change', label: 'Change', type: 'text', width: 100, placeholder: '+12.4%' },
]

export default function ReportPage() {
  const [logo, setLogo] = useState(null)
  const [colors, setColors] = useState({ primary: '#1E3A5F', accent: '#2563EB' })

  const [meta, setMeta] = useState({
    companyName: '',
    reportTitle: '',
    author: '',
    date: new Date().toISOString().split('T')[0],
  })

  const [summary, setSummary] = useState('')

  const [metrics, setMetrics] = useState([makeMetric(), makeMetric(), makeMetric()])

  const [sections, setSections] = useState([
    makeSection(0),
    makeSection(1),
  ])

  const [conclusion, setConclusion] = useState('')

  const addSection = () => setSections(p => [...p, makeSection(p.length)])
  const removeSection = id => {
    if (sections.length <= 1) return
    setSections(p => p.filter(s => s.id !== id))
  }
  const updateSection = (id, field, value) =>
    setSections(p => p.map(s => s.id === id ? { ...s, [field]: value } : s))

  const data = { meta, summary, metrics, sections, conclusion, logo, colors }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <h2>Business Report</h2>
          <p>Create a comprehensive business report with data tables, metrics, and analysis sections.</p>
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

        {/* Report Info */}
        <div className="form-card">
          <div className="form-card-header">
            <Building2 size={15} />
            <span className="form-card-title">Report Information</span>
          </div>
          <div className="form-grid">
            <Field label="Company Name">
              <Input
                value={meta.companyName}
                onChange={v => setMeta(p => ({ ...p, companyName: v }))}
                placeholder="Acme Corporation"
              />
            </Field>
            <Field label="Report Title">
              <Input
                value={meta.reportTitle}
                onChange={v => setMeta(p => ({ ...p, reportTitle: v }))}
                placeholder="Q1 2026 Performance Review"
              />
            </Field>
            <Field label="Author">
              <Input
                value={meta.author}
                onChange={v => setMeta(p => ({ ...p, author: v }))}
                placeholder="Jane Smith"
              />
            </Field>
            <Field label="Date">
              <Input
                value={meta.date}
                onChange={v => setMeta(p => ({ ...p, date: v }))}
                type="date"
              />
            </Field>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="form-card">
          <div className="form-card-header">
            <AlignLeft size={15} />
            <span className="form-card-title">Executive Summary</span>
          </div>
          <Field>
            <Textarea
              value={summary}
              onChange={setSummary}
              placeholder="Provide a high-level overview of the report's key findings and recommendations..."
              rows={5}
            />
          </Field>
        </div>

        {/* Key Metrics */}
        <div className="form-card">
          <div className="form-card-header">
            <BarChart2 size={15} />
            <span className="form-card-title">Key Metrics</span>
          </div>
          <TableEditor
            items={metrics}
            onChange={setMetrics}
            columns={metricCols}
          />
        </div>

        {/* Report Sections */}
        <div className="form-card">
          <div className="form-card-header">
            <FileText size={15} />
            <span className="form-card-title">Report Sections</span>
          </div>

          {sections.map((section, i) => (
            <div className="dyn-section" key={section.id}>
              <div className="dyn-section-header">
                <span className="dyn-section-num">{i + 1}</span>
                <input
                  value={section.title}
                  onChange={e => updateSection(section.id, 'title', e.target.value)}
                  placeholder="Section title (e.g. Market Analysis)"
                />
                <button
                  className="btn-icon"
                  onClick={() => removeSection(section.id)}
                  type="button"
                  title="Remove section"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="dyn-section-body">
                <textarea
                  value={section.content}
                  onChange={e => updateSection(section.id, 'content', e.target.value)}
                  placeholder="Write the section content here..."
                  rows={4}
                />
              </div>
            </div>
          ))}

          <button className="add-section-btn" onClick={addSection} type="button">
            <Plus size={14} />
            Add section
          </button>
        </div>

        {/* Conclusion */}
        <div className="form-card">
          <div className="form-card-header">
            <AlignLeft size={15} />
            <span className="form-card-title">Conclusion</span>
          </div>
          <Field>
            <Textarea
              value={conclusion}
              onChange={setConclusion}
              placeholder="Summarize the key takeaways and next steps..."
              rows={4}
            />
          </Field>
        </div>

        {/* Generate */}
        <div className="generate-card">
          <div className="generate-card-text">
            <h3>Generate Report</h3>
            <p>Download your business report as a professionally designed PDF</p>
          </div>
          <div className="generate-card-actions">
            <button
              className="btn btn-primary"
              onClick={() => generateReportPDF(data)}
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
