/**
 * ============================================================
 *  Menu API Service
 * ============================================================
 *  Handles all menu-related API calls.
 *  Backend expects multipart/form-data with @ModelAttribute.
 *  Do NOT set Content-Type manually — axios sets it with the
 *  correct multipart boundary automatically.
 * ============================================================
 */

import axiosInstance from './axiosInstance';

export const menuAPI = {
  /**
   * Get all menu items
   */
  getAllMenuItems: async () => {
    try {
      const response = await axiosInstance.get('/menu');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch menu items:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get menu item by ID
   * @param {number} id - Menu item ID
   */
  getMenuItemById: async (id) => {
    try {
      const response = await axiosInstance.get(`/menu/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch menu item ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get menu items by category
   * @param {string} category - Category name
   */
  getByCategory: async (category) => {
    try {
      const response = await axiosInstance.get(`/menu/category/${category}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch menu items for category ${category}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get available menu items
   */
  getAvailableItems: async () => {
    try {
      const response = await axiosInstance.get('/menu/available');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch available items:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Search menu items by name
   * @param {string} keyword - Search keyword
   */
  searchByName: async (keyword) => {
    try {
      const response = await axiosInstance.get('/menu/search', {
        params: { keyword },
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to search menu items for "${keyword}":`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create new menu item (admin only)
   * Sends multipart/form-data to match @ModelAttribute + @RequestParam("file")
   * on the Spring controller. Do NOT set Content-Type header manually.
   *
   * @param {Object} menuItem - Menu item fields (must match MenuItem entity field names exactly)
   * @param {File|null} file  - Optional image file
   */
  createMenuItem: async (menuItem, file = null) => {
  try {
    const formData = new FormData();

    Object.keys(menuItem).forEach((key) => {
      const value = menuItem[key];
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    if (file) {
      formData.append('file', file);
    }

    const response = await axiosInstance.post('/menu', formData, {
      headers: {
        'Content-Type': undefined, // ← delete the global default
      },                           //   axios then sets multipart + boundary automatically
    });
    return response.data;
  } catch (error) {
    console.error('Failed to create menu item:', error.response?.data || error.message);
    throw error;
  }
},
  /**
   * Update menu item (admin only)
   * Same multipart approach as create.
   *
   * @param {number} id       - Menu item ID
   * @param {Object} menuItem - Updated fields
   * @param {File|null} file  - Optional new image file
   */
  updateMenuItem: async (id, menuItem, file = null) => {
    try {
      const formData = new FormData();

      Object.keys(menuItem).forEach((key) => {
        const value = menuItem[key];
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      if (file) {
        formData.append('file', file);
      }

      const response = await axiosInstance.put(`/menu/${id}`, formData, {
        headers: {
            'Content-Type': undefined,
        },
        });
      return response.data;
    } catch (error) {
      console.error(`Failed to update menu item ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Toggle availability of a menu item
   * @param {number} id - Menu item ID
   */
  toggleAvailability: async (id) => {
    try {
      const response = await axiosInstance.patch(`/menu/${id}/availability`);
      return response.data;
    } catch (error) {
      console.error(`Failed to toggle availability for item ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Delete a menu item by ID
   * @param {number} id - Menu item ID
   */
  deleteMenuItem: async (id) => {
    try {
      const response = await axiosInstance.delete(`/menu/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete menu item ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },
};

export default menuAPI;