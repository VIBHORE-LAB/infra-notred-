import { useCallback, useState } from 'react';
import instance, { getApiErrorMessage } from '@/api/api';
import { AuthUser, useAuth } from '@/context/AuthContext';

export const useProfile = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveProfile = useCallback(
    async (payload: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      bio?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await instance.patch('/user/profile', { payload });
        const updatedUser = response.data?.data?.user as Partial<AuthUser>;
        if (updatedUser) {
          updateUser(updatedUser);
        }
        return updatedUser;
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to update the profile'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [updateUser]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      setUploadingAvatar(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await instance.post('/user/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const avatarUrl = response.data?.data?.avatarUrl as string | undefined;
        if (avatarUrl) {
          updateUser({ avatarUrl });
        }
        return avatarUrl ?? null;
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to upload the avatar'));
        return null;
      } finally {
        setUploadingAvatar(false);
      }
    },
    [updateUser]
  );

  return {
    user,
    loading,
    uploadingAvatar,
    error,
    saveProfile,
    uploadAvatar,
    refreshUser,
  };
};
