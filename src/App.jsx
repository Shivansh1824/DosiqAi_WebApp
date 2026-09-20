import React from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { OnboardingView } from './components/onboarding/OnboardingView';
import { Loader2 } from 'lucide-react';
import { DosiqLogo } from './components/common/DosiqLogo';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export function App() {
  const { user, loading, isOnboarded } = useAuth();

  return (
    <ErrorBoundary>
      {loading ? (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-800">
          <div className="flex flex-col items-center gap-4">
            <DosiqLogo size="large" showBadge={true} />
            <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Connecting to dosiq AI vault...</span>
            </div>
          </div>
        </div>
      ) : !user ? (
        <LoginView />
      ) : !isOnboarded ? (
        <OnboardingView />
      ) : (
        <DashboardView />
      )}
    </ErrorBoundary>
  );
}

export default App;

