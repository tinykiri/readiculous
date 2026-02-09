import { axiosInstance } from '.';
import { User } from '@/src/types';

const BASE_URL = "/user";

export const getUserProfile = async (userId: string): Promise<User> => {
  const { data } = await axiosInstance.get(`${BASE_URL}/${userId}/profile`);
  return data;
};

export const changeUserInfo = async (userId: string, username: string, avatar_url?: string): Promise<User> => {
  const { data } = await axiosInstance.put(`${BASE_URL}/${userId}/edit-profile`, {
    username,
    avatar_url,
  });

  return data;
};