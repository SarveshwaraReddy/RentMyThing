import express from "express";
import {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} from "../controllers/itemController.js";
import protect from "../middleware/auth.js";
import { uploadImages } from "../middleware/upload.js";
import { validateItem } from "../validators/inputValidator.js";

const router = express.Router();

router
  .route("/")
  .get(getItems)
  .post(protect, uploadImages("images", 5), validateItem, createItem);

router
  .route("/:id")
  .get(getItemById)
  .put(protect, uploadImages("images", 5), validateItem, updateItem)
  .delete(protect, deleteItem);

export default router;
