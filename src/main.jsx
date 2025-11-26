import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import './index.css'

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found!')
  }
  
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <>
      <App />
      <Analytics />
    </>
  )
} catch (error) {
  console.error('Failed to render app:', error)
  const rootElement = document.getElementById('root')
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: white; text-align: center; font-family: sans-serif;">
        <h1>Failed to load app</h1>
        <p style="color: red;">${error.message}</p>
        <pre style="text-align: left; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px;">${error.stack}</pre>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px;">Reload Page</button>
      </div>
    `
  }
}

