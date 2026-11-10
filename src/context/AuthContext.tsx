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
  initiateOAuth: (provider: 'google' | 'linkedin' | 'github') => void;
  oauthLogin: (provider: 'google' | 'linkedin' | 'github', userDetails?: { email?: string; fullName?: string }) => Promise<void>;
  claimDailyReward: () => Promise<DailyClaimResult>;
  claimDailyStreak: () => Promise<DailyClaimResult>;
  redeemTokensForPlan: (planId: string, tokenCost: number, creditsToAdd: number) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (updated: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getCandidateAuthUrls = (subpath: string): string[] => {
  const cleanPath = subpath.startsWith('/') ? subpath : `/${subpath}`;
  const candidates: string[] = [];
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin.includes('anusandhan.vercel.app')) {
      candidates.push(`/api/auth${cleanPath}`);
    } else {
      // Local dev or other host: prioritize relative /api/auth (proxied by Vite), then direct production Vercel, then local 5000
      candidates.push(`/api/auth${cleanPath}`);
      candidates.push(`https://anusandhan.vercel.app/api/auth${cleanPath}`);
      candidates.push(`http://localhost:5000/api/auth${cleanPath}`);
    }
  } else {
    candidates.push(`/api/auth${cleanPath}`);
  }
  return candidates;
};

