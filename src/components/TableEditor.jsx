import { Plus, X } from 'lucide-react'

export default function TableEditor({ items, onChange, columns, currency = '' }) {
  const cols = columns || [
    { key: 'description', label: 'Description', type: 'text', flex: true },
    { key: 'quantity', label: 'Qty', type: 'number', width: 70, align: 'center' },
    { key: 'unitPrice', label: 'Unit Price', type: 'number', width: 110, align: 'right' },
  ]

  const hasAmount = !columns

  const addRow = () => {
    const newRow = { id: Date.now() }
    cols.forEach(c => { newRow[c.key] = c.type === 'number' ? (c.default ?? 0) : '' })
    if (hasAmount) {
      newRow.quantity = 1
      newRow.unitPrice = 0
    }
    onChange([...items, newRow])
  }

  const removeRow = (id) => {
    if (items.length <= 1) return
    onChange(items.filter(item => item.id !== id))
  }

  const update = (id, key, value) => {
    onChange(items.map(item => item.id === id ? { ...item, [key]: value } : item))
  }

  const subtotal = hasAmount
    ? items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0)
    : null

  const fmt = (n) => {
    const num = parseFloat(n) || 0
    return currency
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num)
      : num.toFixed(2)
  }

  return (
    <div className="table-editor">
      <table className="items-table">
        <thead>
          <tr>
            {cols.map(col => (
              <th
                key={col.key}
                style={{ width: col.width || 'auto' }}
                className={col.align === 'right' ? 'align-right' : col.align === 'center' ? 'align-center' : ''}
              >
                {col.label}
              </th>
            ))}
            {hasAmount && <th className="align-right">Amount</th>}
            <th style={{ width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              {cols.map(col => (
                <td key={col.key}>
                  <input
                    type={col.type || 'text'}
                    value={item[col.key]}
                    onChange={e =>
                      update(
                        item.id,
                        col.key,
                        col.type === 'number' ? e.target.value : e.target.value
                      )
                    }
                    placeholder={col.placeholder || col.label}
                    min={col.type === 'number' ? 0 : undefined}
                    step={col.key === 'unitPrice' ? '0.01' : undefined}
                    className={col.align === 'right' ? 'align-right' : col.align === 'center' ? 'align-center' : ''}
                  />
                </td>
              ))}
              {hasAmount && (
                <td className="amount-cell">
                  {fmt((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0))}
                </td>
              )}
              <td className="action-cell">
                <button
                  className="btn-icon"
                  onClick={() => removeRow(item.id)}
                  title="Remove row"
                  type="button"
                >
                  <X size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-footer">
        <button className="add-row-btn" onClick={addRow} type="button">
          <Plus size={14} />
          Add row
        </button>
        {hasAmount && subtotal !== null && (
          <span className="subtotal-display">
            Subtotal: <strong>{fmt(subtotal)}</strong>
          </span>
        )}
      </div>
    </div>
  )
}
