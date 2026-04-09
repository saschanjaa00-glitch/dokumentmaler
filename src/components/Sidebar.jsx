import { NavLink } from 'react-router-dom'
import { Receipt, BarChart2, Mail, FileText, Home, FileSignature, ClipboardList, UserCheck } from 'lucide-react'

const navItems = [
  {
    to: '/',
    icon: Home,
    label: 'Home',
    end: true,
  },
  {
    to: '/invoice',
    icon: Receipt,
    label: 'Invoice',
    formats: ['PDF', 'DOCX'],
  },
  {
    to: '/report',
    icon: BarChart2,
    label: 'Business Report',
    formats: ['PDF'],
  },
  {
    to: '/letter',
    icon: Mail,
    label: 'Professional Letter',
    formats: ['PDF', 'DOCX'],
  },
  {
    to: '/fullmakt',
    icon: FileSignature,
    label: 'Rektorfullmakt',
    formats: ['PDF', 'DOCX'],
  },
  {
    to: '/innstilling',
    icon: ClipboardList,
    label: 'Innstilling',
    formats: ['PDF', 'DOCX'],
  },
  {
    to: '/tilsettingsvedtak',
    icon: UserCheck,
    label: 'Tilsettingsvedtak',
    formats: ['PDF', 'DOCX'],
  },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <div className="sidebar-brand-icon">
            <FileText size={16} />
          </div>
          <div>
            <h1>Maler</h1>
          </div>
        </div>
        <p style={{ marginTop: 8 }}>Document Generator</p>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group-label">Templates</div>
        {navItems.map(({ to, icon: Icon, label, end, formats }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={16} />
            {label}
            {formats && (
              <span className="nav-item-badge">{formats.join(' · ')}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>Maler v1.0</p>
      </div>
    </aside>
  )
}
