import React from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { Loader2, HeartPulse } from 'lucide-react';

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
            <HeartPulse className="w-6 h-6 text-slate-950" />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Connecting to Dosiq AI Vault...</span>
          </div>
        </div>
      </div>
    );
  }

  return user ? <DashboardView /> : <LoginView />;
}

export default App;
