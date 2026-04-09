import { Link } from 'react-router-dom'
import { FileSignature, ArrowRight, ClipboardList } from 'lucide-react'

const templates = [
  {
    to: '/fullmakt',
    icon: FileSignature,
    title: 'Rektorfullmakt',
    description:
      'Norsk mal for midlertidig ansettelse på rektors fullmakt i vikarstilling.',
    color: '#7c3aed',
    bg: '#f5f3ff',
    formats: ['PDF', 'DOCX'],
  },
  {
    to: '/ansettelse',
    icon: ClipboardList,
    title: 'Ansettelse',
    description:
      'Fyll ut ett skjema og generer både innstilling og tilsettingsvedtak som separate filer.',
    color: '#0891b2',
    bg: '#ecfeff',
    formats: ['PDF', 'DOCX'],
  },
]

export default function Home() {
  return (
    <div className="home-page">
      <div className="home-welcome">
        <h2>Create a document</h2>
        <p>
          Choose a template below, fill in your details, and generate a
          professionally designed PDF or Word document instantly.
        </p>
      </div>

      <div className="home-body">
        <div className="home-section-label">Templates</div>
        <div className="template-grid">
          {templates.map(({ to, icon: Icon, title, description, color, bg, formats }) => (
            <Link key={to} to={to} className="template-card">
              <div>
                <div
                  className="template-card-icon"
                  style={{ background: bg, color }}
                >
                  <Icon />
                </div>
              </div>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
              <div>
                <div className="template-formats">
                  {formats.map(f => (
                    <span key={f} className="format-tag">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="template-card-footer" style={{ color }}>
                Open template
                <ArrowRight />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
