import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Sparkles, FlaskConical, Ticket, User, Package, Hash, Link, RotateCcw } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { uploadFiles, generateTestCases } from '../services/api'
import FileDropzone from '../components/FileDropzone'

export default function InputPage({ setLoading }) {
  const {
    formData, setFormData,
    uploadedFiles, setUploadedFiles,
    setTestCases, setGenSummary, setGenExcelFile,
    setStep, addChatMessage,
  } = useApp()

  const [localFiles, setLocalFiles] = useState([])
  const [busy, setBusy]             = useState(false)

  const updateField = (field) => (e) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }))

  const canGenerate = !busy && (formData.requirement.trim().length > 0 || localFiles.length > 0)

  const handleGenerate = async () => {
    if (!formData.requirement.trim() && localFiles.length === 0) {
      toast.error('Please enter a requirement or attach at least one document.')
      return
    }

    setBusy(true)
    setLoading(true)
    try {
      // 1. Upload files first
      let serverFiles = uploadedFiles
      if (localFiles.length) {
        toast('Uploading files…', { icon: '📤' })
        const uploaded = await uploadFiles(localFiles)
        serverFiles = uploaded
        setUploadedFiles(uploaded)
      }

      // 2. Generate
      toast('Generating test cases…', { icon: '🤖' })
      const result = await generateTestCases({
        ...formData,
        file_paths: serverFiles.map(f => f.server_path),
      })

      setTestCases(result.test_cases)
      setGenSummary(result.summary)
      setGenExcelFile(result.excel_file)

      addChatMessage('assistant',
        `Generated ${result.test_cases.length} test cases for ${formData.module || 'the module'}. ` +
        `Coverage includes functional, UI, boundary, error handling, and ${result.summary?.coverage_notes || 'integration'} scenarios. ` +
        (result.summary?.assumptions?.length
          ? `\n⚠️ Assumptions: ${result.summary.assumptions.join('; ')}`
          : '')
      )

      toast.success(`${result.test_cases.length} test cases generated!`)
      setStep(2)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto fade-up">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/30 rounded-full px-4 py-1.5 mb-4">
          <Sparkles size={14} className="text-brand-accent" />
          <span className="text-xs text-brand-light font-medium">QA Engineer AI</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Test Case Generator</h1>
        <p className="text-sm text-slate-400">
          Provide your ticket and requirements — the AI will generate comprehensive test cases.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main form – col span 2 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ticket info row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
                <Ticket size={12} /> Ticket Number
              </label>
              <input
                value={formData.ticket_number}
                onChange={updateField('ticket_number')}
                placeholder="e.g. JIRA-1234"
                className="input-field w-full bg-brand-dark border border-brand-blue rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
                <User size={12} /> Created By
              </label>
              <input
                value={formData.created_by}
                onChange={updateField('created_by')}
                placeholder="Your name"
                className="w-full bg-brand-dark border border-brand-blue rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          </div>

          {/* Module + Version row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
                <Package size={12} /> Module / Feature
              </label>
              <input
                value={formData.module}
                onChange={updateField('module')}
                placeholder="e.g. Shopping Cart"
                className="w-full bg-brand-dark border border-brand-blue rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
                <Hash size={12} /> Version
              </label>
              <input
                value={formData.version}
                onChange={updateField('version')}
                placeholder="1"
                className="w-full bg-brand-dark border border-brand-blue rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          </div>

          {/* Test type */}
          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
              <FlaskConical size={12} /> Test Case Type
            </label>
            <div className="flex gap-3">
              {[
                { value: 'manual',     label: 'Manual',     icon: '📋' },
                { value: 'automation', label: 'Automation', icon: '🤖' },
              ].map(opt => (
                <label key={opt.value}
                  className={`flex items-center gap-2 flex-1 border rounded-xl px-4 py-3 cursor-pointer transition-all
                    ${formData.tc_type === opt.value
                      ? 'border-brand-accent bg-brand-accent/10 text-white'
                      : 'border-brand-blue bg-brand-dark text-slate-400 hover:border-brand-accent/50'
                    }`}>
                  <input type="radio" name="tc_type" value={opt.value}
                    checked={formData.tc_type === opt.value}
                    onChange={updateField('tc_type')}
                    className="hidden" />
                  <span>{opt.icon}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* App URL (automation only) */}
          {formData.tc_type === 'automation' && (
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
                <Link size={12} /> Application URL
              </label>
              <input
                value={formData.app_url}
                onChange={updateField('app_url')}
                placeholder="https://app.example.com"
                className="w-full bg-brand-dark border border-brand-blue rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          )}

          {/* Requirement */}
          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
              <Sparkles size={12} /> Requirement / Acceptance Criteria
              <span className="text-slate-600 ml-1">(or attach a document)</span>
            </label>
            <textarea
              value={formData.requirement}
              onChange={updateField('requirement')}
              rows={8}
              placeholder="Paste your requirement, Jira ticket description, acceptance criteria, or user story here… (optional if a document is attached)"
              className="w-full bg-brand-dark border border-brand-blue rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-accent transition-colors resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Right panel – uploads */}
        <div className="space-y-4">
          <div className="bg-brand-dark border border-brand-blue/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-brand-light mb-1">Supporting Documents</h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Attach a doc to generate without typing a requirement
            </p>
            <FileDropzone
              files={localFiles}
              setFiles={setLocalFiles}
              label="Drop requirement docs, screenshots, wireframes…"
            />
            {localFiles.length > 0 && (
              <p className="text-[11px] text-green-400 mt-2 flex items-center gap-1">
                ✓ {localFiles.length} file(s) attached — ready to generate
              </p>
            )}
          </div>

          {/* Tips */}
          <div className="bg-brand-mid/20 border border-brand-blue/30 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-brand-light mb-2">💡 Tips</h4>
            <ul className="text-[11px] text-slate-500 space-y-1.5 list-disc list-inside">
              <li>Paste full Jira ticket descriptions</li>
              <li>Attach wireframes or screenshots</li>
              <li>Include acceptance criteria</li>
              <li>Mention dependencies or integrations</li>
              <li>Specify role-based scenarios</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-brand-blue/30">
        <button
          onClick={() => {
            setFormData({ ticket_number:'', requirement:'', module:'', version:'1', created_by:'', tc_type:'manual', app_url:'' })
            setLocalFiles([])
          }}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RotateCcw size={14} /> Clear
        </button>

        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="flex items-center gap-2 bg-brand-accent hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/40"
        >
          {busy ? (
            <><span className="animate-spin">⏳</span> Generating…</>
          ) : (
            <><Sparkles size={16} /> Generate Test Cases</>
          )}
        </button>
      </div>
    </div>
  )
}
