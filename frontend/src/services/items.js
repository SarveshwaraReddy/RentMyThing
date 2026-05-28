import api from "./api.js";

const getItems = (params) => api.get("/items", { params });

const getItem = (id) => api.get(`/items/${id}`);

const createItem = (formData) =>
  api.post("/items", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

const updateItem = (id, formData) =>
  api.put(`/items/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

const deleteItem = (id) => api.delete(`/items/${id}`);

export default {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
};
