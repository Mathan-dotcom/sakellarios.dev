import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LiveErrorBoundary } from './components/LiveErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LiveErrorBoundary>
      <App />
    </LiveErrorBoundary>
  </React.StrictMode>
);
