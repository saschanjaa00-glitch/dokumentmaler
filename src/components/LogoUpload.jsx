import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

export default function LogoUpload({ value, onChange }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const processFile = (file) => {
    if (!file) return
    // pdfmake and docx ImageRun only support raster formats
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/gif'].includes(file.type)) {
      alert('Please upload a PNG, JPG, or GIF image.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => onChange(e.target.result)
    reader.readAsDataURL(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files[0])
  }

  return (
    <div>
      {value ? (
        <div className="logo-preview">
          <img src={value} alt="Logo" />
          <button
            className="logo-remove"
            onClick={() => onChange(null)}
            type="button"
            title="Remove logo"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
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
      )}
    </div>
  )
}
