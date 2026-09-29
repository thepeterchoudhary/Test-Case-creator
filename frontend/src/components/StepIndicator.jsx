import React from 'react'
import { CheckCircle, Circle, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'

const STEPS = [
  { id: 1, label: 'Input',      sub: 'Ticket & Requirements' },
  { id: 2, label: 'Generate',   sub: 'AI Test Cases' },
  { id: 3, label: 'Review',     sub: 'Execution Review' },
  { id: 4, label: 'Sign-Off',   sub: 'QA Document' },
]

export default function StepIndicator({ loading }) {
  const { step, setStep, testCases, reviewedCases } = useApp()

  const canNavigate = (id) => {
    if (id === 1) return true
    if (id === 2) return testCases.length > 0
    if (id === 3) return reviewedCases.length > 0 || testCases.length > 0
    if (id === 4) return reviewedCases.length > 0
    return false
  }

  return (
    <div className="flex items-center justify-center gap-0 mb-8 select-none">
      {STEPS.map((s, idx) => {
        const done    = step > s.id
        const active  = step === s.id
        const allowed = canNavigate(s.id)

        return (
          <React.Fragment key={s.id}>
            <button
              onClick={() => allowed && !loading && setStep(s.id)}
              disabled={!allowed || loading}
              className={`flex flex-col items-center group transition-all
                ${allowed && !loading ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
              {/* Circle */}
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                border-2 transition-all duration-300
                ${done   ? 'bg-green-600 border-green-500 text-white' : ''}
                ${active ? 'bg-brand-accent border-brand-light text-white shadow-lg shadow-blue-900/50' : ''}
                ${!done && !active ? 'bg-brand-dark border-brand-blue text-brand-light' : ''}
              `}>
                {done
                  ? <CheckCircle size={18} />
                  : active && loading
                    ? <Loader size={18} className="animate-spin" />
                    : <span className="text-sm font-bold">{s.id}</span>
                }
              </div>

              {/* Labels */}
              <span className={`mt-1 text-xs font-semibold tracking-wide
                ${active ? 'text-brand-light' : done ? 'text-green-400' : 'text-slate-500'}`}>
                {s.label}
              </span>
              <span className="text-[10px] text-slate-600 hidden sm:block">{s.sub}</span>
            </button>

            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div className={`h-[2px] w-16 sm:w-24 mx-1 rounded transition-all duration-500
                ${step > s.id ? 'bg-green-600' : 'bg-brand-blue'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
