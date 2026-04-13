import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('24Shift: App initialization sequence started...');
window.APP_START_TIME = Date.now();

// Suppress the harmless Supabase Web Locks AbortError that appears
// when HMR reloads create competing Supabase client instances.
// The auth lock bypass in supabaseService.js is the real fix;
// this is a safety net for any stragglers.
window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message ?? '';
    if (
        event.reason?.name === 'AbortError' &&
        msg.includes('Lock broken')
    ) {
        event.preventDefault(); // stops it appearing in the console
    }
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
