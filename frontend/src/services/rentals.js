import api from "./api.js";

const requestRental = (payload) => api.post("/rentals", payload);

const getUserRentals = (role) => api.get("/rentals", { params: { role } });

const getRental = (id) => api.get(`/rentals/${id}`);

const getChatHistory = (id) => api.get(`/rentals/${id}/messages`);

const approveRental = (id) => api.post(`/rentals/${id}/approve`);

const rejectRental = (id) => api.post(`/rentals/${id}/reject`);

const verifyOTP = (id, otp) => api.post(`/rentals/${id}/verify-otp`, { otp });

const completeRental = (id) => api.post(`/rentals/${id}/complete`);

export default {
  requestRental,
  getUserRentals,
  getRental,
  getChatHistory,
  approveRental,
  rejectRental,
  verifyOTP,
  completeRental,
};
