import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

const DEMO_USER = {
  id: 'demo-caregiver-judge-01',
  email: 'judge.demo@dosiq.ai',
  user_metadata: {
    full_name: 'Alex Sharma',
    name: 'Alex Sharma',
  },
};

const DEMO_PRIMARY_PROFILE = {
  id: 'demo-self-01',
  user_id: 'demo-caregiver-judge-01',
  name: 'Alex Sharma',
  relationship: 'Self',
  onboarding_completed: true,
  morning_dose_time: '08:00:00',
  afternoon_dose_time: '14:00:00',
  night_dose_time: '20:00:00',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentFamilyMember, setCurrentFamilyMember] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);

  // Auto-provision or fetch primary 'Self' profile in family_members
  const ensurePrimaryProfile = async (currentUser) => {
    if (!currentUser) return null;
    if (currentUser.id === DEMO_USER.id) {
      setCurrentFamilyMember(DEMO_PRIMARY_PROFILE);
      setIsOnboarded(true);
      return DEMO_PRIMARY_PROFILE;
    }
    try {
      const { data: existingProfiles, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Could not query family_members (RLS check):', error.message);
      }

      if (existingProfiles && existingProfiles.length > 0) {
        const primary = existingProfiles[0];
        setCurrentFamilyMember(primary);
        setIsOnboarded(!!primary.onboarding_completed);
        return primary;
      }

      // Provision primary profile
      const primaryName = currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        (currentUser.email ? currentUser.email.split('@')[0] : 'Caregiver');

      const { data: newProfile, error: insertError } = await supabase
        .from('family_members')
        .insert([
          {
            user_id: currentUser.id,
            name: primaryName,
            relationship: 'Self',
            morning_dose_time: '08:00:00',
            afternoon_dose_time: '14:00:00',
            night_dose_time: '20:00:00',
          },
        ])
        .select()
        .single();

      if (insertError) {
        const fallback = { id: 'self-default', name: primaryName, relationship: 'Self', onboarding_completed: false };
        setCurrentFamilyMember(fallback);
        setIsOnboarded(false);
        return fallback;
      }

      setCurrentFamilyMember(newProfile);
      setIsOnboarded(false); // fresh signup — needs onboarding
      return newProfile;
    } catch (err) {
      console.error('Error in ensurePrimaryProfile:', err);
      return null;
    }
  };

  useEffect(() => {
    // Check initial session
    const getInitialSession = async () => {
      try {
        const isDemo = localStorage.getItem('dosiq_demo_mode') === 'true';
        if (isDemo) {
          const isDemoOnboarded = localStorage.getItem('dosiq_demo_onboarded') === 'true';
          const savedProfiles = localStorage.getItem('dosiq_demo_profiles');
          let parsedSelf = DEMO_PRIMARY_PROFILE;
          if (savedProfiles) {
            try {
              const list = JSON.parse(savedProfiles);
              if (list && list[0]) parsedSelf = list[0];
            } catch (_) {}
          }
          setUser(DEMO_USER);
          setSession({ user: DEMO_USER, access_token: 'demo-token' });
          setCurrentFamilyMember(parsedSelf);
          setIsOnboarded(isDemoOnboarded);
          setLoading(false);
          return;
        }

        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) console.error('Error fetching session:', error);
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await ensurePrimaryProfile(currentSession.user);
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        await ensurePrimaryProfile(newSession.user);
      } else {
        setCurrentFamilyMember(null);
        setIsOnboarded(false);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign In with Email and Password
  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    return data;
  };

  // Sign Up with Email and Password
  const signUpWithEmail = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });
    if (error) throw error;
    return data;
  };

  // Google OAuth Sign In
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  };

  // Verify OTP
  const verifyOtp = async (email, token, type = 'signup') => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type,
    });
    if (error) throw error;
    return data;
  };

  // Resend OTP
  const resendOtp = async (email, type = 'signup') => {
    const { data, error } = await supabase.auth.resend({
      type,
      email: email.trim().toLowerCase(),
    });
    if (error) throw error;
    return data;
  };

  // 1-Click Demo Login for Hackathon Judges & Evaluators (Bypasses OTP, email, and passwords)
  const signInAsDemo = async ({ startOnboarding = true } = {}) => {
    try {
      localStorage.setItem('dosiq_demo_mode', 'true');
      setUser(DEMO_USER);
      setSession({ user: DEMO_USER, access_token: 'demo-token' });

      if (startOnboarding) {
        localStorage.removeItem('dosiq_demo_onboarded');
        setCurrentFamilyMember({ ...DEMO_PRIMARY_PROFILE, onboarding_completed: false });
        setIsOnboarded(false);
      } else {
        localStorage.setItem('dosiq_demo_onboarded', 'true');
        setCurrentFamilyMember(DEMO_PRIMARY_PROFILE);
        setIsOnboarded(true);
      }
      return { user: DEMO_USER, session: { user: DEMO_USER } };
    } catch (err) {
      console.error('Error signing in as demo:', err);
    }
  };

  // Complete Onboarding — writes primary profile + family members to Supabase
  const completeOnboarding = async ({ primary, familyMembers }) => {
    if (!user) throw new Error('Not authenticated');

    // Demo Mode fast path
    if (user.id === DEMO_USER.id) {
      const demoSelf = {
        id: 'demo-self-01',
        user_id: user.id,
        name: primary.name?.trim() || 'Alex Sharma',
        relationship: 'Self',
        telegram_username: primary.telegram_username?.trim() || null,
        avatar_url: primary.avatar || null,
        morning_dose_time: (primary.doseTime?.morning || '08:00') + ':00',
        afternoon_dose_time: (primary.doseTime?.afternoon || '14:00') + ':00',
        night_dose_time: (primary.doseTime?.night || '20:00') + ':00',
        onboarding_completed: true,
      };

      const formattedFamily = (familyMembers || []).map((m, idx) => ({
        id: `demo-family-${idx + 1}`,
        user_id: user.id,
        name: m.name?.trim() || m.relationship,
        relationship: m.relationship,
        age: m.age || (m.relationship === 'Father' ? 64 : m.relationship === 'Mother' ? 61 : null),
        telegram_username: m.telegram_username?.trim() || null,
        avatar_url: m.avatar || null,
        morning_dose_time: (m.doseTime?.morning || '08:00') + ':00',
        afternoon_dose_time: (m.doseTime?.afternoon || '14:00') + ':00',
        night_dose_time: (m.doseTime?.night || '20:00') + ':00',
        onboarding_completed: true,
      }));

      const finalFamilyList = formattedFamily.length > 0 ? formattedFamily : [
        { id: 'demo-dad-01', user_id: user.id, name: 'Rajesh Sharma', relationship: 'Father', age: 64, onboarding_completed: true, avatar_url: 'preset-4' },
        { id: 'demo-mom-01', user_id: user.id, name: 'Sunita Sharma', relationship: 'Mother', age: 61, onboarding_completed: true, avatar_url: 'preset-5' },
      ];

      localStorage.setItem('dosiq_demo_profiles', JSON.stringify([demoSelf, ...finalFamilyList]));
      localStorage.setItem('dosiq_demo_onboarded', 'true');
      setCurrentFamilyMember(demoSelf);
      setIsOnboarded(true);
      return;
    }

    // 1. Upsert the Self row with onboarding data
    const selfRow = {
      user_id: user.id,
      name: primary.name.trim(),
      relationship: 'Self',
      phone_number: primary.phone?.trim() || null,
      telegram_username: primary.telegram_username?.trim() || null,
      avatar_url: primary.avatar || null,
      morning_dose_time:   primary.doseTime.morning   + ':00',
      afternoon_dose_time: primary.doseTime.afternoon + ':00',
      night_dose_time:     primary.doseTime.night     + ':00',
      onboarding_completed: true,
    };

    const { data: updatedSelf, error: selfError } = currentFamilyMember?.id && currentFamilyMember.id !== 'self-default'
      ? await supabase.from('family_members').update(selfRow).eq('id', currentFamilyMember.id).select().single()
      : await supabase.from('family_members').insert(selfRow).select().single();

    if (selfError) throw selfError;

    // 2. Insert each family member (skip if empty)
    if (familyMembers.length > 0) {
      const rows = familyMembers.map(m => {
        const resolvedGender = m.gender || (
          ['Father', 'Brother', 'Son'].includes(m.relationship) ? 'male' :
          ['Mother', 'Sister', 'Daughter'].includes(m.relationship) ? 'female' : null
        );
        const approxDob = m.age ? `${new Date().getFullYear() - parseInt(m.age, 10)}-01-01` : null;

        return {
          user_id: user.id,
          name: m.name.trim() || m.relationship,
          relationship: m.relationship,
          gender: resolvedGender,
          date_of_birth: approxDob,
          phone_number: m.phone?.trim() || null,
          telegram_username: m.telegram_username?.trim() || null,
          avatar_url: m.avatar || null,
          morning_dose_time:   m.doseTime.morning   + ':00',
          afternoon_dose_time: m.doseTime.afternoon + ':00',
          night_dose_time:     m.doseTime.night     + ':00',
          onboarding_completed: true,
        };
      });
      const { error: familyError } = await supabase.from('family_members').insert(rows);
      if (familyError) throw familyError;
    }

    // 3. Update Supabase auth metadata
    await supabase.auth.updateUser({
      data: {
        full_name: primary.name.trim(),
        onboarding_completed: true,
        telegram_username: primary.telegram_username?.trim() || null,
        avatar_url: primary.avatar || null,
      },
    });

    // 4. Update local state — triggers App.jsx to render DashboardView
    setCurrentFamilyMember(updatedSelf);
    setIsOnboarded(true);
  };

  // Sign Out
  const signOut = async () => {
    localStorage.removeItem('dosiq_demo_mode');
    localStorage.removeItem('dosiq_demo_onboarded');
    localStorage.removeItem('dosiq_demo_profiles');
    setUser(null);
    setSession(null);
    setCurrentFamilyMember(null);
    setIsOnboarded(false);
    await supabase.auth.signOut().catch(() => {});
  };

  const value = {
    user,
    session,
    loading,
    isOnboarded,
    currentFamilyMember,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAsDemo,
    verifyOtp,
    resendOtp,
    signOut,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
