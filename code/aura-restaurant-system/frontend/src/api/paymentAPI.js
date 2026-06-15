import axiosInstance from './axiosInstance';

const paymentAPI = {

  // PayHere initiate — single order (kept for compatibility)
  initiatePayHere: async (orderId) => {
    const response = await axiosInstance.post(`/payments/initiate/${orderId}`);
    return response.data;
  },

  // PayHere initiate — combined total of all unpaid orders for a table
  initiatePayHereForTable: async (tableId) => {
    const response = await axiosInstance.post(`/payments/initiate/table/${tableId}`);
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