import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LostFoundProvider } from './contexts/LostFoundContext'
import { MarketProvider } from './contexts/MarketContext'
import { NewsProvider } from './contexts/NewsContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NewsProvider>
        <LostFoundProvider>
          <MarketProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </MarketProvider>
        </LostFoundProvider>
      </NewsProvider>
    </AuthProvider>
  </StrictMode>,
)
