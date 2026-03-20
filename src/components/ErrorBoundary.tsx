'use client';
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex flex-col items-center justify-center p-8 rounded-lg m-4"
          style={{
            background: '#1a1a2e',
            border: '1px solid rgba(68,102,136,0.5)',
            minHeight: 200,
          }}
        >
          <span className="text-3xl mb-3">⚠️</span>
          <h2
            className="text-lg font-bold mb-2"
            style={{ color: '#FF6666' }}
          >
            Something went wrong
          </h2>
          <p
            className="text-sm mb-4 text-center max-w-md"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            {this.state.error?.message || 'An unexpected error occurred while rendering this section.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105"
            style={{
              background: 'rgba(255,102,102,0.15)',
              border: '1px solid #FF6666',
              color: '#FF6666',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
