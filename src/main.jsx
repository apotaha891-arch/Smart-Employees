/**
 * Smart Employees - Entry Point
 * Initialized with 24Shift Core Contexts
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('🚀 Platform Entry Point (main.jsx) Executing...');
window.APP_START_TIME = Date.now();

// Simple Error Boundary for initialization debugging
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('CRITICAL INITIALIZATION ERROR:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', margin: '20px', fontFamily: 'sans-serif' }}>
          <h2 style={{ marginTop: 0 }}>Platform Crashed During Initialization</h2>
          <p><strong>Error Message:</strong> {this.state.error?.message}</p>
          <pre style={{ fontSize: '11px', background: 'rgba(0,0,0,0.05)', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHtight: '300px' }}>
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '8px 16px', background: '#991b1b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Retry Initialization
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Suppress the harmless Supabase Web Locks AbortError that appears
// when HMR reloads create competing Supabase client instances.
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
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)

