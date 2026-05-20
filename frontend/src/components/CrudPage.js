import React, { useState, useEffect, useMemo } from 'react';

/**
 * Reusable CRUD page.
 * Props:
 *   title, subtitle, columns: [{ key, label, format?, statusField? }]
 *   fields: [{ key, label, type?: 'text'|'number'|'select'|'textarea', options?: [string], required?: bool, fullWidth?: bool }]
 *   api: { list, create, update, remove }
 *   defaults: object — empty record values
 *   statusFields: [string] — keys to render with status-badge formatting in table
 */
const PAGE_SIZE = 25;

function toCsvValue(v) {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'string' ? v : (typeof v === 'object' ? JSON.stringify(v) : String(v));
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename, columns, rows) {
  const header = columns.map((c) => toCsvValue(c.label)).join(',');
  const body = rows
    .map((r) => columns.map((c) => toCsvValue(r[c.key])).join(','))
    .join('\n');
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function CrudPage({ title, subtitle, columns, fields, api, defaults, statusFields = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [formData, setFormData] = useState(defaults);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.list();
      setItems(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  // reset page when search changes
  useEffect(() => { setPage(1); }, [search]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((it) =>
      Object.values(it).some((v) => {
        if (v === null || v === undefined) return false;
        if (typeof v === 'string') return v.toLowerCase().includes(q);
        if (typeof v === 'number') return String(v).includes(q);
        return false;
      })
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleNew = () => { setFormData({ ...defaults }); setShowNew(true); setSelected(null); setEditing(false); };
  const handleRowClick = (item) => { setSelected(item); setEditing(false); };
  const handleEdit = () => { setFormData({ ...selected }); setEditing(true); };
  const handleDelete = async () => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.remove(selected.id); setSelected(null); load(); } catch (e) { alert(e.message); }
  };
  const handleSave = async () => {
    try {
      if (editing && selected) await api.update(selected.id, formData);
      else await api.create(formData);
      setShowNew(false); setEditing(false); setSelected(null); load();
    } catch (e) { alert(e.message); }
  };
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((p) => ({ ...p, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value }));
  };
  const handleExport = () => {
    const fname = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(fname, columns, filtered);
  };

  const fmt = (val, col) => {
    if (val === null || val === undefined || val === '') return '—';
    if (col.format === 'date') return new Date(val).toLocaleDateString();
    if (col.format === 'number') return Number(val).toLocaleString();
    if (col.format === 'currency') return `$${Number(val).toFixed(2)}`;
    if (col.format === 'truncate') return String(val).length > 50 ? String(val).slice(0, 50) + '…' : String(val);
    return String(val);
  };

  const renderField = (f) => {
    const v = formData[f.key] ?? '';
    if (f.type === 'select') {
      return (
        <select name={f.key} value={v} onChange={handleChange}>
          <option value="">—</option>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (f.type === 'textarea') {
      return <textarea name={f.key} value={v} onChange={handleChange} />;
    }
    return <input name={f.key} type={f.type || 'text'} value={v} onChange={handleChange} />;
  };

  const renderForm = () => (
    <div className="modal-overlay" onClick={() => { setShowNew(false); setEditing(false); }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editing ? `Edit ${title}` : `New ${title}`}</h3>
          <button className="modal-close" onClick={() => { setShowNew(false); setEditing(false); }}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            {fields.map((f) => (
              <div key={f.key} className={`form-group ${f.fullWidth ? 'full' : ''}`}>
                <label>{f.label}{f.required ? ' *' : ''}</label>
                {renderField(f)}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => { setShowNew(false); setEditing(false); }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="page-header-actions">
          <button className="btn" onClick={handleExport} disabled={filtered.length === 0}>⬇ Export CSV</button>
          <button className="btn btn-primary" onClick={handleNew}>+ New {title.replace(/s$/, '')}</button>
        </div>
      </div>

      <div className="crud-toolbar">
        <input
          className="crud-search"
          type="search"
          placeholder={`Search ${title.toLowerCase()}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="crud-count">
          {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
          {search && items.length !== filtered.length ? ` (of ${items.length})` : ''}
        </div>
      </div>

      {error && <div className="ai-error" style={{ marginBottom: 12 }}>{error}</div>}
      {loading && <div className="ai-loading"><div className="spinner" /> Loading…</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {pageItems.map((item) => (
              <tr key={item.id} onClick={() => handleRowClick(item)}>
                {columns.map((c) => (
                  <td key={c.key}>
                    {statusFields.includes(c.key)
                      ? <span className={`status-badge status-${String(item[c.key] || '').replace(/\s+/g, '-')}`}>{item[c.key] || '—'}</span>
                      : fmt(item[c.key], c)}
                  </td>
                ))}
              </tr>
            ))}
            {!loading && pageItems.length === 0 && (
              <tr><td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--muted)' }}>No records yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn" onClick={() => setPage(1)} disabled={safePage === 1}>« First</button>
          <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>‹ Prev</button>
          <span className="pagination-info">Page {safePage} of {totalPages}</span>
          <button className="btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Next ›</button>
          <button className="btn" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>Last »</button>
        </div>
      )}

      {selected && !editing && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{title.replace(/s$/, '')} Details</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {fields.map((f) => (
                  <div key={f.key} className="detail-item">
                    <div className="detail-label">{f.label}</div>
                    <div className="detail-value">{fmt(selected[f.key], { format: f.format })}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
              <button className="btn btn-secondary" onClick={handleEdit}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {(showNew || editing) && renderForm()}
    </div>
  );
}

export default CrudPage;
