import { useAuth } from "@/src/contexts/AuthContext";
import { router } from "expo-router";
import {
  TouchableOpacity,
  StyleSheet,
  Image,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import moment from 'moment';
import { useState } from "react";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { changeUserInfo } from '@/api/user';
import { queryClient } from '../_layout';
import { ReadingCalendar } from "@/components/ReadingCalendar";

export default function UserProfile() {
  const { user, session, signOut, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setTempImageUri(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user?.id}-${Date.now()}.${fileExt}`;

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, decode(base64), {
        contentType: `image/${fileExt}`,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    if (user?.avatar_url) {
      const oldFilename = user.avatar_url.split('/').pop();
      if (oldFilename && oldFilename !== fileName) {
        await supabase.storage.from('avatars').remove([oldFilename]);
      }
    }

    return publicUrlData.publicUrl;
  };

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    setLoading(true);
    try {
      let finalAvatarUrl = avatarUrl;

      if (tempImageUri) {
        finalAvatarUrl = await uploadAvatar(tempImageUri);
      }

      await changeUserInfo(user?.id!, username.trim(), finalAvatarUrl || undefined);

      queryClient.invalidateQueries({ queryKey: ['user-info'] });
      await refreshUser();

      setAvatarUrl(finalAvatarUrl);
      setTempImageUri(null);
      setIsEditing(false);

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUsername(user?.username || '');
    setAvatarUrl(user?.avatar_url || '');
    setTempImageUri(null);
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <IconSymbol name="chevron.left" size={24} color="#2D3436" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={[styles.cowSpotDecor, styles.spotTop]} />
            <View style={[styles.cowSpotDecor, styles.spotBottom]} />
            <View style={[styles.cowSpotDecor, styles.spotMiddle]} />

            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                {tempImageUri ? (
                  <Image
                    source={{ uri: tempImageUri }}
                    style={styles.avatar}
                  />
                ) : (avatarUrl || user?.avatar_url) ? (
                  <Image
                    source={{ uri: (avatarUrl || user?.avatar_url) ?? undefined }}
                    style={styles.avatar}
                  />
                ) : (
                  <Image
                    source={require("@/assets/images/user-avatar.png")}
                    style={styles.avatar}
                  />
                )}

                {isEditing && (
                  <TouchableOpacity
                    style={styles.avatarEditButton}
                    onPress={pickImage}
                    disabled={loading}
                  >
                    <IconSymbol name="camera.fill" size={20} color="#FF6B8B" />
                  </TouchableOpacity>
                )}
              </View>

              {isEditing ? (
                <TextInput
                  style={styles.userNameInput}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />
              ) : (
                <Text style={styles.userName}>{user?.username}</Text>
              )}
            </View>
          </View>

          {/* User Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Account Information</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <IconSymbol name="person.circle" size={20} color="#8B7355" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Username</Text>
                  <Text style={styles.infoValue}>{username}</Text>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <IconSymbol name="envelope" size={20} color="#8B7355" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <IconSymbol name="calendar" size={20} color="#8B7355" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>{moment(session?.user?.created_at).format('MMMM Do YYYY')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Reading Progress Barn */}
          <View style={styles.progressBarn}>
            <View style={styles.barnRoof}>
              <View style={styles.barnRoofPeak} />
            </View>
            <View style={styles.barnBody}>
              <Text style={styles.barnTitle}>Reading Journey</Text>
              <Text style={styles.barnDescription}>
                You've collected {user?.total_books || 0} {(user?.total_books || 0) === 1 ? 'book' : 'books'} in your library
              </Text>
            </View>
          </View>

          {/* Reading Calendar */}
          <ReadingCalendar />

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isEditing ? (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.saveButton,
                    pressed && styles.buttonPressed,
                    loading && styles.buttonDisabled
                  ]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && styles.buttonPressed
                  ]}
                  onPress={handleCancel}
                  disabled={loading}
                >
                  <IconSymbol name="xmark.circle" size={20} color="#FF6B8B" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed
                  ]}
                  onPress={() => setIsEditing(true)}
                >
                  <IconSymbol name="pencil" size={20} color="#FF6B8B" />
                  <Text style={styles.secondaryButtonText}>Edit Profile</Text>
                </Pressable>

                <TouchableOpacity
                  style={styles.signOutButton}
                  onPress={() => signOut()}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="arrow.right.circle.fill" size={20} color="#FFFFFF" />
                  <Text style={styles.signOutButtonText}>Sign Out</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8F3",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF8F3",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2D3436",
  },
  placeholder: {
    width: 40,
  },
  profileCard: {
    backgroundColor: "#FF6B8B",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#FF6B8B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  cowSpotDecor: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 50,
  },
  spotTop: {
    width: 80,
    height: 80,
    top: -20,
    right: 30,
  },
  spotBottom: {
    width: 60,
    height: 60,
    bottom: -15,
    left: 40,
  },
  spotMiddle: {
    width: 40,
    height: 40,
    top: 50,
    right: -10,
  },
  avatarSection: {
    alignItems: "center",
    zIndex: 2,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
  },
  avatarEditButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  userNameInput: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    minWidth: 200,
    textAlign: "center",
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F5E6D3",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF8F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#8B7355",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#2D3436",
    fontWeight: "500",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#F5E6D3",
    marginHorizontal: 16,
  },
  progressBarn: {
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  barnRoof: {
    height: 40,
    backgroundColor: "#FF6B8B",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "relative",
  },
  barnRoofPeak: {
    position: "absolute",
    top: -15,
    left: "50%",
    marginLeft: -30,
    width: 0,
    height: 0,
    borderLeftWidth: 30,
    borderRightWidth: 30,
    borderBottomWidth: 15,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FF6B8B",
  },
  barnBody: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#F5E6D3",
  },
  barnTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 8,
  },
  barnDescription: {
    fontSize: 14,
    color: "#8B7355",
    marginBottom: 12,
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: "#FF6B8B",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#8BCA5B",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#8BCA5B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "#FFE5EC",
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    color: "#FF6B8B",
    fontSize: 16,
    fontWeight: "600",
  },
  signOutButton: {
    backgroundColor: "#FF6B8B",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#FF6B8B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  signOutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});