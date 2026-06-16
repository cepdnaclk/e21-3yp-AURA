/**
 * ============================================================
 *  AURA API Client — Admin Analytics
 * ============================================================
 *  [API ENDPOINT]: GET /api/admin/stats
 *  [API ENDPOINT]: GET /api/admin/revenue?status=PAID
 * ============================================================
 */
import axiosInstance from './axiosInstance';

export const getAdminStats = async () => {
  const response = await axiosInstance.get('/admin/stats');
  return response.data;
};

export const getRevenue = async (status = 'PAID') => {
  const response = await axiosInstance.get('/admin/revenue', { params: { status } });
  return response.data;
};