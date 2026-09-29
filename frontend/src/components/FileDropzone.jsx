import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, X, FileText, Image, FileSpreadsheet, File } from 'lucide-react'

const ICON_MAP = {
  'image/':       Image,
  'application/pdf': FileText,
  'application/vnd': FileSpreadsheet,
  'text/':        FileText,
}

function getIcon(type = '') {
  for (const [prefix, Icon] of Object.entries(ICON_MAP)) {
    if (type.startsWith(prefix)) return Icon
  }
  return File
}

export default function FileDropzone({ files, setFiles, label = 'Drop files here', accept, maxFiles = 10 }) {
  const onDrop = useCallback(accepted => {
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size))
      const newFiles = accepted.filter(f => !existing.has(f.name + f.size))
      return [...prev, ...newFiles].slice(0, maxFiles)
    })
  }, [setFiles, maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept || {
      'image/*':       [],
      'application/pdf': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
      'application/vnd.ms-excel': [],
      'text/plain':    [],
      'text/csv':      [],
    },
    maxFiles,
  })

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-brand-accent bg-brand-accent/10 dropzone-active'
            : 'border-brand-blue hover:border-brand-accent hover:bg-brand-accent/5'
          }
        `}
      >
        <input {...getInputProps()} />
        <UploadCloud size={32} className={`mx-auto mb-2 ${isDragActive ? 'text-brand-accent' : 'text-brand-blue'}`} />
        <p className="text-sm text-slate-400">
          {isDragActive ? 'Drop files here…' : label}
        </p>
        <p className="text-xs text-slate-600 mt-1">
          PDF, DOCX, XLSX, CSV, TXT, Images (PNG/JPG)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
          {files.map((file, idx) => {
            const Icon = getIcon(file.type)
            return (
              <div key={idx} className="flex items-center gap-2 bg-brand-dark border border-brand-blue rounded-lg px-3 py-2">
                <Icon size={14} className="text-brand-light flex-shrink-0" />
                <span className="text-xs text-slate-300 truncate flex-1">{file.name}</span>
                <span className="text-[10px] text-slate-600">
                  {(file.size / 1024).toFixed(0)}KB
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-slate-600 hover:text-red-400 transition-colors ml-1"
                >
                  <X size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
