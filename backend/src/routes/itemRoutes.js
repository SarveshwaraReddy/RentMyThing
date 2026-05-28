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

const router = express.Router();

router
  .route("/")
  .get(getItems)
  .post(protect, uploadImages("images", 5), createItem);

router
  .route("/:id")
  .get(getItemById)
  .put(protect, uploadImages("images", 5), updateItem)
  .delete(protect, deleteItem);

export default router;
