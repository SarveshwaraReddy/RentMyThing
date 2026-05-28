import api from "./api.js";

const getUserProfile = (id) => api.get(`/users/${id}`);

const getUserReviews = (id) => api.get(`/users/${id}/reviews`);

export default {
  getUserProfile,
  getUserReviews,
};
