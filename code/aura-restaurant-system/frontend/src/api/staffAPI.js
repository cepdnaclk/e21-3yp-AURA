/**
 * ============================================================
 *  AURA API Client — Staff Management
 * ============================================================
 *  [API ENDPOINT]: GET  /api/admin/staff
 *  [API ENDPOINT]: POST /api/admin/staff/register
 * ============================================================
 */
import axiosInstance from './axiosInstance';

export const getStaffList = async () => {
  const response = await axiosInstance.get('/admin/staff');
  return response.data;
};

export const registerStaff = async (staffData) => {
  const response = await axiosInstance.post('/admin/staff/register', staffData);
  return response.data;
};