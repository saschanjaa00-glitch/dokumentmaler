import { useEffect, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

const presetLogoFiles = import.meta.glob('../assets/logos/*.{png,jpg,jpeg,gif}', { eager: true, import: 'default' })

function formatPresetLabel(path) {
  const fileName = path.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Logo'
  return fileName
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase())
}

const presetLogos = Object.entries(presetLogoFiles)
  .map(([path, src]) => ({
    id: path,
    label: formatPresetLabel(path),
    src,
  }))
  .sort((left, right) => left.label.localeCompare(right.label, 'nb'))

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = event => resolve(event.target.result)
    reader.onerror = () => reject(new Error('Kunne ikke lese logoen.'))
    reader.readAsDataURL(blob)
  })
}

export default function LogoUpload({ value, onChange }) {
  const [dragging, setDragging] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('')
  const inputRef = useRef()

  useEffect(() => {
    if (!value) setSelectedPreset('')
  }, [value])

  const processFile = (file) => {
    if (!file) return
    // pdfmake and docx ImageRun only support raster formats
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/gif'].includes(file.type)) {
      alert('Please upload a PNG, JPG, or GIF image.')
      return
    }
    setSelectedPreset('')
    const reader = new FileReader()
    reader.onload = (e) => onChange(e.target.result)
    reader.readAsDataURL(file)
  }

  const handlePresetChange = async (presetId) => {
    setSelectedPreset(presetId)

    if (!presetId) {
      onChange(null)
      return
    }

    const selected = presetLogos.find(preset => preset.id === presetId)
    if (!selected) return

    try {
      const response = await fetch(selected.src)
      const blob = await response.blob()
      const dataUrl = await blobToDataUrl(blob)
      onChange(dataUrl)
    } catch {
      alert('Kunne ikke laste den valgte logoen.')
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files[0])
  }

  return (
    <div className="logo-upload-stack">
      <div className="logo-preset-row">
        <label className="logo-preset-label" htmlFor="preset-logo-select">Velg eksisterende logo</label>
        <select
          id="preset-logo-select"
          className="logo-preset-select"
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
        >
          <option value="">Ingen valgt</option>
          {presetLogos.map(preset => (
            <option key={preset.id} value={preset.id}>{preset.label}</option>
          ))}
        </select>
        {presetLogos.length === 0 && (
          <span className="logo-preset-empty">Legg PNG-filer i src/assets/logos for å få dem i listen.</span>
        )}
      </div>

      <div
        className={`logo-dropzone${dragging ? ' dragging' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <Upload size={17} />
        <span>Click or drag to upload</span>
        <span className="logo-hint">PNG · JPG · GIF — transparent bg recommended</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif"
          onChange={(e) => processFile(e.target.files[0])}
          style={{ display: 'none' }}
        />
      </div>

      {value && (
        <div className="logo-preview">
          <img src={value} alt="Logo" />
          <button
            className="logo-remove"
            onClick={() => {
              setSelectedPreset('')
              onChange(null)
            }}
            type="button"
            title="Remove logo"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
