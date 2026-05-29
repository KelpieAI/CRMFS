import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { validateEnvironment } from './lib/validateEnv';

try {
  validateEnvironment();
} catch (error) {
  const root = document.getElementById('root')!;
  root.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; background-color: #f9fafb; font-family: system-ui, -apple-system, sans-serif;">
      <div style="max-width: 600px; background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #dc2626; font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem;">
          ⚠️ Configuration Error
        </h1>
        <div style="color: #374151; line-height: 1.6; white-space: pre-wrap; font-size: 0.95rem;">
          ${error instanceof Error ? error.message : 'Unknown error occurred'}
        </div>
        <div style="margin-top: 1.5rem; padding: 1rem; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0.25rem;">
          <strong style="color: #92400e;">Important:</strong>
          <p style="color: #78350f; margin-top: 0.5rem; font-size: 0.9rem;">
            This application is permanently configured for a specific Supabase project and cannot be deployed to other instances.
          </p>
        </div>
      </div>
    </div>
  `;
  throw error;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
