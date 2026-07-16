import * as React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6 font-sans">
          <div className="max-w-xl w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-red-500/10 text-red-400 rounded-lg">⚠️</span>
              <h2 className="text-lg font-bold text-slate-100">Application Error Detected</h2>
            </div>
            
            <p className="text-sm text-slate-400">
              An unexpected error occurred during rendering. This might be due to a browser security block, missing database configurations, or an unhandled exception.
            </p>

            {this.state.error && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 overflow-x-auto">
                <code className="text-xs text-rose-400 font-mono block whitespace-pre-wrap">
                  {this.state.error.stack || this.state.error.message || String(this.state.error)}
                </code>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md"
              >
                Clear Cache & Reload
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all"
              >
                Simple Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);




