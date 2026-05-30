import api from "./api.js";

const getUserProfile = (id) => api.get(`/users/${id}`);

const getUserReviews = (id) => api.get(`/users/${id}/reviews`);

const updateProfile = (formData) => api.put("/users/profile", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

export default {
  getUserProfile,
  getUserReviews,
  updateProfile,
};
