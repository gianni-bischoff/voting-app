"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import PocketBase from 'pocketbase';
import { DiscordMetaData } from '@/types/discord';

export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase-voting.wildblood.dev/');

export interface AuthUser {
  id: string;
  username: string;
  avatarUrl?: string;
  isManager: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (pb.authStore.isValid) {
      setUser({
        id: pb.authStore.model?.id,
        username: pb.authStore.model?.name,
        avatarUrl: pb.authStore.model?.avatarUrl,
        isManager: pb.authStore.model?.isManager || false
      });
    }
  };

  const login = async () => {
    try {
      const authData = await pb.collection('users').authWithOAuth2({
        provider: 'discord',
        scopes: ['identify', 'email'],
      });
      
      if (authData.record) {
        let userData: DiscordMetaData = authData.meta?.rawUser as DiscordMetaData;
        const updatedUser = await pb.collection('users').update(authData.record.id, {
          name: userData.global_name,
          avatarUrl: authData.meta?.avatarUrl
        });
        setUser({
          id: authData.record.id,
          username: updatedUser.name,
          avatarUrl: authData.record.avatarUrl,
          isManager: updatedUser.isManager || false
        });
      } else {
        console.error('No user record in auth response');
        alert('Login failed: No user record found');
      }
    } catch (error) {
      console.error('Login failed:', error);
      if (error instanceof Error) {
        alert(`Login failed: ${error.message}`);
      } else {
        alert('Login failed. Please check console for details.');
      }
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
