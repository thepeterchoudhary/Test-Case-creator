import React from 'react'

const STATS = [
  { key: 'total',   label: 'Total',    color: 'text-blue-300',   bg: 'bg-brand-blue/40' },
  { key: 'not_run', label: 'Not Run',  color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  { key: 'passed',  label: 'Passed',   color: 'text-green-400',  bg: 'bg-green-900/30'  },
  { key: 'failed',  label: 'Failed',   color: 'text-red-400',    bg: 'bg-red-900/30'    },
  { key: 'skipped', label: 'Skipped',  color: 'text-orange-400', bg: 'bg-orange-900/30' },
  { key: 'blocked', label: 'Blocked',  color: 'text-purple-400', bg: 'bg-purple-900/30' },
]

export default function SummaryBar({ summary = {}, testCases = [] }) {
  const total   = testCases.length || summary.total || 0
  const not_run = summary.not_run ?? total
  const passed  = summary.passed  ?? 0
  const failed  = summary.failed  ?? 0
  const skipped = summary.skipped ?? 0
  const blocked = summary.blocked ?? 0

  const data = { total, not_run, passed, failed, skipped, blocked }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
      {STATS.map(s => (
        <div key={s.key} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
          <p className={`text-2xl font-bold ${s.color}`}>{data[s.key]}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
