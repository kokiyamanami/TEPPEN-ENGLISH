import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '../config/api';
import { useProfile } from '../store/ProfileContext';
import { colors } from '../theme/colors';

function resolveAvatarUri(url: string) {
  return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
}

// プロフィール画像の選択・アップロード。編集画面のアバターに使う
export function AvatarPicker({ size = 88 }: { size?: number }) {
  const { profile, avatarUrl, uploadAvatar } = useProfile();
  const [uploading, setUploading] = useState(false);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('写真へのアクセスが必要です', '端末の設定から写真ライブラリへのアクセスを許可してください。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    try {
      await uploadAvatar(result.assets[0].uri);
    } catch (e) {
      Alert.alert('アップロードに失敗しました', e instanceof Error ? e.message : '通信に失敗しました');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Pressable onPress={pick} disabled={uploading} style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      {avatarUrl ? (
        <Image source={{ uri: resolveAvatarUri(avatarUrl) }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.fallbackText, { fontSize: size * 0.36 }]}>{(profile.name || 'U').charAt(0)}</Text>
        </View>
      )}
      <View style={styles.badge}>
        {uploading ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="camera" size={14} color={colors.white} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
  image: { backgroundColor: colors.border },
  fallback: { backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: colors.white, fontWeight: '700' },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
});
