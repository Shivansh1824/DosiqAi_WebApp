import React from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { Loader2 } from 'lucide-react';
import { DosiqLogo } from './components/common/DosiqLogo';

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <DosiqLogo size="large" showBadge={true} />
          <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Connecting to dosiq AI vault...</span>
          </div>
        </div>
      </div>
    );
  }

  return user ? <DashboardView /> : <LoginView />;
}

export default App;
