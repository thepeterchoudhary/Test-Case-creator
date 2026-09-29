import React, { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // Workflow step: 1=input, 2=results, 3=review, 4=signoff
  const [step, setStep] = useState(1)

  // Step 1 – form data
  const [formData, setFormData] = useState({
    ticket_number: '',
    requirement:   '',
    module:        '',
    version:       '1',
    created_by:    '',
    tc_type:       'manual',
    app_url:       '',
  })

  // Uploaded file paths (server-side)
  const [uploadedFiles, setUploadedFiles] = useState([])

  // Step 2 – generated test cases
  const [testCases,    setTestCases]    = useState([])
  const [genSummary,   setGenSummary]   = useState({})
  const [genExcelFile, setGenExcelFile] = useState('')

  // Step 3 – reviewed test cases
  const [reviewedCases,    setReviewedCases]    = useState([])
  const [reviewSummary,    setReviewSummary]    = useState({})
  const [reviewExcelFile,  setReviewExcelFile]  = useState('')
  const [executionNotes,   setExecutionNotes]   = useState('')
  const [userInstruction,  setUserInstruction]  = useState('')

  // Step 4 – sign-off
  const [signoffText,  setSignoffText]  = useState('')
  const [signoffFile,  setSignoffFile]  = useState('')

  // Chat history for conversational follow-ups
  const [chatHistory, setChatHistory] = useState([])

  const addChatMessage = (role, content) => {
    setChatHistory(prev => [...prev, { role, content, ts: Date.now() }])
  }

  const resetWorkflow = () => {
    setStep(1)
    setFormData({
      ticket_number: '', requirement: '', module: '', version: '1',
      created_by: '', tc_type: 'manual', app_url: '',
    })
    setUploadedFiles([])
    setTestCases([])
    setGenSummary({})
    setGenExcelFile('')
    setReviewedCases([])
    setReviewSummary({})
    setReviewExcelFile('')
    setExecutionNotes('')
    setUserInstruction('')
    setSignoffText('')
    setSignoffFile('')
    setChatHistory([])
  }

  return (
    <AppContext.Provider value={{
      step, setStep,
      formData, setFormData,
      uploadedFiles, setUploadedFiles,
      testCases, setTestCases,
      genSummary, setGenSummary,
      genExcelFile, setGenExcelFile,
      reviewedCases, setReviewedCases,
      reviewSummary, setReviewSummary,
      reviewExcelFile, setReviewExcelFile,
      executionNotes, setExecutionNotes,
      userInstruction, setUserInstruction,
      signoffText, setSignoffText,
      signoffFile, setSignoffFile,
      chatHistory, addChatMessage,
      resetWorkflow,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
