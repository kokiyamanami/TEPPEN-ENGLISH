import { createContext, ReactNode, useContext, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../api/mobileAuth';

export type Profile = {
  name: string;
  gender: string;
  age: string;
  voiceGender: string;
  job: string[];
  position: string[];
  jobDetail: string;
  personality: string;
  hobby: string[];
  career: string;
  successStory: string;
  strengths: string;
  futureCareer: string;
  workChallenge: string;
  termGoal: string;
};

export const emptyProfile: Profile = {
  name: '',
  gender: '',
  age: '',
  voiceGender: '',
  job: [],
  position: [],
  jobDetail: '',
  personality: '',
  hobby: [],
  career: '',
  successStory: '',
  strengths: '',
  futureCareer: '',
  workChallenge: '',
  termGoal: '',
};

type MeResponse = { profile: Partial<Profile>; onboardingStep: string; onboardingComplete: boolean };

type ProfileContextValue = {
  profile: Profile;
  setField: <K extends keyof Profile>(field: K, value: Profile[K]) => void;
  loadProfile: () => Promise<{ onboardingStep: string; onboardingComplete: boolean }>;
  saveProfile: () => Promise<void>;
  saveOnboardingProgress: (step: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(emptyProfile);

  const setField = <K extends keyof Profile>(field: K, value: Profile[K]) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  // ログイン直後・アプリ再起動時にサーバーから最新プロフィールとオンボーディング進捗を取得
  const loadProfile = async () => {
    const res = await apiGet<MeResponse>('/me');
    setProfile((prev) => ({ ...prev, ...res.profile }));
    return { onboardingStep: res.onboardingStep, onboardingComplete: res.onboardingComplete };
  };

  // オンボーディング完了時・プロフィール編集保存時にサーバーへ反映
  const saveProfile = async () => {
    await apiPatch('/profile', profile);
  };

  // オンボーディング各ステップの「次へ」で呼び出し、途中離脱しても再開できるようにする
  const saveOnboardingProgress = async (step: string) => {
    await apiPost('/onboarding-progress', { step });
  };

  const completeOnboarding = async () => {
    await apiPost('/onboarding-complete');
  };

  return (
    <ProfileContext.Provider value={{ profile, setField, loadProfile, saveProfile, saveOnboardingProgress, completeOnboarding }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
