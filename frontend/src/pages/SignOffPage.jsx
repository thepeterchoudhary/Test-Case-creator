import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Download, FileCheck2, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { generateSignoff, resolveFileUrl } from '../services/api'
import SummaryBar from '../components/SummaryBar'

function SignOffBlock({ text }) {
  if (!text) return null

  const lines = text.split('\n')
  return (
    <div className="signoff-content space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} className="h-2" />
        if (trimmed.startsWith('##')) {
          return <h2 key={i} className="text-sm font-bold text-brand-light mt-3">{trimmed.replace(/^#+\s*/, '')}</h2>
        }
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return <h2 key={i} className="text-sm font-bold text-brand-light mt-3">{trimmed.replace(/\*\*/g, '')}</h2>
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return <li key={i} className="text-xs text-slate-400 ml-4">{trimmed.slice(2)}</li>
        }
        if (trimmed.includes(':') && !trimmed.startsWith('http')) {
          const [k, ...rest] = trimmed.split(':')
          return (
            <p key={i} className="text-xs">
              <span className="font-semibold text-slate-300">{k}:</span>
              <span className="text-slate-400"> {rest.join(':')}</span>
            </p>
          )
        }
        return <p key={i} className="text-xs text-slate-400">{trimmed}</p>
      })}
    </div>
  )
}

export default function SignOffPage({ setLoading }) {
  const {
    reviewedCases, reviewSummary,
    signoffText, setSignoffText,
    signoffFile, setSignoffFile,
    formData, addChatMessage,
  } = useApp()

  const [template, setTemplate]       = useState('')
  const [showTemplate, setShowTemplate] = useState(false)
  const [busy, setBusy]               = useState(false)

  const handleGenerate = async () => {
    setBusy(true)
    setLoading(true)
    try {
      toast('Generating QA Sign-Off document…', { icon: '📄' })
      const result = await generateSignoff({
        ticket_number:       formData.ticket_number,
        module:              formData.module,
        requirement_summary: formData.requirement?.slice(0, 500),
        review_summary:      reviewSummary,
        reviewed_test_cases: reviewedCases,
        template_text:       template,
        created_by:          formData.created_by,
      })
      setSignoffText(result.signoff_text)
      setSignoffFile(result.excel_file)

      addChatMessage('assistant',
        `QA Sign-Off document generated for ${formData.ticket_number || 'the ticket'}. ` +
        `The document is ready to download.`
      )
      toast.success('Sign-Off document generated!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
      setLoading(false)
    }
  }

  const hasSignoff = !!signoffText

  return (
    <div className="fade-up space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">QA Sign-Off Document</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Generate the final QA sign-off based on test execution results.
          </p>
        </div>
        {hasSignoff && signoffFile && (
          <a
            href={resolveFileUrl(signoffFile)}
            download
            className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-semibold text-sm px-5 py-2 rounded-xl transition-all"
          >
            <Download size={15} /> Download Sign-Off Excel
          </a>
        )}
      </div>

      {/* Execution summary */}
      {Object.keys(reviewSummary).length > 0 && (
        <SummaryBar summary={reviewSummary} testCases={reviewedCases} />
      )}

      {/* Template section */}
      <div className="bg-brand-dark border border-brand-blue/50 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowTemplate(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-brand-light hover:bg-brand-blue/20 transition-colors"
        >
          <span className="flex items-center gap-2">
            <FileText size={15} />
            Sign-Off Template (optional)
          </span>
          {showTemplate ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {showTemplate && (
          <div className="px-4 pb-4">
            <p className="text-xs text-slate-500 mb-2">
              Paste your standard sign-off template. The AI will fill it in while preserving its structure.
            </p>
            <textarea
              value={template}
              onChange={e => setTemplate(e.target.value)}
              rows={8}
              placeholder="Paste your sign-off template here…&#10;&#10;Example:&#10;Ticket Number: [TICKET]&#10;Module: [MODULE]&#10;Testing Scope: [SCOPE]&#10;Total Test Cases: [TOTAL]&#10;Passed: [PASSED]&#10;Failed: [FAILED]&#10;QA Status: [STATUS]"
              className="w-full bg-brand-darkest border border-brand-blue rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-accent transition-colors resize-none font-mono"
            />
          </div>
        )}
      </div>

      {/* Generate button */}
      {!hasSignoff && (
        <div className="flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={busy}
            className="flex items-center gap-2 bg-brand-accent hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-10 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/40 text-base"
          >
            {busy ? (
              <><span className="animate-spin">📄</span> Generating…</>
            ) : (
              <><FileCheck2 size={18} /> Generate Sign-Off Document</>
            )}
          </button>
        </div>
      )}

      {/* Generated sign-off preview */}
      {hasSignoff && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-light flex items-center gap-2">
              <FileCheck2 size={15} className="text-green-400" />
              Sign-Off Document Preview
            </h3>
            <button
              onClick={handleGenerate}
              disabled={busy}
              className="text-xs text-brand-accent hover:text-brand-light border border-brand-blue rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              Regenerate
            </button>
          </div>
          <div className="bg-brand-dark border border-brand-blue/50 rounded-xl p-6 max-h-[60vh] overflow-y-auto">
            {/* Title bar mimicking the dark-blue template look */}
            <div className="bg-brand-mid rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-base">QA Sign-Off Document</p>
                {formData.ticket_number && (
                  <p className="text-brand-light text-xs mt-0.5">
                    {formData.ticket_number} · {formData.module}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Prepared by</p>
                <p className="text-sm text-white font-medium">{formData.created_by || '<name>'}</p>
              </div>
            </div>
            <SignOffBlock text={signoffText} />
          </div>
        </div>
      )}
    </div>
  )
}
