import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentFamilyMember, setCurrentFamilyMember] = useState(null);

  // Auto-provision or fetch primary 'Self' profile in family_members
  const ensurePrimaryProfile = async (currentUser) => {
    if (!currentUser) return null;
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
        setCurrentFamilyMember(existingProfiles[0]);
        return existingProfiles[0];
      }

      // Provision primary profile
      const primaryName = currentUser.user_metadata?.full_name ||
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
        const fallback = { id: 'self-default', name: primaryName, relationship: 'Self' };
        setCurrentFamilyMember(fallback);
        return fallback;
      }

      setCurrentFamilyMember(newProfile);
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

  // Sign Out
  const signOut = async () => {
    setUser(null);
    setSession(null);
    setCurrentFamilyMember(null);
    await supabase.auth.signOut().catch(() => {});
  };

  const value = {
    user,
    session,
    loading,
    currentFamilyMember,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
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
