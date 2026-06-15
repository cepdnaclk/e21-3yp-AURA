import axiosInstance from './axiosInstance';

const reservationAPI = {

  // Customer public form — no auth token needed
  createPublic: async (data) => {
    const response = await axiosInstance.post('/reservations/public', data);
    return response.data;
  },

  // Admin — get all reservations
  getAll: async () => {
    const response = await axiosInstance.get('/reservations');
    return response.data;
  },

  // Admin — confirm reservation (tick button)
  confirm: async (id) => {
    const response = await axiosInstance.patch(`/reservations/${id}/confirm`);
    return response.data;
  },

  // Admin — cancel reservation
  cancel: async (id) => {
    const response = await axiosInstance.patch(`/reservations/${id}/cancel`);
    return response.data;
  },
};

export default reservationAPI;