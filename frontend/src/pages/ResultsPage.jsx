import React from 'react'
import { Download, ArrowRight, RefreshCw, Lightbulb, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { resolveFileUrl } from '../services/api'
import SummaryBar from '../components/SummaryBar'
import TestCaseTable from '../components/TestCaseTable'

export default function ResultsPage() {
  const {
    testCases, genSummary, genExcelFile,
    formData, setStep,
  } = useApp()

  const downloadUrl = resolveFileUrl(genExcelFile)

  return (
    <div className="fade-up space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Generated Test Cases</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {formData.ticket_number && <span className="text-brand-light font-medium">{formData.ticket_number} · </span>}
            {formData.module && <span>{formData.module} · </span>}
            <span className="capitalize">{formData.tc_type}</span>
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setStep(1)}
            className="flex items-center gap-2 text-sm border border-brand-blue text-slate-400 hover:text-white hover:border-brand-accent px-4 py-2 rounded-xl transition-all">
            <RefreshCw size={14} /> Regenerate
          </button>
          {downloadUrl && (
            <a
              href={downloadUrl}
              download
              className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-semibold text-sm px-5 py-2 rounded-xl transition-all"
            >
              <Download size={15} /> Download Excel
            </a>
          )}
          <button
            onClick={() => setStep(3)}
            className="flex items-center gap-2 bg-brand-accent hover:bg-brand-light text-white font-semibold text-sm px-5 py-2 rounded-xl transition-all"
          >
            Go to Review <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Execution summary bar */}
      <SummaryBar summary={{ not_run: testCases.length, passed: 0, failed: 0, skipped: 0, blocked: 0 }} testCases={testCases} />

      {/* AI Notes */}
      {(genSummary?.assumptions?.length > 0 || genSummary?.missing_info?.length > 0 || genSummary?.coverage_notes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {genSummary?.assumptions?.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={14} className="text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400">AI Assumptions</span>
              </div>
              <ul className="space-y-1">
                {genSummary.assumptions.map((a, i) => (
                  <li key={i} className="text-xs text-yellow-200/70">• {a}</li>
                ))}
              </ul>
            </div>
          )}
          {genSummary?.missing_info?.length > 0 && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-xs font-semibold text-red-400">Missing Information</span>
              </div>
              <ul className="space-y-1">
                {genSummary.missing_info.map((m, i) => (
                  <li key={i} className="text-xs text-red-200/70">• {m}</li>
                ))}
              </ul>
            </div>
          )}
          {genSummary?.coverage_notes && (
            <div className="md:col-span-2 bg-brand-mid/20 border border-brand-blue/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-brand-light">Coverage Notes</span>
              </div>
              <p className="text-xs text-slate-400">{genSummary.coverage_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Test case table */}
      <TestCaseTable testCases={testCases} />
    </div>
  )
}
