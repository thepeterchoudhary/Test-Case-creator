import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'
import toast from 'react-hot-toast'
import { generateTestCases, reviewTestCases } from '../services/api'

const SUGGESTIONS = [
  'Add more negative scenarios',
  'Generate automation test cases',
  'Review these test cases',
  'Fix the expected results',
  'Add security test cases',
  'Add boundary test cases',
]

export default function ChatPanel() {
  const {
    chatHistory, addChatMessage,
    testCases, setTestCases, setGenExcelFile,
    reviewedCases, setReviewedCases, setReviewExcelFile,
    formData, uploadedFiles,
    step, setStep,
  } = useApp()

  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const handleSend = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    addChatMessage('user', msg)

    setLoading(true)
    try {
      const lower = msg.toLowerCase()

      // Review intent
      if (lower.includes('review') || lower.includes('fix') || lower.includes('correct')
          || lower.includes('improve') || lower.includes('update') || lower.includes('wrong')) {
        const baseCases = reviewedCases.length ? reviewedCases : testCases
        if (!baseCases.length) {
          addChatMessage('assistant', 'No test cases found to review. Please generate test cases first.')
          return
        }
        const result = await reviewTestCases({
          original_test_cases: baseCases,
          user_instruction: msg,
          execution_notes: '',
          file_paths: uploadedFiles.map(f => f.server_path),
          ticket_number: formData.ticket_number,
          module: formData.module,
          version: formData.version,
          created_by: formData.created_by,
        })
        setReviewedCases(result.reviewed_test_cases)
        setReviewExcelFile(result.excel_file)
        setStep(3)
        addChatMessage('assistant',
          `Done! I've reviewed and updated the test cases based on your instruction.\n` +
          `📊 Summary: ${result.review_summary?.total || result.reviewed_test_cases.length} total cases. ` +
          `Modified: ${result.review_summary?.modified || 0}, Added: ${result.review_summary?.added || 0}.\n` +
          result.review_summary?.overall_comments || ''
        )
      }
      // Add / Generate intent
      else if (lower.includes('add') || lower.includes('generate') || lower.includes('create')
               || lower.includes('more') || lower.includes('missing') || lower.includes('automation')) {
        const result = await generateTestCases({
          ...formData,
          requirement: formData.requirement + `\n\nAdditional instruction: ${msg}`,
          file_paths: uploadedFiles.map(f => f.server_path),
          tc_type: lower.includes('automation') ? 'automation' : formData.tc_type,
        })
        setTestCases(result.test_cases)
        setGenExcelFile(result.excel_file)
        setStep(2)
        addChatMessage('assistant',
          `Generated ${result.test_cases.length} test cases based on your instruction. ` +
          `You can download the updated Excel file.`
        )
      } else {
        addChatMessage('assistant',
          `I understand you want to: "${msg}". To act on this, please use one of the action buttons ` +
          `(Generate, Review, Sign-Off) or be more specific, e.g., "add negative scenarios" or "review these test cases".`
        )
      }
    } catch (err) {
      toast.error(err.message)
      addChatMessage('assistant', `Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-brand-dark/50 rounded-xl border border-brand-blue/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-blue/30 bg-brand-dark">
        <Bot size={16} className="text-brand-accent" />
        <span className="text-sm font-semibold text-brand-light">QA Assistant</span>
        <span className="ml-auto text-[10px] text-slate-600">Senior QA Engineer</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {chatHistory.length === 0 && (
          <div className="text-center py-6">
            <Bot size={32} className="mx-auto text-brand-blue mb-2" />
            <p className="text-xs text-slate-500">
              Ask me to add scenarios, review test cases, fix issues, or generate sign-off.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => handleSend(s)}
                  className="text-[11px] bg-brand-blue/50 text-brand-light px-2 py-1 rounded-lg hover:bg-brand-accent/30 transition-colors border border-brand-blue">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={12} className="text-brand-accent" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap
              ${msg.role === 'user'
                ? 'bg-brand-accent text-white rounded-br-none'
                : 'bg-brand-blue/40 text-slate-300 border border-brand-blue/30 rounded-bl-none'
              }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-brand-mid flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={12} className="text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center">
              <Bot size={12} className="text-brand-accent" />
            </div>
            <div className="bg-brand-blue/40 border border-brand-blue/30 rounded-xl px-4 py-2">
              <Loader size={14} className="animate-spin text-brand-accent" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-brand-blue/30">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask me anything about test cases…"
            disabled={loading}
            className="flex-1 bg-brand-darkest border border-brand-blue rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-accent disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="bg-brand-accent hover:bg-brand-light disabled:opacity-40 text-white rounded-lg px-3 py-2 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
