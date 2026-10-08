import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import { DataProvider } from './lib/data'
import { LangProvider } from './i18n'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LangProvider>
        <DataProvider>
          <App />
          <Toaster position="top-right" richColors closeButton />
        </DataProvider>
      </LangProvider>
    </BrowserRouter>
  </React.StrictMode>
)
