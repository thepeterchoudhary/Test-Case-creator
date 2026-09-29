import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Search, Filter } from 'lucide-react'

const PRIORITY_CLASS = {
  P1: 'badge-high',
  P2: 'badge-medium',
  P3: 'badge-low',
}
const STATUS_CLASS = {
  Pass:    'badge-pass',
  Fail:    'badge-fail',
  Blocked: 'badge-blocked',
  Skip:    'badge-skipped',
  'NOT RUN': 'badge-notrun',
}

function Badge({ text, classMap }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${classMap[text] || 'bg-slate-700 text-slate-300'}`}>
      {text || '—'}
    </span>
  )
}

function ExpandCell({ text }) {
  const [open, setOpen] = useState(false)
  if (!text) return <span className="text-slate-600">—</span>
  const lines = text.split('\n').filter(Boolean)
  const preview = lines[0] || text
  const hasMore = lines.length > 1 || text.length > 120

  return (
    <div>
      <p className={`text-xs text-slate-300 whitespace-pre-wrap ${open ? '' : 'line-clamp-3'}`}>
        {open ? text : preview}
      </p>
      {hasMore && (
        <button
          onClick={() => setOpen(v => !v)}
          className="text-brand-accent text-[11px] mt-1 flex items-center gap-0.5 hover:text-brand-light"
        >
          {open ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> More</>}
        </button>
      )}
    </div>
  )
}

const COLUMNS = [
  { key: 'test_case_id',        label: 'ID',           width: 'w-20'  },
  { key: 'title',               label: 'Title',        width: 'w-44'  },
  { key: 'description_scenario',label: 'Scenario',     width: 'w-52'  },
  { key: 'precondition',        label: 'Precondition', width: 'w-40'  },
  { key: 'test_steps',          label: 'Test Steps',   width: 'w-56'  },
  { key: 'expected_results',    label: 'Expected',     width: 'w-56'  },
  { key: 'status',              label: 'Status',       width: 'w-24'  },
  { key: 'actual_results',      label: 'Actual',       width: 'w-48'  },
  { key: 'bug_ticket_link',     label: 'Bug Link',     width: 'w-28'  },
  { key: 'priority',            label: 'Priority',     width: 'w-24'  },
  { key: 'remarks',             label: 'Remarks',      width: 'w-40'  },
]

const EXPAND_COLS = new Set([
  'description_scenario', 'precondition', 'test_steps',
  'expected_results', 'actual_results', 'remarks',
])

export default function TestCaseTable({ testCases = [], editable = false, onUpdate }) {
  const [search, setSearch]         = useState('')
  const [filterPriority, setFilter] = useState('All')
  const [filterStatus,   setFStatus] = useState('All')

  const filtered = useMemo(() => {
    return testCases.filter(tc => {
      const matchSearch = !search || JSON.stringify(tc).toLowerCase().includes(search.toLowerCase())
      const matchPri    = filterPriority === 'All' || tc.priority === filterPriority
      const matchStatus = filterStatus   === 'All' || tc.status   === filterStatus
      return matchSearch && matchPri && matchStatus
    })
  }, [testCases, search, filterPriority, filterStatus])

  const handleStatusChange = (idx, value) => {
    if (!editable || !onUpdate) return
    const updated = filtered.map((tc, i) => i === idx ? { ...tc, status: value } : tc)
    onUpdate(updated)
  }
  const handleActualChange = (idx, value) => {
    if (!editable || !onUpdate) return
    const updated = filtered.map((tc, i) => i === idx ? { ...tc, actual_results: value } : tc)
    onUpdate(updated)
  }
  const handleRemarksChange = (idx, value) => {
    if (!editable || !onUpdate) return
    const updated = filtered.map((tc, i) => i === idx ? { ...tc, remarks: value } : tc)
    onUpdate(updated)
  }

  if (!testCases.length) return null

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search test cases…"
            className="w-full bg-brand-dark border border-brand-blue rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-accent"
          />
        </div>
        <select
          value={filterPriority}
          onChange={e => setFilter(e.target.value)}
          className="bg-brand-dark border border-brand-blue rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-accent"
        >
          <option value="All">All Priorities</option>
          <option>P1</option><option>P2</option><option>P3</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFStatus(e.target.value)}
          className="bg-brand-dark border border-brand-blue rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-accent"
        >
          <option value="All">All Statuses</option>
          <option>NOT RUN</option><option>Pass</option><option>Fail</option>
          <option>Blocked</option><option>Skip</option>
        </select>
        <span className="text-xs text-slate-500">{filtered.length} / {testCases.length} cases</span>
      </div>

      {/* Table */}
      <div className="tc-table-wrap border border-brand-blue/50 rounded-xl">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr className="bg-brand-blue">
              {COLUMNS.map(col => (
                <th key={col.key}
                  className={`${col.width} px-3 py-2.5 text-left text-[11px] font-semibold text-brand-light uppercase tracking-wider border-r border-brand-mid last:border-r-0 whitespace-nowrap`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((tc, idx) => {
              const rowBg = idx % 2 === 0 ? 'bg-brand-darkest' : 'bg-brand-dark/60'
              return (
                <tr key={tc.test_case_id || idx} className={`${rowBg} hover:bg-brand-mid/30 transition-colors`}>
                  {COLUMNS.map(col => (
                    <td key={col.key}
                      className={`${col.width} px-3 py-2.5 align-top border-r border-brand-blue/20 last:border-r-0 border-b border-brand-blue/10`}>
                      {col.key === 'priority' ? (
                        <Badge text={tc.priority} classMap={PRIORITY_CLASS} />
                      ) : col.key === 'status' ? (
                        editable ? (
                          <select
                            value={tc.status || 'NOT RUN'}
                            onChange={e => handleStatusChange(idx, e.target.value)}
                            className="bg-brand-dark border border-brand-blue rounded px-2 py-0.5 text-xs text-slate-300 w-full focus:outline-none"
                          >
                            <option>NOT RUN</option><option>Pass</option>
                            <option>Fail</option><option>Blocked</option><option>Skip</option>
                          </select>
                        ) : (
                          <Badge text={tc.status || 'NOT RUN'} classMap={STATUS_CLASS} />
                        )
                      ) : col.key === 'actual_results' && editable ? (
                        <textarea
                          value={tc.actual_results || ''}
                          onChange={e => handleActualChange(idx, e.target.value)}
                          rows={2}
                          placeholder="Enter actual result…"
                          className="w-full bg-brand-dark border border-brand-blue rounded px-2 py-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-accent resize-none"
                        />
                      ) : col.key === 'remarks' && editable ? (
                        <textarea
                          value={tc.remarks || ''}
                          onChange={e => handleRemarksChange(idx, e.target.value)}
                          rows={2}
                          placeholder="Remarks…"
                          className="w-full bg-brand-dark border border-brand-blue rounded px-2 py-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-accent resize-none"
                        />
                      ) : col.key === 'bug_ticket_link' ? (
                        tc[col.key] ? (
                          <a href={tc[col.key]} target="_blank" rel="noopener noreferrer"
                            className="text-brand-accent hover:underline break-all">
                            {tc[col.key]}
                          </a>
                        ) : <span className="text-slate-600">—</span>
                      ) : EXPAND_COLS.has(col.key) ? (
                        <ExpandCell text={tc[col.key]} />
                      ) : (
                        <span className="text-slate-300">{tc[col.key] || '—'}</span>
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
