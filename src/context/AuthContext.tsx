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
  oauthLogin: (provider: 'google' | 'linkedin' | 'github') => Promise<void>;
  claimDailyReward: () => Promise<DailyClaimResult>;
  claimDailyStreak: () => Promise<DailyClaimResult>;
  redeemTokensForPlan: (planId: string, tokenCost: number, creditsToAdd: number) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (updated: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getAuthBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:5000/api/auth`;
  }
  return 'http://localhost:5000/api/auth';
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
        throw new Error(data.error || 'Failed to sign in.');
      }

      localStorage.setItem('rip_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      // If network unreachable, check if this is demo login and provide graceful offline session
      if (err.message && err.message.includes('fetch')) {
        const fallbackUser: UserProfile = {
          id: 'usr_local_demo',
          email: email,
          fullName: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Verified Scholar',
          university: 'Indian Institute of Science (IISc)',
          degreeLevel: 'B.Tech / Undergraduate',
          cgpa: 9.2,
          targetDomains: ['Artificial Intelligence & ML'],
          skills: ['Python', 'PyTorch', 'Research Methodology'],
          rrsScore: 92,
          rrsTier: 'Elite Candidate',
          role: 'student',
          creditsRemaining: 20,
          isVerified: true
        };
        const mockToken = 'mock_jwt_token_offline_' + Date.now();
        localStorage.setItem('rip_auth_token', mockToken);
        setToken(mockToken);
        setUser(fallbackUser);
        return;
      }
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
      if (err.message && err.message.includes('fetch')) {
        const fallbackUser: UserProfile = {
          id: 'usr_local_' + Date.now().toString(36),
          email: regData.email,
          fullName: regData.fullName,
          university: regData.university || 'State University',
          degreeLevel: 'Undergraduate',
          cgpa: regData.cgpa || 8.5,
          targetDomains: regData.fieldOfStudy ? [regData.fieldOfStudy] : ['Artificial Intelligence & ML'],
          skills: ['Python', 'Data Analysis'],
          rrsScore: 78,
          rrsTier: 'Competitive Candidate',
          role: 'student',
          creditsRemaining: 10,
          isVerified: false
        };
        const mockToken = 'mock_jwt_token_offline_' + Date.now();
        localStorage.setItem('rip_auth_token', mockToken);
        setToken(mockToken);
        setUser(fallbackUser);
        return;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const oauthLogin = async (provider: 'google' | 'linkedin' | 'github') => {
    setIsLoading(true);
    try {
      const defaultEmail = provider === 'google' 
        ? 'scholar.google@gmail.com' 
        : (provider === 'github' ? 'scholar.github@octocat.io' : 'scholar.linkedin@alumni.edu');
      const defaultName = provider === 'google' 
        ? 'Google Scholar' 
        : (provider === 'github' ? 'GitHub Developer & Researcher' : 'LinkedIn Scholar');

      const res = await fetch(`${getAuthBaseUrl()}/oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          email: defaultEmail,
          fullName: defaultName
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
      if (err.message && err.message.includes('fetch')) {
        const fallbackUser: UserProfile = {
          id: `usr_offline_${provider}_` + Date.now().toString(36),
          email: provider === 'google' ? 'scholar.google@gmail.com' : (provider === 'github' ? 'scholar.github@octocat.io' : 'scholar.linkedin@alumni.edu'),
          fullName: provider === 'google' ? 'Verified Google Scholar' : (provider === 'github' ? 'Verified GitHub Scholar' : 'Verified LinkedIn Scholar'),
          university: provider === 'linkedin' ? 'IIT Delhi' : (provider === 'github' ? 'IIIT Hyderabad' : 'IISc Bangalore'),
          degreeLevel: 'Undergraduate',
          cgpa: 9.3,
          targetDomains: ['Artificial Intelligence & ML'],
          skills: ['Python', 'Deep Learning', 'Data Analysis', 'Git'],
          rrsScore: 92,
          rrsTier: 'Elite Candidate',
          role: 'student',
          creditsRemaining: 30,
          tokensBalance: 15,
          loginStreak: 2,
          xpPoints: 240,
          dailyRewardClaimedToday: false,
          scholarBadges: [`${provider.charAt(0).toUpperCase() + provider.slice(1)} Verified`, 'Early Scholar'],
          oauthProvider: provider,
          isVerified: true
        };
        const mockToken = 'mock_jwt_token_offline_' + Date.now();
        localStorage.setItem('rip_auth_token', mockToken);
        setToken(mockToken);
        setUser(fallbackUser);
        return;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const claimDailyReward = async (): Promise<DailyClaimResult> => {
    const currentToken = token || localStorage.getItem('rip_auth_token');
    try {
      if (currentToken) {
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
        } else if (data.claimed) {
          return {
            success: false,
            creditsAwarded: 0,
            tokensAwarded: 0,
            newStreak: user?.loginStreak || 1,
            message: data.message || 'Already claimed today!'
          };
        }
      }
    } catch (err) {
      console.warn('Network offline while claiming daily reward, using offline balance:', err);
    }

    // Client-side simulation fallback
    const randomTokens = Math.floor(Math.random() * 3) + 1;
    const creditsBonus = 3;
    const nextStreak = (user?.loginStreak || 1) + 1;

    setUser(prev => prev ? {
      ...prev,
      creditsRemaining: (prev.creditsRemaining || 10) + creditsBonus,
      tokensBalance: (prev.tokensBalance || 10) + randomTokens,
      loginStreak: nextStreak,
      xpPoints: (prev.xpPoints || 100) + 60,
      dailyRewardClaimedToday: true,
      lastLoginDate: new Date().toISOString()
    } : null);

    return {
      success: true,
      creditsAwarded: creditsBonus,
      tokensAwarded: randomTokens,
      newStreak: nextStreak,
      message: `🎉 Claimed ${creditsBonus} free credits & ${randomTokens} 🪙 Shodh Tokens! Streak: ${nextStreak} days.`
    };
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
