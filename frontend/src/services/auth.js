import api from "./api.js";

const register = (payload) => api.post("/auth/register", payload);
const login = (payload) => api.post("/auth/login", payload);
const logout = () => api.post("/auth/logout");
const getProfile = () => api.get("/auth/me");

export default {
  register,
  login,
  logout,
  getProfile,
};
