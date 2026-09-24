import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { LandingPage } from './components/landing/LandingPage';
import { DashboardView } from './components/dashboard/DashboardView';
import { OnboardingView } from './components/onboarding/OnboardingView';
import { Loader2 } from 'lucide-react';
import { DosiqLogo } from './components/common/DosiqLogo';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { MobileUploadView } from './components/dashboard/MobileUploadView';

function App() {
  const isMobileUpload = typeof window !== 'undefined' && window.location.search.includes('mobile_upload=true');

  if (isMobileUpload) {
    return (
      <ErrorBoundary>
        <MobileUploadView />
      </ErrorBoundary>
    );
  }

  const { user, loading, isOnboarded } = useAuth();
  const [showLanding, setShowLanding] = useState(true);

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
        showLanding ? (
          <LandingPage onStart={() => setShowLanding(false)} />
        ) : (
          <LoginView />
        )
      ) : !isOnboarded ? (
        <OnboardingView />
      ) : (
        <DashboardView />
      )}
    </ErrorBoundary>
  );
}

export default App;

