import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AppProvider } from './context/AppContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0a3d62',
              color: '#fff',
              border: '1px solid #2e86c1',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#00C853', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#FF1744', secondary: '#fff' } },
          }}
        />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
)
