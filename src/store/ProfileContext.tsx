import { createContext, ReactNode, useContext, useState } from 'react';
import { apiGet, apiPatch } from '../api/mobileAuth';

export type Profile = {
  name: string;
  gender: string;
  age: string;
  voiceGender: string;
  job: string;
  position: string;
  jobDetail: string;
  personality: string;
  hobby: string;
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
  job: '',
  position: '',
  jobDetail: '',
  personality: '',
  hobby: '',
  career: '',
  successStory: '',
  strengths: '',
  futureCareer: '',
  workChallenge: '',
  termGoal: '',
};

type ProfileContextValue = {
  profile: Profile;
  setField: (field: keyof Profile, value: string) => void;
  loadProfile: () => Promise<void>;
  saveProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(emptyProfile);

  const setField = (field: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  // ログイン直後・アプリ再起動時にサーバーから最新プロフィールを取得
  const loadProfile = async () => {
    const res = await apiGet<{ profile: Partial<Profile> }>('/me');
    setProfile((prev) => ({ ...prev, ...res.profile }));
  };

  // オンボーディング完了時・プロフィール編集保存時にサーバーへ反映
  const saveProfile = async () => {
    await apiPatch('/profile', profile);
  };

  return <ProfileContext.Provider value={{ profile, setField, loadProfile, saveProfile }}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
