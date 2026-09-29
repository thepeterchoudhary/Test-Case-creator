import React, { useState } from 'react'
import { useApp } from './context/AppContext'
import StepIndicator from './components/StepIndicator'
import ChatPanel from './components/ChatPanel'
import InputPage from './pages/InputPage'
import ResultsPage from './pages/ResultsPage'
import ReviewPage from './pages/ReviewPage'
import SignOffPage from './pages/SignOffPage'
import { RotateCcw, Bot, ChevronLeft, ChevronRight, Beaker } from 'lucide-react'

export default function App() {
  const { step, resetWorkflow } = useApp()
  const [loading, setLoading]   = useState(false)
  const [chatOpen, setChatOpen]  = useState(true)

  const renderPage = () => {
    switch (step) {
      case 1: return <InputPage   setLoading={setLoading} />
      case 2: return <ResultsPage setLoading={setLoading} />
      case 3: return <ReviewPage  setLoading={setLoading} />
      case 4: return <SignOffPage setLoading={setLoading} />
      default: return <InputPage  setLoading={setLoading} />
    }
  }

  return (
    <div className="min-h-screen bg-brand-darkest flex flex-col">
      {/* ── Top Nav ──────────────────────────────────────────────────────── */}
      <header className="bg-brand-dark border-b border-brand-blue/40 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center">
            <Beaker size={16} className="text-brand-accent" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">AI Test Case Generator</h1>
            <p className="text-[10px] text-slate-500">Powered by Gemini · Senior QA Engineer</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Chat toggle */}
          <button
            onClick={() => setChatOpen(v => !v)}
            title={chatOpen ? 'Hide assistant' : 'Show assistant'}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all
              ${chatOpen
                ? 'bg-brand-accent/20 border-brand-accent/40 text-brand-light'
                : 'bg-brand-dark border-brand-blue text-slate-500 hover:text-slate-300'
              }`}
          >
            <Bot size={13} />
            <span className="hidden sm:inline">QA Assistant</span>
            {chatOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>

          {/* Reset */}
          <button
            onClick={resetWorkflow}
            title="Start new session"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 border border-brand-blue hover:border-red-800 px-3 py-1.5 rounded-lg transition-all"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">New Session</span>
          </button>
        </div>
      </header>

      {/* ── Loading bar ──────────────────────────────────────────────────── */}
      {loading && (
        <div className="h-0.5 bg-brand-dark overflow-hidden flex-shrink-0">
          <div className="h-full bg-brand-accent animate-pulse w-full" style={{ animation: 'pulse 1s ease-in-out infinite' }} />
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Page area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <StepIndicator loading={loading} />
            {renderPage()}
          </div>
        </main>

        {/* ── Chat Panel (right sidebar) ──────────────────────────────────── */}
        {chatOpen && (
          <aside className="w-80 xl:w-96 flex-shrink-0 border-l border-brand-blue/40 flex flex-col overflow-hidden">
            <ChatPanel />
          </aside>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-brand-dark border-t border-brand-blue/30 px-6 py-2 text-center flex-shrink-0">
        <p className="text-[10px] text-slate-700">
          AI Test Case Generator · Gemini-powered · Senior QA Engineer workflow
        </p>
      </footer>
    </div>
  )
}
