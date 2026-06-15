import axiosInstance from './axiosInstance';

const paymentAPI = {

  // PayHere initiate — single order (kept for compatibility)
  initiatePayHere: async (orderId) => {
    const response = await axiosInstance.post(`/payments/initiate/${orderId}`);
    return response.data;
  },

  // PayHere initiate — only the specific orders passed from the frontend session
  initiatePayHereForTable: async (tableId, orderIds) => {
    const response = await axiosInstance.post(
      `/payments/initiate/table/${tableId}`,
      orderIds ?? null
    );
    return response.data;
  },

  // Cash payment record කරනවා
  recordCashPayment: async (orderId, amount) => {
    const response = await axiosInstance.post('/payments/cash', {
      orderId,
      amount,
      paymentMethod: 'CASH',
    });
    return response.data;
  },

  // Table bill ගන්නවා
  getBillByTable: async (tableId) => {
    const response = await axiosInstance.get(`/payments/bill/table/${tableId}`);
    return response.data;
  },
};

export default paymentAPI;