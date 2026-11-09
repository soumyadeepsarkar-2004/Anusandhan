import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  university: string;
  degreeLevel?: string;
  graduationYear?: number;
  cgpa?: number;
  targetDomains?: string[];
  skills?: string[];
  rrsScore?: number;
  rrsTier?: string;
  role?: string;
  creditsRemaining?: number;
  isVerified?: boolean;
  avatarUrl?: string;
  // Gamification, Daily Streaks & Shodh Tokens
  tokensBalance?: number;
  loginStreak?: number;
  lastLoginDate?: string;
  dailyRewardClaimedToday?: boolean;
  xpPoints?: number;
  scholarBadges?: string[];
  oauthProvider?: 'google' | 'linkedin' | 'github' | 'email';
  isPro?: boolean;
  proExpiryDate?: string;
  linkedAccounts?: {
    githubUrl?: string;
    orcidId?: string;
    googleScholarUrl?: string;
    huggingFaceUrl?: string;
    linkedinUrl?: string;
  };
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  university?: string;
  fieldOfStudy?: string;
  cgpa?: number;
}

interface DailyClaimResult {
  success: boolean;
  creditsAwarded: number;
  tokensAwarded: number;
  newStreak: number;
  message: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  registerWithCv: (cvData: any, password?: string) => Promise<void>;
  oauthLogin: (provider: 'google' | 'linkedin' | 'github', userDetails?: { email?: string; fullName?: string }) => Promise<void>;
  claimDailyReward: () => Promise<DailyClaimResult>;
  claimDailyStreak: () => Promise<DailyClaimResult>;
  redeemTokensForPlan: (planId: string, tokenCost: number, creditsToAdd: number) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (updated: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getAuthBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api/auth';
    }
    return '/api/auth';
  }
  return '/api/auth';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('rip_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('rip_auth_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${getAuthBaseUrl()}/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            setToken(storedToken);
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem('rip_auth_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Backend offline or network unreachable during session restore:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getAuthBaseUrl()}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in. Please verify your credentials.');
      }

      localStorage.setItem('rip_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      console.error('[Auth Login Error]:', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (regData: RegisterData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getAuthBaseUrl()}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account.');
      }

      localStorage.setItem('rip_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      console.error('[Auth Register Error]:', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithCv = async (cvData: any, password?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getAuthBaseUrl()}/register-with-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cvData,
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create scholar account from CV.');
      }

      localStorage.setItem('rip_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      console.error('[CV Onboarding Error]:', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const oauthLogin = async (provider: 'google' | 'linkedin' | 'github', userDetails?: { email?: string; fullName?: string }) => {
    setIsLoading(true);
    try {
      const endpoint = provider === 'google' ? `${getAuthBaseUrl()}/google` : `${getAuthBaseUrl()}/oauth`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          email: userDetails?.email,
          fullName: userDetails?.fullName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to authenticate with ${provider}.`);
      }

      localStorage.setItem('rip_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      console.error(`[OAuth ${provider} Error]:`, err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const claimDailyReward = async (): Promise<DailyClaimResult> => {
    const currentToken = token || localStorage.getItem('rip_auth_token');
    if (!currentToken || !user) {
      return {
        success: false,
        creditsAwarded: 0,
        tokensAwarded: 0,
        newStreak: 0,
        message: 'Please sign in or create an account to claim daily Shodh tokens.'
      };
    }

    try {
      const res = await fetch(`${getAuthBaseUrl()}/claim-daily-reward`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(prev => prev ? {
            ...prev,
            creditsRemaining: data.totalCredits,
            tokensBalance: data.totalTokens,
            loginStreak: data.newStreak,
            dailyRewardClaimedToday: true
          } : null);
        }
        return {
          success: true,
          creditsAwarded: data.creditsAwarded,
          tokensAwarded: data.tokensAwarded,
          newStreak: data.newStreak,
          message: data.message
        };
      } else {
        return {
          success: false,
          creditsAwarded: 0,
          tokensAwarded: 0,
          newStreak: user?.loginStreak || 1,
          message: data.message || data.error || 'Daily reward could not be claimed.'
        };
      }
    } catch (err: any) {
      console.error('[Daily Claim Error]:', err.message);
      return {
        success: false,
        creditsAwarded: 0,
        tokensAwarded: 0,
        newStreak: user?.loginStreak || 1,
        message: 'Network error communicating with token ledger. Please verify connection.'
      };
    }
  };

  const redeemTokensForPlan = async (planId: string, tokenCost: number, creditsToAdd: number) => {
    const currentToken = token || localStorage.getItem('rip_auth_token');
    try {
      if (currentToken) {
        const res = await fetch(`${getAuthBaseUrl()}/redeem-tokens`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ planId, tokenCost, creditsToAdd })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (data.user) {
            setUser(data.user);
          } else {
            setUser(prev => prev ? {
              ...prev,
              tokensBalance: data.remainingTokens,
              creditsRemaining: data.creditsRemaining,
              isPro: true
            } : null);
          }
          return { success: true, message: data.message };
        } else {
          throw new Error(data.error || 'Failed to redeem tokens.');
        }
      }
    } catch (err: any) {
      if (!err.message?.includes('fetch')) {
        throw err;
      }
    }

    // Offline fallback deduction
    if ((user?.tokensBalance || 0) < tokenCost) {
      throw new Error(`Insufficient Shodh Tokens. You have ${user?.tokensBalance || 0}, but need ${tokenCost}.`);
    }

    setUser(prev => prev ? {
      ...prev,
      tokensBalance: (prev.tokensBalance || 10) - tokenCost,
      creditsRemaining: (prev.creditsRemaining || 10) + creditsToAdd,
      isPro: true
    } : null);

    return {
      success: true,
      message: `🌟 Successfully unlocked ${planId} with ${tokenCost} Shodh Tokens! +${creditsToAdd} credits added.`
    };
  };

  const logout = () => {
    localStorage.removeItem('rip_auth_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updated } : null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      registerWithCv,
      oauthLogin,
      claimDailyReward,
      claimDailyStreak: claimDailyReward,
      redeemTokensForPlan,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
