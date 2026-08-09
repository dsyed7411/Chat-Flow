import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PulseChat Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#fff', textAlign: 'center', padding: '20px' }}>
          <div style={{ background: 'rgba(18, 24, 38, 0.95)', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '440px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
            <h2 style={{ marginBottom: '12px', color: '#6366f1', fontSize: '1.5rem' }}>PulseChat Session Notice</h2>
            <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '24px', lineHeight: 1.5 }}>
              {this.state.error?.message || 'An unexpected issue occurred while loading the workspace.'}
            </p>
            <button
              onClick={this.handleReset}
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}
            >
              Reset Session & Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
