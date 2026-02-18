import api from './api';

/**
 * Admin Service - Admin dashboard stats & scheme management
 */

// ─── Stats ──────────────────────────────────────────────────────────────────

export const getAdminStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch admin stats' };
  }
};

export const getAllUsers = async (params = {}) => {
  try {
    const response = await api.get('/admin/users', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch users' };
  }
};

// ─── Schemes (Admin CRUD) ───────────────────────────────────────────────────

export const getAdminSchemes = async (params = {}) => {
  try {
    const response = await api.get('/admin/schemes', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch schemes' };
  }
};

export const createScheme = async (data) => {
  try {
    const response = await api.post('/admin/schemes', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create scheme' };
  }
};

export const updateScheme = async (id, data) => {
  try {
    const response = await api.put(`/admin/schemes/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update scheme' };
  }
};

export const deleteScheme = async (id) => {
  try {
    const response = await api.delete(`/admin/schemes/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete scheme' };
  }
};

// ─── Public Schemes (for farmers) ───────────────────────────────────────────

export const getPublicSchemes = async (params = {}) => {
  try {
    const response = await api.get('/admin/schemes/public', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch schemes' };
  }
};

export default {
  getAdminStats,
  getAllUsers,
  getAdminSchemes,
  createScheme,
  updateScheme,
  deleteScheme,
  getPublicSchemes
};
