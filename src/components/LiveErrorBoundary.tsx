import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class LiveErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[LiveErrorBoundary caught error]:', error, errorInfo);
  }

  render() {
    const isLive = import.meta.env.VITE_USE_LIVE_DATA === 'true';

    // With flag off, render children untouched even if error occurs
    if (!isLive) {
      return this.props.children;
    }

    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            backgroundColor: '#0D0D0C',
            color: '#C84B31',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'monospace',
            letterSpacing: '0.12em',
            padding: '24px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            LIVE DATA ERROR // see console
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
            CHANCERY TELEMETRY FAULT OCCURRED IN LIVE BRIDGE STREAM
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