async function fetchWithCandidateUrls(subpath: string, options: RequestInit): Promise<Response> {
  const urls = getCandidateAuthUrls(subpath);
  let lastError: any = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type') || '';
      // Ensure we only accept real JSON API responses and never HTML SPA fallbacks
      if (contentType.includes('application/json')) {
        return res;
      }
    } catch (e) {
      lastError = e;
    }
  }
  if (lastError) throw lastError;
  throw new Error('Authentication gateway unreachable.');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('rip_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on mount
  useEffect(() => {
    const restoreSession = async () => {
      // 1. Process URL OAuth callback parameters if returning from social sign-in redirect
      if (typeof window !== 'undefined' && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const oauthError = urlParams.get('error') || urlParams.get('error_description');

        if (oauthError) {
          console.warn('[OAuth Provider Error]:', oauthError);
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (code) {
          const provider = (sessionStorage.getItem('rip_oauth_provider') || 'google') as 'google' | 'linkedin' | 'github';
          const redirectUri = sessionStorage.getItem('rip_oauth_redirect_uri') || window.location.origin;

          // Clear URL parameters cleanly
          window.history.replaceState({}, document.title, window.location.pathname);
          sessionStorage.removeItem('rip_oauth_provider');
          sessionStorage.removeItem('rip_oauth_state');
          sessionStorage.removeItem('rip_oauth_redirect_uri');

          try {
            const exchangeRes = await fetchWithCandidateUrls('/oauth/exchange', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ provider, code, redirectUri })
            });

            if (exchangeRes.ok) {
              const data = await exchangeRes.json();
              if (data.token && data.user) {
                localStorage.setItem('rip_auth_token', data.token);
                localStorage.setItem('rip_user_profile', JSON.stringify(data.user));
                setUser(data.user);
                setToken(data.token);
                setIsLoading(false);
                return;
              }
            }
          } catch (exchangeErr) {
            console.error('[OAuth Token Exchange Failed]:', exchangeErr);
          }
        }
      }

      const storedToken = localStorage.getItem('rip_auth_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // Purge any legacy mock tokens
      if (storedToken.startsWith('mock_oauth_')) {
        localStorage.removeItem('rip_auth_token');
        localStorage.removeItem('rip_user_profile');
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetchWithCandidateUrls('/me', {
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
        } else if (res.status === 401) {
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
      const res = await fetchWithCandidateUrls('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in. Please verify your credentials.');
      }

      localStorage.setItem('rip_auth_token', data.token);
      localStorage.setItem('rip_user_profile', JSON.stringify(data.user));
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
      const res = await fetchWithCandidateUrls('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account.');
      }

      localStorage.setItem('rip_auth_token', data.token);
      localStorage.setItem('rip_user_profile', JSON.stringify(data.user));
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
      const res = await fetchWithCandidateUrls('/register-with-cv', {
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
      localStorage.setItem('rip_user_profile', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      console.error('[CV Onboarding Error]:', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const initiateOAuth = (provider: 'google' | 'linkedin' | 'github') => {
    const clientId = provider === 'google'
      ? (import.meta.env.VITE_GOOGLE_CLIENT_ID || (import.meta.env.GOOGLE_CLIENT_ID as string) || '')
      : provider === 'github'
      ? (import.meta.env.VITE_GITHUB_CLIENT_ID || (import.meta.env.GITHUB_CLIENT_ID as string) || '')
      : (import.meta.env.VITE_LINKEDIN_CLIENT_ID || (import.meta.env.LINKEDIN_CLIENT_ID as string) || '');

    if (!clientId) {
      throw new Error(`Real ${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth requires VITE_${provider.toUpperCase()}_CLIENT_ID in your .env. Please enter your email address to sign in directly.`);
    }

    const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const redirectUri = window.location.origin;

    sessionStorage.setItem('rip_oauth_provider', provider);
    sessionStorage.setItem('rip_oauth_state', state);
    sessionStorage.setItem('rip_oauth_redirect_uri', redirectUri);

    let authUrl = '';
    if (provider === 'google') {
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&prompt=select_account&state=${state}`;
    } else if (provider === 'github') {
      authUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('read:user user:email')}&state=${state}`;
    } else if (provider === 'linkedin') {
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('openid profile email')}&state=${state}`;
    }

    window.location.href = authUrl;
  };

  const oauthLogin = async (provider: 'google' | 'linkedin' | 'github', userDetails?: { email?: string; fullName?: string }) => {
    // 1. If explicit userDetails with email is provided, perform verified direct OAuth sign-in with clean profile
    if (userDetails?.email && userDetails.email.trim().includes('@')) {
      setIsLoading(true);
      try {
        const subpath = provider === 'google' ? '/google' : (provider === 'linkedin' ? '/linkedin' : '/oauth');
        const res = await fetchWithCandidateUrls(subpath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            email: userDetails.email.trim(),
            fullName: userDetails.fullName?.trim()
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Authentication failed via ${provider}.`);
        }

        localStorage.setItem('rip_auth_token', data.token);
        localStorage.setItem('rip_user_profile', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return;
      } catch (err: any) {
        console.error(`[OAuth ${provider} Error]:`, err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    }

    // 2. Otherwise initiate real browser OAuth redirect with provider
    initiateOAuth(provider);
  };

  const claimDailyReward = async (): Promise<DailyClaimResult> => {
    const currentToken = token || localStorage.getItem('rip_auth_token');
    if (!currentToken || !user) {
      return {
        success: false,
        creditsAwarded: 0,
        tokensAwarded: 0,
        newStreak: 0,
        message: 'Please sign in or create an account to claim daily Research Coins (রিসার্চ কয়েন).'
      };
    }

    try {
      const res = await fetchWithCandidateUrls('/claim-daily-reward', {
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
        const res = await fetchWithCandidateUrls('/redeem-tokens', {
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
      throw new Error(`Insufficient Research Coins. You have ${user?.tokensBalance || 0} RC, but need ${tokenCost} RC.`);
    }

    setUser(prev => prev ? {
      ...prev,
      tokensBalance: (prev.tokensBalance || 10) - tokenCost,
      creditsRemaining: (prev.creditsRemaining || 10) + creditsToAdd,
      isPro: true
    } : null);

    return {
      success: true,
      message: `🌟 Successfully unlocked ${planId} with ${tokenCost} Research Coins (RC)! +${creditsToAdd} credits added.`
    };
  };

  const logout = () => {
    localStorage.removeItem('rip_auth_token');
    localStorage.removeItem('rip_user_profile');
    sessionStorage.removeItem('rip_oauth_provider');
    sessionStorage.removeItem('rip_oauth_state');
    sessionStorage.removeItem('rip_oauth_redirect_uri');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem('rip_user_profile', JSON.stringify(next));
      } catch {}
      return next;
    });
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
      initiateOAuth,
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
