/**
 * ============================================================
 *  AURA API Client — Account Settings
 * ============================================================
 *  [API ENDPOINT]: POST /api/auth/change-password
 * ============================================================
 */
import axiosInstance from './axiosInstance';

export const changePassword = async (currentPassword, newPassword) => {
  const response = await axiosInstance.post('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
};