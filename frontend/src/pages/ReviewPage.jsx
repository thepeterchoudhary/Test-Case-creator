import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Download, ArrowRight, ClipboardCheck, MessageSquare, Upload } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { uploadFiles, reviewTestCases, resolveFileUrl } from '../services/api'
import SummaryBar from '../components/SummaryBar'
import TestCaseTable from '../components/TestCaseTable'
import FileDropzone from '../components/FileDropzone'

export default function ReviewPage({ setLoading }) {
  const {
    testCases, setTestCases,
    reviewedCases, setReviewedCases,
    reviewSummary, setReviewSummary,
    reviewExcelFile, setReviewExcelFile,
    formData, uploadedFiles, setUploadedFiles,
    executionNotes, setExecutionNotes,
    userInstruction, setUserInstruction,
    addChatMessage,
    setStep,
  } = useApp()

  const [evidenceFiles, setEvidenceFiles] = useState([])
  const [busy, setBusy]                   = useState(false)

  // The "working" set – editable by user
  const workingCases = reviewedCases.length ? reviewedCases : testCases

  const handleReview = async () => {
    if (!workingCases.length) {
      toast.error('No test cases to review.')
      return
    }
    setBusy(true)
    setLoading(true)
    try {
      // Upload evidence files if any
      let allServerFiles = uploadedFiles.map(f => f.server_path)
      if (evidenceFiles.length) {
        toast('Uploading evidence files…', { icon: '📤' })
        const uploaded = await uploadFiles(evidenceFiles)
        const newPaths = uploaded.map(f => f.server_path)
        allServerFiles = [...allServerFiles, ...newPaths]
        setUploadedFiles(prev => [...prev, ...uploaded])
      }

      toast('AI is reviewing test cases…', { icon: '🔍' })
      const result = await reviewTestCases({
        original_test_cases: workingCases,
        execution_notes:     executionNotes,
        user_instruction:    userInstruction,
        file_paths:          allServerFiles,
        ticket_number:       formData.ticket_number,
        module:              formData.module,
        version:             formData.version,
        created_by:          formData.created_by,
      })

      setReviewedCases(result.reviewed_test_cases)
      setReviewSummary(result.review_summary)
      setReviewExcelFile(result.excel_file)

      addChatMessage('assistant',
        `Review complete! ${result.reviewed_test_cases.length} test cases reviewed.\n` +
        `✅ Passed: ${result.review_summary?.passed || 0}  ` +
        `❌ Failed: ${result.review_summary?.failed || 0}  ` +
        `🔒 Blocked: ${result.review_summary?.blocked || 0}\n` +
        (result.review_summary?.overall_comments || '')
      )

      toast.success('Review complete!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
      setLoading(false)
    }
  }

  const handleTableUpdate = (updated) => {
    if (reviewedCases.length) setReviewedCases(updated)
    else setTestCases(updated)
  }

  const activeReview = reviewedCases.length > 0

  return (
    <div className="fade-up space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            {activeReview ? 'Reviewed Test Cases' : 'Manual Execution Review'}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {activeReview
              ? 'AI has reviewed the executed test cases below.'
              : 'Enter execution results, upload evidence, then run AI review.'}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {activeReview && reviewExcelFile && (
            <a
              href={resolveFileUrl(reviewExcelFile)}
              download
              className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-semibold text-sm px-5 py-2 rounded-xl transition-all"
            >
              <Download size={15} /> Download Reviewed Excel
            </a>
          )}
          {activeReview && (
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-2 bg-brand-accent hover:bg-brand-light text-white font-semibold text-sm px-5 py-2 rounded-xl transition-all"
            >
              Generate Sign-Off <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Summary bar (after review) */}
      {activeReview && (
        <SummaryBar summary={reviewSummary} testCases={reviewedCases} />
      )}

      {/* Review form */}
      {!activeReview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
                <MessageSquare size={12} /> Execution Notes / Observations
              </label>
              <textarea
                value={executionNotes}
                onChange={e => setExecutionNotes(e.target.value)}
                rows={5}
                placeholder="Describe execution issues, environment problems, defects found, observations…"
                className="w-full bg-brand-dark border border-brand-blue rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-accent transition-colors resize-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
                <ClipboardCheck size={12} /> Specific Review Instruction (optional)
              </label>
              <input
                value={userInstruction}
                onChange={e => setUserInstruction(e.target.value)}
                placeholder="e.g. Fix expected results for TC_003, add missing edge cases"
                className="w-full bg-brand-dark border border-brand-blue rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
              <Upload size={12} /> Upload Executed Test Case Excel / Screenshots
            </label>
            <FileDropzone
              files={evidenceFiles}
              setFiles={setEvidenceFiles}
              label="Drop executed test case file, screenshots, or evidence…"
            />
          </div>
        </div>
      )}

      {/* AI Review button */}
      {!activeReview && (
        <div className="flex justify-end">
          <button
            onClick={handleReview}
            disabled={busy || !workingCases.length}
            className="flex items-center gap-2 bg-brand-accent hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/40"
          >
            {busy ? (
              <><span className="animate-spin">🔍</span> Reviewing…</>
            ) : (
              <><ClipboardCheck size={16} /> Start AI Review</>
            )}
          </button>
        </div>
      )}

      {/* Editable table (before review – user can fill in status/actual) */}
      {!activeReview && workingCases.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-3">
            Optionally update Status and Actual Results below before running AI review:
          </p>
          <TestCaseTable
            testCases={workingCases}
            editable={true}
            onUpdate={handleTableUpdate}
          />
        </div>
      )}

      {/* Reviewed table (read-only, colour-coded by AI) */}
      {activeReview && reviewedCases.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-light">Reviewed Cases</h3>
            <button
              onClick={handleReview}
              disabled={busy}
              className="text-xs text-brand-accent hover:text-brand-light border border-brand-blue rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              {busy ? 'Re-reviewing…' : 'Re-run Review'}
            </button>
          </div>
          <TestCaseTable testCases={reviewedCases} />
        </>
      )}
    </div>
  )
}
