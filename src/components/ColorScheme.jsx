import { useState } from 'react'

const PRESETS = [
  { id: 'ink',    name: 'Ink',    primary: '#0F172A', accent: '#F59E0B' },
  { id: 'navy',   name: 'Navy',   primary: '#1E3A5F', accent: '#2563EB' },
  { id: 'ocean',  name: 'Ocean',  primary: '#0C4A6E', accent: '#38BDF8' },
  { id: 'forest', name: 'Forest', primary: '#14532D', accent: '#4ADE80' },
  { id: 'rose',   name: 'Rose',   primary: '#881337', accent: '#FB7185' },
  { id: 'violet', name: 'Violet', primary: '#2E1065', accent: '#C4B5FD' },
  { id: 'custom', name: 'Custom', primary: null,      accent: null      },
]

export default function ColorScheme({ onChange, defaultPresetId = 'ink' }) {
  const [activeId, setActiveId] = useState(defaultPresetId)
  const defaultPreset = PRESETS.find(p => p.id === defaultPresetId)
  const [customColors, setCustomColors] = useState({
    primary: defaultPreset?.primary || '#334155',
    accent: defaultPreset?.accent || '#3B82F6',
  })

  const select = (preset) => {
    setActiveId(preset.id)
    if (preset.id !== 'custom') {
      onChange({ primary: preset.primary, accent: preset.accent })
    } else {
      onChange({ primary: customColors.primary, accent: customColors.accent })
    }
  }

  const updateCustom = (key, value) => {
    const next = { ...customColors, [key]: value }
    setCustomColors(next)
    onChange(next)
  }

  return (
    <div>
      <div className="color-presets">
        {PRESETS.map((preset) => {
          const swatchPrimary = preset.id === 'custom' ? customColors.primary : preset.primary
          const swatchAccent  = preset.id === 'custom' ? customColors.accent  : preset.accent
          return (
            <button
              key={preset.id}
              type="button"
              className={`color-preset${activeId === preset.id ? ' active' : ''}`}
              onClick={() => select(preset)}
              title={preset.name}
            >
              <div
                className="color-preset-swatch"
                style={{
                  background: `linear-gradient(135deg, ${swatchPrimary} 55%, ${swatchAccent} 55%)`,
                }}
              />
              <span className="color-preset-name">{preset.name}</span>
            </button>
          )
        })}
      </div>

      {activeId === 'custom' && (
        <div className="color-custom-inputs">
          <div className="color-custom-field">
            <label>Primary</label>
            <div className="color-custom-row">
              <input
                type="color"
                value={customColors.primary}
                onChange={(e) => updateCustom('primary', e.target.value)}
              />
              <input
                type="text"
                value={customColors.primary}
                onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && updateCustom('primary', e.target.value)}
                className="color-hex-input"
                spellCheck={false}
              />
            </div>
          </div>
          <div className="color-custom-field">
            <label>Accent</label>
            <div className="color-custom-row">
              <input
                type="color"
                value={customColors.accent}
                onChange={(e) => updateCustom('accent', e.target.value)}
              />
              <input
                type="text"
                value={customColors.accent}
                onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && updateCustom('accent', e.target.value)}
                className="color-hex-input"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
