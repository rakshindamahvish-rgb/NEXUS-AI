import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useScenario } from '../../context/ScenarioContext';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export const Layout: React.FC = () => {
  const { error, toastMessage, clearToast, loading } = useScenario();

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden text-gray-100">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar />

        {/* Global Toast / Notification Bar */}
        {toastMessage && (
          <div className="mx-6 mt-3 p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between shadow-glow-emerald animate-fade-in z-10">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-nexus-emerald flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={clearToast} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Global Error Bar */}
        {error && (
          <div className="mx-6 mt-3 p-3 rounded-lg bg-red-950/80 border border-red-500/40 text-xs text-red-200 flex items-center justify-between shadow-glow-red animate-fade-in z-10">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-nexus-red flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={clearToast} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Outlet */}
        <main className="flex-1 p-6">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-nexus-cyan border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-mono text-gray-400">Loading supply network model & simulation engine...</p>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};
